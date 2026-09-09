import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import ThemeToggle from '@/components/theme-toggle';
import AlertActions from '../account/alert-actions';
import BillingButton from '../account/billing-button';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import styles from '../account/account.module.css';

export const dynamic = 'force-dynamic';

function summarizeCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? 'MCI');
  const destination = criteria.destination && typeof criteria.destination === 'object' ? String((criteria.destination as Record<string, unknown>).value ?? 'Anywhere') : String(criteria.destination ?? 'Anywhere');
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : criteria.cabin === 'first' ? 'First class' : 'Economy';
  const price = Number(criteria.maxPrice ?? 0).toLocaleString();
  return `${origin} → ${destination} · ${cabin} · under $${price}`;
}

function firstName(name: string | null, email: string) {
  const value = name?.trim();
  return value ? value.split(/\s+/)[0] : email.split('@')[0];
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');
  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; criteria: Record<string, unknown>; frequency: string; active: boolean }>('select id, criteria, frequency, active from alerts where user_id = $1 order by created_at desc', [user.id]);
  const billingResult = await db.query<{ subscription_status: string; subscription_current_period_end: string | null }>('select subscription_status, subscription_current_period_end from users where id = $1 limit 1', [user.id]);
  const billing = billingResult.rows[0];
  const subscriptionActive = billing?.subscription_status === 'active' || billing?.subscription_status === 'trialing';
  const activeCount = result.rows.filter((row) => row.active).length;

  return <main className={styles.page}>
    <SiteHeader authenticated primaryHref="/alerts" primaryLabel="Create alert" />
    <section className="shell"><div className={styles.main}>
      <div className={styles.masthead}><div><p className={styles.eyebrow}>TripSignal profile</p><h1 className={styles.title}>Welcome back, {firstName(user.name, user.email)}.</h1><p className={styles.email}>{user.email}</p></div><div className={styles.mastheadAction}><a className="button button-primary" href="/alerts">Create alert</a></div></div>

      <section className={styles.section}>
        <div className={styles.billing}>
          <div><p className={styles.eyebrow}>TripSignal plan</p><h2 className={styles.billingTitle}>{subscriptionActive ? 'Your subscription is active.' : 'Upgrade to TripSignal Pro.'}</h2><p className={styles.billingText}>{subscriptionActive && billing?.subscription_current_period_end ? `Renews ${new Date(billing.subscription_current_period_end).toLocaleDateString()}.` : 'Unlimited alerts, with weekly or monthly fare checks, for $19.99/year.'}</p></div>
          <BillingButton active={subscriptionActive} />
        </div>
      </section>

      <div className={styles.stats}><div><span>Active watches</span><strong>{activeCount}</strong></div><div><span>Total alerts</span><strong>{result.rows.length}</strong></div></div>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your searches</p><h2 className={styles.sectionTitle}>{result.rows.length ? 'Fare watches' : 'Start your first fare watch'}</h2></div></div>{result.rows.length === 0 ? <div className={styles.empty}><h3 className={styles.emptyTitle}>Nothing is being watched yet.</h3><p className={styles.emptyText}>Tell TripSignal what a great fare looks like, then let us do the searching.</p><a className="button button-primary" href="/alerts">Create your first alert</a></div> : <div className={styles.alerts}>{result.rows.map((alert) => <article className={styles.alert} key={alert.id}><div className={styles.alertMain}><p className={styles.route}>{summarizeCriteria(alert.criteria)}</p><div className={styles.meta}><span>{alert.frequency}</span></div></div><div className={styles.alertRight}><span className={`${styles.status} ${!alert.active ? styles.paused : ''}`}><i className={styles.dot} />{alert.active ? 'Watching' : 'Paused'}</span><AlertActions id={alert.id} /></div></article>)}</div>}</section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Appearance</p><h2 className={styles.sectionTitle}>Choose your view</h2></div></div><div className={styles.billing}><div><h3 className={styles.billingTitle}>Daylight or Redeye</h3><p className={styles.billingText}>Choose the appearance used across TripSignal.</p></div><ThemeToggle /></div></section>
    </div></section>
  </main>;
}
