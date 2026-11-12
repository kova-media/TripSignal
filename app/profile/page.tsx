import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import ThemeToggle from '@/components/theme-toggle';
import AlertActions from '../account/alert-actions';
import BillingButton from '../account/billing-button';
import ReferralPanel from '@/components/referral-panel';
import SmsSettings from '@/components/sms-settings';
import TestAlertButton from '@/components/test-alert-button';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import styles from '../account/account.module.css';

export const dynamic = 'force-dynamic';

function countryName(code: unknown) {
  const value = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return String(code ?? 'Anywhere');
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value;
}

function summarizeCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? 'MCI');
  const rawDestination = criteria.destination && typeof criteria.destination === 'object' ? String((criteria.destination as Record<string, unknown>).value ?? 'Anywhere') : String(criteria.destination ?? 'Anywhere');
  const destination = criteria.destinationMode === 'country' ? countryName(rawDestination) : rawDestination;
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : criteria.cabin === 'first' ? 'First class' : 'Economy';
  const price = Number(criteria.maxPrice ?? 0).toLocaleString();
  return `${origin} → ${destination} · ${cabin} · under $${price}`;
}

function firstName(name: string | null, email: string) {
  const value = name?.trim();
  return value ? value.split(/\s+/)[0] : email.split('@')[0];
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');
  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; criteria: Record<string, unknown>; frequency: string; active: boolean; last_checked_at: string | null }>('select id, criteria, frequency, active, last_checked_at from alerts where user_id = $1 order by created_at desc', [user.id]);
  const watchIds = result.rows.map((row) => row.id);
  const lowestResult = watchIds.length ? await db.query<{ alert_id: string; lowest_price: string }>('select alert_id, min(price) as lowest_price from fare_observations where alert_id = any($1::uuid[]) group by alert_id', [watchIds]) : { rows: [] as { alert_id: string; lowest_price: string }[] };
  const lowestByAlert = new Map(lowestResult.rows.map((row) => [row.alert_id, Number(row.lowest_price)]));
  const billingResult = await db.query<{ subscription_status: string; subscription_current_period_end: string | null; plan: string; bonus_watches: number }>('select subscription_status, subscription_current_period_end, plan, coalesce(bonus_watches, 0) as bonus_watches from users where id = $1 limit 1', [user.id]);
  const billing = billingResult.rows[0];
  const isPro = billing?.plan === 'pro' || billing?.subscription_status === 'lifetime';
  const createdThisMonthResult = await db.query<{ count: string }>(`select count(*)::text as count from alerts where user_id = $1 and created_at >= date_trunc('month', now())`, [user.id]);
  const watchesLeft = isPro ? null : Math.max(0, 1 + Number(billing?.bonus_watches ?? 0) - Number(createdThisMonthResult.rows[0]?.count ?? 0));
  const signalsResult = await db.query<{ sent_at: string; offer: Record<string, unknown> }>('select s.sent_at, s.offer from signals s join alerts a on a.id = s.alert_id where a.user_id = $1 order by s.sent_at desc limit 20', [user.id]);
  const phoneResult = await db.query<{ phone: string | null; sms_opt_in: boolean }>('select phone, coalesce(sms_opt_in, false) as sms_opt_in from users where id = $1 limit 1', [user.id]).catch(() => ({ rows: [] as { phone: string | null; sms_opt_in: boolean }[] }));
  const phone = phoneResult.rows[0] ?? null;
  const subscriptionActive = ['active', 'trialing', 'lifetime'].includes(billing?.subscription_status ?? '');
  const activeCount = result.rows.filter((row) => row.active).length;

  return <main className={styles.page}>
    <SiteHeader authenticated primaryHref="/alerts" primaryLabel="Create alert" />
    <section className="shell"><div className={styles.main}>
      <div className={styles.masthead}><div><p className={styles.eyebrow}>TripSignal profile</p><h1 className={styles.title}>Welcome back, {firstName(user.name, user.email)}.</h1><p className={styles.email}>{user.email}</p></div><div className={styles.mastheadAction}><a className="button button-primary" href="/alerts">Create alert</a></div></div>

      <section className={styles.section}>
        <div className={styles.billing}>
          <div><p className={styles.eyebrow}>TripSignal plan</p><h2 className={styles.billingTitle}>{billing?.subscription_status === 'lifetime' ? 'You have lifetime Pro access.' : subscriptionActive ? 'Your subscription is active.' : 'Upgrade to TripSignal Pro.'}</h2><p className={styles.billingText}>{billing?.subscription_status === 'lifetime' ? 'Unlimited alerts. No payment required. No expiration.' : subscriptionActive && billing?.subscription_current_period_end ? `Renews ${new Date(billing.subscription_current_period_end).toLocaleDateString()}.` : 'Unlimited alerts, with daily, weekly, or monthly fare checks, for $19.99/year.'}</p></div>
          <BillingButton active={subscriptionActive} />
        </div>
      </section>

      <div className={styles.stats}><div><span>Active watches</span><strong>{activeCount}</strong></div><div><span>Total alerts</span><strong>{result.rows.length}</strong></div><div><span>Watches left</span><strong>{watchesLeft === null ? '∞' : watchesLeft}</strong></div></div>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your searches</p><h2 className={styles.sectionTitle}>{result.rows.length ? 'Fare watches' : 'Start your first fare watch'}</h2></div></div>{result.rows.length === 0 ? <div className={styles.empty}><h3 className={styles.emptyTitle}>Nothing is being watched yet.</h3><p className={styles.emptyText}>Tell TripSignal what a great fare looks like, then let us do the searching.</p><a className="button button-primary" href="/alerts">Create your first alert</a></div> : <div className={styles.alerts}>{result.rows.map((alert) => <article className={styles.alert} key={alert.id}><div className={styles.alertMain}><p className={styles.route}>{summarizeCriteria(alert.criteria)}</p><div className={styles.meta}><span>{alert.frequency}</span><span>{alert.last_checked_at ? `Last checked ${new Date(alert.last_checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Not checked yet'}</span>{lowestByAlert.has(alert.id) ? <span>Lowest seen ${lowestByAlert.get(alert.id)?.toLocaleString()}</span> : null}</div></div><div className={styles.alertRight}><span className={`${styles.status} ${!alert.active ? styles.paused : ''}`}><i className={styles.dot} />{alert.active ? 'Watching' : 'Paused'}</span><AlertActions id={alert.id} active={alert.active} /></div></article>)}</div>}</section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Sent signals</p><h2 className={styles.sectionTitle}>Deals we&rsquo;ve sent you</h2></div></div>{signalsResult.rows.length === 0 ? <p className={styles.billingText}>No signals sent yet. When a fare drops under your target, it will show up here.</p> : <div className="signal-list">{signalsResult.rows.map((signal, index) => { const offer = signal.offer; const origin = String(offer.origin ?? ''); const destination = String(offer.destination ?? ''); const price = Number(offer.price ?? 0); const dep = String(offer.departureDate ?? ''); const ret = String(offer.returnDate ?? ''); return <div className="signal-item" key={`${signal.sent_at}-${index}`}><div><strong>{origin} → {destination}</strong><span>{dep ? `${shortDate(dep)}${ret ? ` – ${shortDate(ret)}` : ''}` : ''} · Sent {shortDate(signal.sent_at)}</span></div><div className="signal-price"><strong>${price.toLocaleString()}</strong></div></div>; })}</div>}</section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Appearance</p><h2 className={styles.sectionTitle}>Choose your view</h2></div></div><div className={styles.appearanceRow}><div><h3 className={styles.billingTitle}>Daylight or Redeye</h3><p className={styles.billingText}>Choose the appearance used across TripSignal.</p></div><ThemeToggle /></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Referrals</p><h2 className={styles.sectionTitle}>Invite friends, earn watches</h2></div></div><ReferralPanel /></section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Notifications</p><h2 className={styles.sectionTitle}>Text me the signal</h2></div></div><SmsSettings initialPhone={phone?.phone ?? null} initialOptIn={phone?.sms_opt_in ?? false} /></section>

      <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Test</p><h2 className={styles.sectionTitle}>Send yourself a test alert</h2></div></div><p className={styles.billingText} style={{ marginBottom: 18 }}>Proves the email pipeline works without waiting for a real fare drop. It uses the last fare we saw for one of your watches.</p><TestAlertButton /></section>
    </div></section>
  </main>;
}
