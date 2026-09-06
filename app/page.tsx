import './home-refine.css';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';

export default function Home() {
  return (
    <main className="home-page">
      <SiteHeader />
      <section className="home-hero shell">
        <div className="home-hero-copy">
          <p className="hero-kicker">Flight search, automated.</p>
          <h1>The flight you want.<br /><em>Found when the price is right.</em></h1>
          <p className="lede">Set your trip once. TripSignal keeps watching for fares that match your rules.</p>
          <div className="hero-actions"><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a><a className="text-link" href="#how">See how it works</a></div>
        </div>
        <div className="signal-card" aria-label="Example TripSignal fare signal">
          <div className="signal-card-top"><span><i /> Fare match</span><span>TripSignal</span></div>
          <div className="signal-price"><small>$</small>427</div>
          <div className="signal-route"><strong>MCI</strong><span>→</span><strong>AMS</strong></div>
          <div className="signal-date">May 4–18, 2027</div>
          <div className="signal-meta"><span>Delta / KLM</span><span>Economy</span><span>1 stop</span></div>
          <div className="signal-rule"><span>Target</span><strong>$500</strong><b>$73 below</b></div>
          <div className="signal-card-bottom"><span>6 / 6 criteria matched</span><a href="/alerts">View signal ↗</a></div>
        </div>
      </section>
      <div className="home-rule shell" />
      <section className="capabilities shell" aria-label="TripSignal capabilities"><span>Flexible destinations</span><span>Price targets</span><span>Airline rules</span><span>Scheduled searches</span></section>
      <section id="how" className="how shell">
        <div className="section-intro"><p className="section-kicker">How it works</p><h2>Search once.<br />Let TripSignal watch.</h2></div>
        <div className="steps"><article><h3>Define your trip.</h3><p>Choose the route, dates, cabin, airlines, stops, and price that work for you.</p></article><article><h3>We keep searching.</h3><p>Your alert runs on schedule while you get on with your life.</p></article><article><h3>You get the signal.</h3><p>When a fare fits, we send the details and a direct path to the flight.</p></article></div>
      </section>
      <section className="search-preview shell">
        <div className="search-preview-copy"><p className="section-kicker">Your search, your rules</p><h2>Anywhere in Europe.<br />Under $500.</h2><p>TripSignal handles the repetitive searching so you do not have to.</p><a className="button button-primary" href="/alerts">Build your alert <span>↗</span></a></div>
        <div className="criteria-live"><div className="criteria-title"><span>Active alert</span><i>Watching</i></div><div className="criteria-item"><span>From</span><strong>Kansas City <small>MCI</small></strong></div><div className="criteria-item"><span>Destination</span><strong>Europe</strong></div><div className="criteria-item"><span>Price</span><strong>Under $500</strong></div><div className="criteria-item"><span>Trip length</span><strong>7–21 days</strong></div><div className="criteria-item"><span>Stops</span><strong>1 or fewer</strong></div></div>
      </section>
      <section className="home-cta shell"><h2>Stop searching.<br /><em>Start watching.</em></h2><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
