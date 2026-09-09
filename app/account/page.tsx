import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import AlertActions from './alert-actions';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import styles from './account.module.css';

export const dynamic = 'force-dynamic';

function summarizeCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? 'Not set');
  const destination = String(criteria.destination ?? 'Not set');
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : criteria.cabin === 'first' ? 'First class' : 'Economy';
  const price = Number(criteria.maxPrice ?? 0).toLocaleString();
  return `${origin} → ${destination} · ${cabin} · under $${price}`;
}

function firstName(name: string | null, email: string) {
  const value = name?.trim();
  if (value) return value.split(/\s+/)[0];
  return email.split('@')[0];
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');

  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; criteria: Record<string, unknown>; frequency: string; active: boolean; created_at: string }>(
    `select id, criteria, frequency, active, created_at
     from alerts
     where user_id = $1
       and jsonb_typeof(criteria) = 'object'
       and length(coalesce(criteria->>'origin', '')) = 3
       and criteria ? 'destination'
       and criteria ? 'maxPrice'
       and lower(coalesce(criteria->>'destination', '')) not in ('any destination', 'any airport')
     order by created_at desc`,
    [user.id],
  );
  const planResult = await db.query<{ plan: string }>('select plan from users where id = $1 limit 1', [user.id]);
  const plan = planResult.rows[0]?.plan ?? 'free';

  const activeCount = result.rows.filter((row) => row.active).length;
  const pausedCount = result.rows.length - activeCount;

  return (
    <main className={styles.page}>
      <SiteHeader authenticated primaryHref="/alerts" primaryLabel="Create alert" />
      <section className="shell">
        <div className={styles.main}>
          <div className={styles.masthead}>
            <div>
              <p className={styles.eyebrow}>TripSignal account</p>
              <h1 className={styles.title}>Welcome back, {firstName(user.name, user.email)}.</h1>
              <p className={styles.email}>{user.email}</p>
            </div>
            <div className={styles.mastheadAction}>
              <a className="button button-primary" href="/alerts">Create alert</a>
            </div>
          </div>

          <div className={styles.stats}>
            <div><span>Active watches</span><strong>{activeCount}</strong></div>
            <div><span>Total alerts</span><strong>{result.rows.length}</strong></div>
            <div><span>Paused</span><strong>{pausedCount}</strong></div>
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Your searches</p>
                <h2 className={styles.sectionTitle}>{result.rows.length ? 'Fare watches' : 'Start your first fare watch'}</h2>
              </div>
            </div>

            {result.rows.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>↗</div>
                <h3 className={styles.emptyTitle}>Nothing is being watched yet.</h3>
                <p className={styles.emptyText}>Tell TripSignal what a great fare looks like. Set your destination, price, dates, airlines, stops, and trip length, then let us do the searching.</p>
                <a className="button button-primary" href="/alerts">Create your first alert</a>
              </div>
            ) : (
              <div className={styles.alerts}>
                {result.rows.map((alert) => (
                  <article className={styles.alert} key={alert.id}>
                    <div className={styles.alertMain}>
                      <p className={styles.route}>{summarizeCriteria(alert.criteria)}</p>
                      <div className={styles.meta}><span>{alert.frequency}</span><span>·</span><span>Created {new Date(alert.created_at).toLocaleDateString()}</span></div>
                    </div>
                    <div className={styles.alertRight}>
                      <span className={`${styles.status} ${!alert.active ? styles.paused : ''}`}><i className={styles.dot} />{alert.active ? 'Watching' : 'Paused'}</span>
                      <AlertActions id={alert.id} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>TripSignal plan</p>
                <h2 className={styles.sectionTitle}>{plan === 'pro' ? 'TripSignal Pro' : 'Free plan'}</h2>
              </div>
            </div>
            <div className={styles.empty}>
              <h3 className={styles.emptyTitle}>{plan === 'pro' ? 'Pro is active.' : 'Upgrade to TripSignal Pro.'}</h3>
              <p className={styles.emptyText}>{plan === 'pro' ? 'Your account has unlimited alerts with weekly or monthly checks.' : 'Get unlimited alerts with weekly or monthly checks for $19.99 per year.'}</p>
              {plan !== 'pro' && <a className="button button-primary" href="/api/billing/checkout">Upgrade to Pro</a>}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
