import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError } from '@/lib/admin';
import AdminAlertActions from './admin-alert-actions';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

function formatDate(value: string | Date | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function formatCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? '?');
  const destination = String(criteria.destination ?? 'Anywhere');
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : criteria.cabin === 'first' ? 'First' : 'Economy';
  return `${origin} → ${destination} · ${cabin} · $${Number(criteria.maxPrice ?? 0).toLocaleString()}`;
}

export default async function AdminPage() {
  try {
    await ensureSchema();
    const admin = await requireAdmin();
    const db = getDb();

    const [userCounts, alertCounts, signalCounts, runCounts, recentUsers, recentAlerts, recentRuns, recentAudit] = await Promise.all([
      db.query<{ total: string; free: string; pro: string; last_7d: string; last_30d: string }>(
        `select count(*)::text as total,
                count(*) filter (where plan = 'free')::text as free,
                count(*) filter (where plan <> 'free' or subscription_status in ('active','trialing'))::text as pro,
                count(*) filter (where created_at >= now() - interval '7 days')::text as last_7d,
                count(*) filter (where created_at >= now() - interval '30 days')::text as last_30d
         from users`,
      ),
      db.query<{ total: string; active: string; due: string }>(
        `select count(*)::text as total,
                count(*) filter (where active)::text as active,
                count(*) filter (where active and (last_checked_at is null or (frequency = 'Weekly' and last_checked_at <= now() - interval '7 days') or (frequency = 'Monthly' and last_checked_at <= now() - interval '30 days')))::text as due
         from alerts`,
      ),
      db.query<{ total: string; last_30d: string }>(
        `select count(*)::text as total, count(*) filter (where sent_at >= now() - interval '30 days')::text as last_30d from signals`,
      ),
      db.query<{ total: string; errors: string; last_24h: string }>(
        `select count(*)::text as total,
                count(*) filter (where status = 'error')::text as errors,
                count(*) filter (where started_at >= now() - interval '24 hours')::text as last_24h
         from alert_runs`,
      ),
      db.query<{ email: string; name: string | null; plan: string; subscription_status: string; created_at: string }>(
        `select email, name, plan, subscription_status, created_at from users order by created_at desc limit 12`,
      ),
      db.query<{ id: string; email: string; criteria: Record<string, unknown>; frequency: string; active: boolean; last_checked_at: string | null; created_at: string }>(
        `select a.id, a.email, a.criteria, a.frequency, a.active, a.last_checked_at, a.created_at
         from alerts a order by a.created_at desc limit 20`,
      ),
      db.query<{ id: string; alert_id: string; status: string; started_at: string; finished_at: string | null; offers_found: number; email_sent: boolean; error_message: string | null; email: string }>(
        `select r.id, r.alert_id, r.status, r.started_at, r.finished_at, r.offers_found, r.email_sent, r.error_message, a.email
         from alert_runs r join alerts a on a.id = r.alert_id
         order by r.started_at desc limit 20`,
      ),
      db.query<{ id: string; admin_email: string; action: string; target_type: string | null; target_id: string | null; created_at: string }>(
        `select id, admin_email, action, target_type, target_id, created_at from admin_audit_log order by created_at desc limit 15`,
      ),
    ]);

    const u = userCounts.rows[0];
    const a = alertCounts.rows[0];
    const s = signalCounts.rows[0];
    const r = runCounts.rows[0];

    return <main className={styles.page}>
      <SiteHeader authenticated primaryHref="/profile" primaryLabel="Profile" />
      <section className="shell"><div className={styles.main}>
        <div className={styles.masthead}>
          <div><p className={styles.eyebrow}>TripSignal administration</p><h1 className={styles.title}>Operations</h1><p className={styles.subhead}>Signed in as {admin.email}</p></div>
          <span className={styles.adminBadge}>ADMIN</span>
        </div>

        <section className={styles.grid}>
          <div className={styles.metric}><span>Users</span><strong>{u?.total ?? 0}</strong><small>{u?.last_7d ?? 0} in 7 days · {u?.last_30d ?? 0} in 30 days</small></div>
          <div className={styles.metric}><span>Pro users</span><strong>{u?.pro ?? 0}</strong><small>{u?.free ?? 0} free accounts</small></div>
          <div className={styles.metric}><span>Active alerts</span><strong>{a?.active ?? 0}</strong><small>{a?.due ?? 0} currently due</small></div>
          <div className={styles.metric}><span>Fare signals</span><strong>{s?.last_30d ?? 0}</strong><small>{s?.total ?? 0} all time</small></div>
          <div className={styles.metric}><span>Search runs</span><strong>{r?.last_24h ?? 0}</strong><small>{r?.errors ?? 0} errors all time</small></div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Users</p><h2>Recent accounts</h2></div><span className={styles.sectionNote}>Showing {recentUsers.rows.length}</span></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Email</span><span>Plan</span><span>Status</span><span>Created</span></div>
            {recentUsers.rows.map((user) => <div className={styles.tableRow} key={user.email}><div><strong>{user.name || user.email.split('@')[0]}</strong><small>{user.email}</small></div><span>{user.plan === 'free' ? 'Free' : 'Pro'}</span><span>{user.subscription_status}</span><span>{formatDate(user.created_at)}</span></div>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Alerts</p><h2>Active monitoring</h2></div><span className={styles.sectionNote}>{a?.total ?? 0} total · {a?.due ?? 0} due</span></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Alert</span><span>Frequency</span><span>Last checked</span><span>Action</span></div>
            {recentAlerts.rows.map((alert) => <div className={styles.tableRow} key={alert.id}><div><strong>{formatCriteria(alert.criteria)}</strong><small>{alert.email}</small></div><span>{alert.frequency}</span><span>{formatDate(alert.last_checked_at)}</span><AdminAlertActions id={alert.id} active={alert.active} /></div>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>System health</p><h2>Recent search runs</h2></div><span className={styles.sectionNote}>{r?.errors ?? 0} errors recorded</span></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Account</span><span>Result</span><span>Started</span><span>Details</span></div>
            {recentRuns.rows.map((run) => <div className={styles.tableRow} key={run.id}><div><strong>{run.email}</strong><small>{run.alert_id}</small></div><span className={run.status === 'error' ? styles.error : run.status === 'success' ? styles.success : ''}>{run.status}</span><span>{formatDate(run.started_at)}</span><span>{run.status === 'error' ? (run.error_message || 'Unknown error') : `${run.offers_found} offers${run.email_sent ? ' · email sent' : ''}`}</span></div>)}
            {!recentRuns.rows.length && <div className={styles.empty}>No alert runs recorded yet.</div>}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Audit log</p><h2>Admin actions</h2></div></div>
          <div className={styles.table}>
            {recentAudit.rows.map((entry) => <div className={styles.auditRow} key={entry.id}><span>{formatDate(entry.created_at)}</span><strong>{entry.action}</strong><span>{entry.target_type ? `${entry.target_type} ${entry.target_id || ''}` : ''}</span><span>{entry.admin_email}</span></div>)}
            {!recentAudit.rows.length && <div className={styles.empty}>No admin actions recorded yet.</div>}
          </div>
        </section>
      </div></section>
    </main>;
  } catch (error) {
    if (isAdminError(error)) redirect('/signin');
    throw error;
  }
}
