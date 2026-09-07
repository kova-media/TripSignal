import './home-refine.css';
import './home-align.css';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';

export default function Home() {
  return (
    <main className="home-page">
      <SiteHeader />
      <section className="home-hero shell">
        <div className="home-hero-copy">
          <p className="hero-kicker">Automated fare monitoring</p>
          <h1>Set the trip.<br /><em>We’ll watch the fare.</em></h1>
          <p className="lede">Define the route, cabin, dates, and price that matter to you. TripSignal keeps searching and tells you when a fare fits.</p>
          <div className="hero-actions"><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a><a className="text-link" href="#how">How it works</a></div>
          <p className="hero-note">You decide when to book. TripSignal just watches.</p>
        </div>
        <div className="signal-card" aria-label="Example TripSignal fare signal">
          <div className="signal-card-top"><span><i /> Fare match</span><span>TRIPSIGNAL / 08:42</span></div>
          <div className="signal-price"><small>$</small>427</div>
          <div className="signal-route"><strong>MCI</strong><span>→</span><strong>AMS</strong></div>
          <div className="signal-date">May 4–18, 2027</div>
          <div className="signal-meta"><span>Delta / KLM</span><span>Premium economy</span><span>1 stop</span></div>
          <div className="signal-rule"><span>Target</span><strong>$500</strong><b>$73 below</b></div>
          <div className="signal-card-bottom"><span>6 criteria matched</span><a href="/alerts">View signal ↗</a></div>
        </div>
      </section>
      <div className="home-rule shell" />
      <section className="capabilities shell" aria-label="TripSignal capabilities"><span>Flexible dates</span><span>Price targets</span><span>Airline rules</span><span>Trip length</span><span>Scheduled searches</span></section>
      <section id="how" className="how shell">
        <div className="section-intro"><p className="section-kicker">1 / How it works</p><h2>Search once.<br />Let TripSignal watch.</h2></div>
        <div className="steps"><article><span className="step-number">1</span><h3>Define the trip.</h3><p>Choose the route, dates, cabin, airlines, stops, trip length, and price that work for you.</p></article><article><span className="step-number">2</span><h3>We keep searching.</h3><p>Your watch runs on schedule while TripSignal checks for fares that fit your rules.</p></article><article><span className="step-number">3</span><h3>You get the signal.</h3><p>When a fare qualifies, we send the price, dates, route, and booking path.</p></article></div>
      </section>
      <section className="product-preview shell">
        <div className="preview-heading"><p className="section-kicker">2 / Your watches</p><h2>Keep the search running.</h2><p>Each watch has its own rules. TripSignal checks them on schedule and keeps the result simple.</p></div>
        <div className="watch-dashboard">
          <div className="dashboard-head"><div><span>Active watches</span><strong>3</strong></div><span className="dashboard-status"><i /> Monitoring</span></div>
          <article className="watch-row"><div className="watch-route"><strong>MCI</strong><span>→</span><strong>Europe</strong><small>Premium economy · 1 stop</small></div><div className="watch-fare"><span>Target</span><strong>$2,000</strong><small>Next check Monday</small></div><span className="watch-pill">Watching</span></article>
          <article className="watch-row"><div className="watch-route"><strong>MCI</strong><span>→</span><strong>AMS</strong><small>Business · 2 stops max</small></div><div className="watch-fare"><span>Target</span><strong>$1,800</strong><small>Next check Monday</small></div><span className="watch-pill">Watching</span></article>
          <article className="watch-row"><div className="watch-route"><strong>MCI</strong><span>→</span><strong>FCO</strong><small>Premium economy · flexible dates</small></div><div className="watch-fare"><span>Target</span><strong>$1,600</strong><small>Next check Monday</small></div><span className="watch-pill">Watching</span></article>
        </div>
      </section>
      <section className="signal-preview shell">
        <div className="notification-card"><div className="notification-top"><span><i /> TripSignal</span><span>Fare signal</span></div><div className="notification-main"><p>Fare match found</p><strong>$427</strong><span>MCI → AMS · May 4–18, 2027</span></div><div className="notification-details"><span>Premium economy</span><span>Delta / KLM</span><span>1 stop</span><b>$73 below target</b></div><div className="notification-action">View flight <span>↗</span></div></div>
        <div className="signal-preview-copy"><p className="section-kicker">3 / The signal</p><h2>Useful information.<br />At the right moment.</h2><p>TripSignal filters the noise. You get the fare, dates, route, and details you need to decide, then book directly with the airline or travel provider.</p><a className="text-link" href="/alerts">Build your own criteria <span>↗</span></a></div>
      </section>
      <section className="search-preview shell">
        <div className="search-preview-copy"><p className="section-kicker">4 / Flexible by design</p><h2>Anywhere in Europe.<br />Under $500.</h2><p>Use a broad destination when the fare matters more than the airport. Choose an exact airport when the destination is fixed.</p><a className="button button-primary" href="/alerts">Build your alert <span>↗</span></a></div>
        <div className="criteria-live"><div className="criteria-title"><span>Active alert</span><i>Watching</i></div><div className="criteria-item"><span>From</span><strong>Kansas City <small>MCI</small></strong></div><div className="criteria-item"><span>Destination</span><strong>Europe</strong></div><div className="criteria-item"><span>Price</span><strong>Under $500</strong></div><div className="criteria-item"><span>Cabin</span><strong>Premium economy</strong></div><div className="criteria-item"><span>Trip length</span><strong>7–21 days</strong></div><div className="criteria-item"><span>Stops</span><strong>1 or fewer</strong></div></div>
      </section>
      <section className="trust-points shell"><div><strong>Pause anytime.</strong><span>Stop a watch without deleting it.</span></div><div><strong>Search on a schedule.</strong><span>Let the system handle repeat searches.</span></div><div><strong>Book yourself.</strong><span>TripSignal finds the fare. You make the booking.</span></div></section>
      <section className="home-cta shell"><div><p className="section-kicker">5 / Start watching</p><h2>Stop searching.<br /><em>Start watching.</em></h2></div><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
