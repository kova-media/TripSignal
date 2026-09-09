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

      <section className="home-hero shell">
        <div className="home-hero-copy">
          <p className="hero-kicker">Flight fare monitoring</p>
          <h1>Stop checking<br /><em>flight prices.</em></h1>
          <p className="lede">Tell TripSignal where you want to go and what you want to pay. We’ll watch the fares for you and alert you when we find a match.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#explore">Start watching</a>
            <a className="text-link" href="#how-it-works">How it works</a>
          </div>
          <p className="hero-note">You decide when to book. TripSignal keeps watching.</p>
        </div>
      </section>

      <TripDiscoveryDirect />

      <section className="home-difference shell" id="how-it-works">
        <div className="home-difference-copy">
          <p className="section-kicker">Why TripSignal</p>
          <h2>Search once.<br /><em>Let TripSignal keep checking.</em></h2>
          <p>Flight search sites show you a price when you search. TripSignal keeps watching after you leave, using the route, dates, cabin and target price you set.</p>
        </div>
        <div className="home-steps">
          <article>
            <span>01</span>
            <h3>Set your watch</h3>
            <p>Choose your route, travel window, cabin and target price.</p>
          </article>
          <article>
            <span>02</span>
            <h3>We keep watching</h3>
            <p>TripSignal checks your watch on the schedule you choose.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Get alerted</h3>
            <p>When a fare matches your criteria, we’ll tell you.</p>
          </article>
        </div>
      </section>

      <section className="product-preview shell">
        <div className="preview-heading">
          <p className="section-kicker">Your watches</p>
          <h2>Set it once.<br /><em>Let it run.</em></h2>
          <p>{user ? 'Each watch has its own rules. TripSignal checks them on schedule and keeps the result simple.' : 'Sign in to see the watches you have running.'}</p>
        </div>
        {user ? (
          watches.length ? (
            <div className="watch-dashboard">
              <div className="dashboard-head">
                <div><span>Active watches</span><strong>{watches.length}</strong></div>
                <span className="dashboard-status"><i /> Monitoring</span>
              </div>
              {watches.map((watch) => {
                const c = watch.criteria || {};
                const origin = c.origin || 'Not set';
                const destination = c.destinationMode === 'region' ? (c.destination || c.region || 'Not set') : (c.destination || 'Not set');
                const cabin = c.cabin ? String(c.cabin).replace(/_/g, ' ') : 'Any cabin';
                const stops = c.maxStops != null ? `${c.maxStops} stop${c.maxStops === 1 ? '' : 's'} max` : '';
                return (
                  <article className="watch-row" key={watch.id}>
                    <div className="watch-route"><strong>{origin}</strong><span>→</span><strong>{destination}</strong><small>{cabin}{stops ? ` · ${stops}` : ''}</small></div>
                    <div className="watch-fare"><span>Frequency</span><strong>{watch.frequency}</strong><small>Active watch</small></div>
                    <a className="watch-pill" href="/profile">Manage</a>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-watches"><p>No active watches yet.</p><a className="button button-primary" href="#explore">Start watching</a></div>
          )
        ) : (
          <div className="empty-watches"><p>Sign in to see your watches.</p><a className="button button-primary" href="/signin">Sign in</a></div>
        )}
      </section>

      <section className="pricing-preview shell" aria-label="TripSignal pricing">
        <div className="pricing-preview-copy">
          <p className="section-kicker">Simple pricing</p>
          <h2>Free to start.<br /><em>Unlimited when you need it.</em></h2>
          <p>Start with one new watch each month. Upgrade when you want unlimited watches.</p>
        </div>
        <div className="pricing-preview-card">
          <div className="pricing-tier">
            <span>Free</span>
            <strong>$0</strong>
            <small>1 new watch each month</small>
            <a className="button button-light" href="/signup">Start free</a>
          </div>
          <div className="pricing-tier pricing-tier-pro">
            <span>TripSignal Pro</span>
            <strong>$19.99</strong>
            <small>per year · unlimited watches</small>
            {user ? <BillingButton active={subscriptionActive} /> : <a className="button button-primary" href="/signup">Upgrade to Pro</a>}
          </div>
        </div>
      </section>

      <section className="home-cta shell">
        <div><p className="section-kicker">Start watching</p><h2>Stop searching.<br /><em>Let TripSignal watch.</em></h2></div>
        <a className="button button-primary" href="#explore">Start watching</a>
      </section>

      <footer className="footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <span>Flight fare monitoring.</span>
        <span>© 2026 TripSignal</span>
      </footer>
    </main>
  );
}
