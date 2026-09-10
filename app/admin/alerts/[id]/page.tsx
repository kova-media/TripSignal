import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError } from '@/lib/admin';
import AdminAlertActions from '../../admin-alert-actions';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';

function formatDate(value: string | Date | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function formatCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? '?');
  const destination = String(criteria.destination ?? 'Anywhere');
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : criteria.cabin === 'first' ? 'First' : 'Economy';
  const maxPrice = Number(criteria.maxPrice ?? 0);
  return `${origin} → ${destination} · ${cabin}${maxPrice ? ` · $${maxPrice.toLocaleString()}` : ''}`;
}

export default async function AdminAlertPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    await requireAdmin();
    const { id } = await params;
    const db = getDb();

    const [alertResult, runsResult, signalsResult] = await Promise.all([
      db.query<{ id: string; email: string; user_id: string | null; criteria: Record<string, unknown>; frequency: string; active: boolean; last_checked_at: string | null; created_at: string }>(
        `select id, email, user_id, criteria, frequency, active, last_checked_at, created_at from alerts where id = $1 limit 1`,
        [id],
      ),
      db.query<{ id: string; status: string; started_at: string; finished_at: string | null; offers_found: number; email_sent: boolean; error_message: string | null }>(
        `select id, status, started_at, finished_at, offers_found, email_sent, error_message from alert_runs where alert_id = $1 order by started_at desc limit 50`,
        [id],
      ),
      db.query<{ id: string; offer_id: string; offer: Record<string, unknown>; sent_at: string }>(
        `select id, offer_id, offer, sent_at from signals where alert_id = $1 order by sent_at desc limit 50`,
        [id],
      ),
    ]);

    const alert = alertResult.rows[0];
    if (!alert) notFound();

    const errors = runsResult.rows.filter((run) => run.status === 'error');
    const successfulRuns = runsResult.rows.filter((run) => run.status === 'success');
    const latestRun = runsResult.rows[0];
    const latestError = errors[0];

    return <main className={styles.page}>
      <SiteHeader authenticated primaryHref="/profile" primaryLabel="Profile" />
      <section className="shell"><div className={styles.main}>
        <div className={styles.detailBack}><Link href={alert.user_id ? `/admin/users/${alert.user_id}` : '/admin'}>← Back to {alert.user_id ? 'User' : 'Operations'}</Link></div>
        <div className={styles.masthead}>
          <div><p className={styles.eyebrow}>Alert troubleshooting</p><h1 className={styles.title}>Flight watch</h1><p className={styles.subhead}>{alert.email}</p></div>
          <AdminAlertActions id={alert.id} active={alert.active} />
        </div>

        <section className={styles.grid}>
          <div className={styles.metric}><span>Status</span><strong>{alert.active ? 'Active' : 'Paused'}</strong><small>{alert.frequency} checks</small></div>
          <div className={styles.metric}><span>Search runs</span><strong>{runsResult.rows.length}</strong><small>{successfulRuns.length} successful · {errors.length} errors</small></div>
          <div className={styles.metric}><span>Signals</span><strong>{signalsResult.rows.length}</strong><small>Fare notifications</small></div>
          <div className={styles.metric}><span>Last checked</span><strong>{alert.last_checked_at ? new Date(alert.last_checked_at).toLocaleDateString() : 'Never'}</strong><small>{formatDate(alert.last_checked_at)}</small></div>
          <div className={styles.metric}><span>Created</span><strong>{new Date(alert.created_at).toLocaleDateString()}</strong><small>{formatDate(alert.created_at)}</small></div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Criteria</p><h2>Watch configuration</h2></div></div>
          <div className={styles.detailCard}>
            <div><span>Route</span><strong>{String(alert.criteria.origin ?? '?')} → {String(alert.criteria.destination ?? 'Anywhere')}</strong></div>
            <div><span>Cabin</span><strong>{String(alert.criteria.cabin ?? 'economy')}</strong></div>
            <div><span>Maximum price</span><strong>{Number(alert.criteria.maxPrice ?? 0) ? `$${Number(alert.criteria.maxPrice).toLocaleString()}` : 'Not specified'}</strong></div>
            <div><span>Full criteria</span><strong>{formatCriteria(alert.criteria)}</strong></div>
          </div>
        </section>

        {latestError && <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Attention</p><h2>Latest error</h2></div></div>
          <div className={styles.errorCard}><strong>{latestError.error_message || 'Search failed without an error message.'}</strong><small>{formatDate(latestError.started_at)}</small></div>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Diagnostics</p><h2>Search history</h2></div><span className={styles.sectionNote}>Last {runsResult.rows.length}</span></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Run</span><span>Result</span><span>Started</span><span>Details</span></div>
            {runsResult.rows.map((run) => <div className={styles.tableRow} key={run.id}><div><strong>{run.status === 'error' ? 'Search failed' : 'Search completed'}</strong><small>{run.id}</small></div><span className={run.status === 'error' ? styles.error : run.status === 'success' ? styles.success : ''}>{run.status}</span><span>{formatDate(run.started_at)}</span><span>{run.status === 'error' ? (run.error_message || 'Unknown error') : `${run.offers_found} offers${run.email_sent ? ' · email sent' : ''}`}</span></div>)}
            {!runsResult.rows.length && <div className={styles.empty}>No search runs recorded for this alert.</div>}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Signals</p><h2>Fare notifications</h2></div><span className={styles.sectionNote}>Last {signalsResult.rows.length}</span></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Offer</span><span>Offer ID</span><span>Sent</span><span>Record</span></div>
            {signalsResult.rows.map((signal) => <div className={styles.tableRow} key={signal.id}><div><strong>{String(signal.offer.airline ?? signal.offer.airlines ?? 'Flight offer')}</strong><small>{String(signal.offer.route ?? signal.offer.flightNumber ?? '')}</small></div><span>{signal.offer_id}</span><span>{formatDate(signal.sent_at)}</span><span>{signal.id}</span></div>)}
            {!signalsResult.rows.length && <div className={styles.empty}>No fare signals have been sent for this alert.</div>}
          </div>
        </section>

        {latestRun && <p className={styles.detailFootnote}>Latest run: {formatDate(latestRun.started_at)} · {latestRun.status}</p>}
      </div></section>
    </main>;
  } catch (error) {
    if (isAdminError(error)) redirect('/signin');
    throw error;
  }
}
