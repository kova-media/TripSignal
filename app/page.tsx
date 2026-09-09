import './home-refine.css';
import './home-align.css';
import './home-product.css';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import TripDiscoveryDirect from '@/components/trip-discovery-direct';
import BillingButton from '@/app/account/billing-button';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  let watches: Array<{ id: string; criteria: any; frequency: string }> = [];
  let subscriptionActive = false;
  if (user) {
    const sql = getDb();
    await ensureSchema();
    const result = await sql.query<{ id: string; criteria: any; frequency: string }>(
      `select id, criteria, frequency
       from alerts
       where user_id = $1
         and active = true
         and jsonb_typeof(criteria) = 'object'
         and length(coalesce(criteria->>'origin', '')) = 3
         and criteria ? 'destination'
         and criteria ? 'maxPrice'
         and lower(coalesce(criteria->>'destination', '')) not in ('any destination', 'any airport')
       order by created_at desc
       limit 3`,
      [user.id],
    );
    watches = result.rows;

    const billingResult = await sql.query<{ subscription_status: string | null }>(
      'select subscription_status from users where id = $1 limit 1',
      [user.id],
    );
    const status = billingResult.rows[0]?.subscription_status;
    subscriptionActive = status === 'active' || status === 'trialing';
  }
  return (
    <main className="home-page">
      <SiteHeader authenticated={Boolean(user)} />
      <section className="home-hero shell"><div className="home-hero-copy"><p className="hero-kicker">Automated fare monitoring</p><h1>Set the trip.<br /><em>We’ll watch the fare.</em></h1><p className="lede">Define the route, cabin, dates, and price that matter. TripSignal keeps searching and tells you when a fare fits.</p><div className="hero-actions"><a className="button button-primary" href="/alerts">Create an alert</a><a className="text-link" href="#explore">Find a trip</a></div><p className="hero-note">You decide when to book. TripSignal just watches.</p></div></section>
      <section className="pricing-preview shell" aria-label="TripSignal pricing"><div className="pricing-preview-copy"><p className="section-kicker">TripSignal pricing</p><h2>Search free.<br />Upgrade for unlimited.</h2><p>Create 1 alert each month on the Free plan. That alert stays active and can be checked weekly. Upgrade to TripSignal Pro for unlimited alerts at $19.99 a year.</p></div><div className="pricing-preview-card"><span>Free plan</span><strong>$0</strong><small>1 new alert per month · weekly or monthly checks</small><a className="button button-light" href="/signup">Start free</a><span style={{ marginTop: 28 }}>TripSignal Pro</span><strong>$19.99</strong><small>per year · unlimited alerts · weekly or monthly checks</small>{user ? <BillingButton active={subscriptionActive} /> : <a className="button button-primary" href="/signup">Upgrade to Pro</a>}</div></section>
      <TripDiscoveryDirect />
      <section className="product-preview shell"><div className="preview-heading"><p className="section-kicker">Your watches</p><h2>Keep the search running.</h2><p>{user ? 'Each watch has its own rules. TripSignal checks them on schedule and keeps the result simple.' : 'Sign in to see the watches you have running.'}</p></div>{user ? (watches.length ? <div className="watch-dashboard"><div className="dashboard-head"><div><span>Active watches</span><strong>{watches.length}</strong></div><span className="dashboard-status"><i /> Monitoring</span></div>{watches.map((watch) => { const c = watch.criteria || {}; const origin = c.origin || 'Not set'; const destination = c.destinationMode === 'region' ? (c.destination || c.region || 'Not set') : (c.destination || 'Not set'); const cabin = c.cabin ? String(c.cabin).replace(/_/g, ' ') : 'Any cabin'; const stops = c.maxStops != null ? `${c.maxStops} stop${c.maxStops === 1 ? '' : 's'} max` : ''; return <article className="watch-row" key={watch.id}><div className="watch-route"><strong>{origin}</strong><span>→</span><strong>{destination}</strong><small>{cabin}{stops ? ` · ${stops}` : ''}</small></div><div className="watch-fare"><span>Frequency</span><strong>{watch.frequency}</strong><small>Active watch</small></div><a className="watch-pill" href="/profile">Manage</a></article>; })}</div> : <div className="empty-watches"><p>No active watches yet.</p><a className="button button-primary" href="/alerts">Create an alert</a></div>) : <div className="empty-watches"><p>Sign in to see your watches.</p><a className="button button-primary" href="/signin">Sign in</a></div>}</section>
      <section className="home-cta shell"><div><p className="section-kicker">Start watching</p><h2>Stop searching.<br /><em>Start watching.</em></h2></div><a className="button button-primary" href="/signup">Start free</a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
