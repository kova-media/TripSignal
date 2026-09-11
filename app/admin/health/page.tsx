import { redirect } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import RunButton from './run-button';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError } from '@/lib/admin';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

type Check = { name: string; status: 'ok' | 'warning' | 'error'; detail: string };

export default async function AdminHealthPage() {
  try {
    await requireAdmin();
    const checks: Check[] = [];
    let db = getDb();

    try {
      await ensureSchema();
      await db.query('select 1');
      checks.push({ name: 'Database', status: 'ok', detail: 'Connection and schema are available.' });
    } catch (error) {
      checks.push({ name: 'Database', status: 'error', detail: error instanceof Error ? error.message : 'Database check failed.' });
    }

    const envChecks = [
      ['CRON_SECRET', Boolean(process.env.CRON_SECRET), 'Scheduled alert worker authentication'],
      ['RESEND_API_KEY', Boolean(process.env.RESEND_API_KEY), 'Fare and account email delivery'],
      ['STRIPE_SECRET_KEY', Boolean(process.env.STRIPE_SECRET_KEY), 'Stripe billing operations'],
      ['ADMIN_EMAILS', Boolean(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL), 'Admin authorization'],
    ] as const;
    for (const [name, configured, purpose] of envChecks) {
      checks.push({ name, status: configured ? 'ok' : 'error', detail: configured ? `${purpose} configured.` : `${purpose} is not configured.` });
    }

    if (checks[0]?.status === 'ok') {
      const [runs, due, stuck, signals, users, alerts] = await Promise.all([
        db.query<{ total: string; errors: string; recent: string }>(`select count(*)::text total, count(*) filter (where status = 'error' and started_at >= now() - interval '24 hours')::text errors, count(*) filter (where started_at >= now() - interval '24 hours')::text recent from alert_runs`),
        db.query<{ count: string }>(`select count(*)::text count from alerts where active = true and (last_checked_at is null or (frequency = 'Weekly' and last_checked_at <= now() - interval '7 days') or (frequency = 'Monthly' and last_checked_at <= now() - interval '30 days'))`),
        db.query<{ count: string }>(`select count(*)::text count from alert_runs where status = 'running' and started_at <= now() - interval '30 minutes'`),
        db.query<{ total: string; recent: string }>(`select count(*)::text total, count(*) filter (where sent_at >= now() - interval '24 hours')::text recent from signals`),
        db.query<{ total: string; pro: string }>(`select count(*)::text total, count(*) filter (where plan <> 'free' or subscription_status in ('active','trialing'))::text pro from users`),
        db.query<{ total: string; active: string }>(`select count(*)::text total, count(*) filter (where active)::text active from alerts`),
      ]);
      const run = runs.rows[0];
      const dueCount = Number(due.rows[0]?.count ?? 0);
      const stuckCount = Number(stuck.rows[0]?.count ?? 0);
      const errorCount = Number(run?.errors ?? 0);
      checks.push({ name: 'Alert worker', status: stuckCount ? 'error' : errorCount ? 'warning' : 'ok', detail: `${run?.recent ?? 0} runs in the last 24 hours · ${errorCount} failures · ${dueCount} alerts currently due.` });
      checks.push({ name: 'Worker queue', status: stuckCount ? 'error' : 'ok', detail: stuckCount ? `${stuckCount} running searches have exceeded 30 minutes.` : 'No searches appear stuck.' });
      checks.push({ name: 'Fare signals', status: 'ok', detail: `${signals.rows[0]?.recent ?? 0} signals sent in the last 24 hours · ${signals.rows[0]?.total ?? 0} all time.` });
      checks.push({ name: 'Accounts', status: 'ok', detail: `${users.rows[0]?.total ?? 0} total accounts · ${users.rows[0]?.pro ?? 0} Pro accounts.` });
      checks.push({ name: 'Alerts', status: dueCount ? 'warning' : 'ok', detail: `${alerts.rows[0]?.active ?? 0} active of ${alerts.rows[0]?.total ?? 0} total · ${dueCount} due.` });
    }

    const errorChecks = checks.filter((check) => check.status === 'error');
    const warningChecks = checks.filter((check) => check.status === 'warning');
    const overall = errorChecks.length ? 'Action required' : warningChecks.length ? 'Needs attention' : 'Operational';

    return <main className={styles.page}>
      <SiteHeader authenticated primaryHref="/profile" primaryLabel="Profile" />
      <section className="shell"><div className={styles.main}>
        <div className={styles.detailBack}><Link href="/admin">← Back to Operations</Link></div>
        <div className={styles.masthead}>
          <div><p className={styles.eyebrow}>System health</p><h1 className={styles.title}>Diagnostics</h1><p className={styles.subhead}>Live operational checks for TripSignal.</p></div>
          <span className={`${styles.adminBadge} ${errorChecks.length ? styles.error : warningChecks.length ? '' : styles.success}`}>{overall.toUpperCase()}</span>
        </div>

        <section className={styles.grid}>
          <div className={styles.metric}><span>Overall</span><strong>{overall}</strong><small>{errorChecks.length} errors · {warningChecks.length} warnings</small></div>
          <div className={styles.metric}><span>Checks</span><strong>{checks.length}</strong><small>Live diagnostics</small></div>
          <div className={styles.metric}><span>Errors</span><strong>{errorChecks.length}</strong><small>Require action</small></div>
          <div className={styles.metric}><span>Warnings</span><strong>{warningChecks.length}</strong><small>Worth reviewing</small></div>
          <div className={styles.metric}><span>Checked</span><strong>{new Date().toLocaleTimeString()}</strong><small>Server time</small></div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Diagnostics</p><h2>Service checks</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span className={styles.sectionNote}>No secret values are displayed</span><RunButton /></div></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Service</span><span>Status</span><span>Check</span><span>Details</span></div>
            {checks.map((check) => <div className={styles.tableRow} key={check.name}><div><strong>{check.name}</strong></div><span className={check.status === 'error' ? styles.error : check.status === 'ok' ? styles.success : ''}>{check.status}</span><span>{check.status === 'ok' ? 'Healthy' : check.status === 'warning' ? 'Review' : 'Action required'}</span><span>{check.detail}</span></div>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Security</p><h2>Administrative controls</h2></div></div>
          <div className={styles.detailCard}>
            <div><span>Admin authorization</span><strong>Required on admin pages and admin API actions</strong></div>
            <div><span>Cron authentication</span><strong>Bearer secret required</strong></div>
            <div><span>Secrets</span><strong>Server-side only</strong></div>
            <div><span>Audit logging</span><strong>Administrative actions recorded</strong></div>
          </div>
        </section>

        <p className={styles.detailFootnote}>Diagnostics are read-only. The manual alert control runs due alerts and may execute flight searches and send fare emails.</p>
      </div></section>
    </main>;
  } catch (error) {
    if (isAdminError(error)) redirect('/signin');
    throw error;
  }
}
