import './home-refine.css';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell">
        <div className="hero-copy">
          <p className="hero-kicker">Flight search, automated.</p>
          <h1>Tell us what a great flight looks like.<br /><em>We’ll find it.</em></h1>
          <p className="lede">Set your route, price, dates, cabin, and rules once. TripSignal keeps searching and signals you when a fare fits.</p>
          <div className="hero-actions"><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a><a className="text-link" href="#how">How it works</a></div>
        </div>

        <div className="product-preview hero-signal" aria-label="Example TripSignal flight signal">
          <div className="preview-top"><span className="status"><i /> Signal found</span><span>Just now</span></div>
          <div className="signal-context">MCI → Anywhere in Europe · Under $500</div>
          <div className="preview-price"><span>$</span>427</div>
          <div className="preview-route"><strong>MCI</strong><span>→</span><strong>AMS</strong></div>
          <div className="preview-dates">May 4–18, 2027</div>
          <div className="preview-details"><span>Delta / KLM</span><span>Economy · 1 stop</span><span>9h 42m</span></div>
          <div className="preview-rule"><span>Your target</span><strong>$500</strong><b>$73 below target</b></div>
          <div className="preview-footer"><span>6 / 6 rules matched</span><a href="/alerts">View signal <span>↗</span></a></div>
        </div>
      </section>

      <section className="proof-strip shell"><span>Flexible destinations</span><i /><span>Price targets</span><i /><span>Airline rules</span><i /><span>Scheduled searches</span></section>

      <section id="how" className="how shell">
        <div className="section-intro"><p className="section-kicker">How it works</p><h2>Set it once.<br />Stop searching.</h2></div>
        <div className="steps">
          <article><span className="step-index">01</span><h3>Define the trip.</h3><p>Route, destination, dates, cabin, airlines, stops, and price.</p></article>
          <article><span className="step-index">02</span><h3>Let us watch.</h3><p>TripSignal checks active alerts on your schedule.</p></article>
          <article><span className="step-index">03</span><h3>Get the signal.</h3><p>When a fare fits, you get the price and flight details.</p></article>
        </div>
      </section>

      <section className="alert-demo shell">
        <div className="alert-demo-copy">
          <p className="section-kicker">Example alert</p>
          <h2>Anywhere in Europe.<br />Under $500.</h2>
          <a className="button button-primary" href="/alerts">Build your alert <span>↗</span></a>
        </div>
        <div className="criteria-live">
          <div className="criteria-title"><span>WATCHING</span><i>Active</i></div>
          <div className="criteria-item"><span>From</span><strong>Kansas City <small>MCI</small></strong></div>
          <div className="criteria-item"><span>Destination</span><strong>Europe</strong></div>
          <div className="criteria-item"><span>Price</span><strong>Under $500</strong></div>
          <div className="criteria-item"><span>Trip</span><strong>7–21 days</strong></div>
          <div className="criteria-item"><span>Stops</span><strong>1 or fewer</strong></div>
        </div>
      </section>

      <section className="cta shell"><div><p className="section-kicker">Start watching</p><h2>Find the fare.<br />Skip the search.</h2></div><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a></section>

      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
