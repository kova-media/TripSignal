import Brand from '@/components/brand';
import ThemeToggle from '@/components/theme-toggle';

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand /></a>
        <div className="nav-actions"><a className="nav-how" href="#how">How it works</a><a className="text-button" href="/alerts">Sign in</a><ThemeToggle /><a className="button button-dark" href="/alerts">Create alert</a></div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <h1>Tell us where you want to go.<br /><em>We’ll watch the fare.</em></h1>
          <p className="lede">Set your route, dates, cabin, airlines, and price. TripSignal watches for the trips that fit and sends you a signal when one appears.</p>
          <div className="hero-actions"><a className="button button-primary" href="/alerts">Create your first alert <span>↗</span></a><a className="text-link" href="#how">See how it works</a></div>
        </div>

        <div className="product-preview" aria-label="Example TripSignal flight signal">
          <div className="preview-top"><span className="status"><i /> Signal found</span><span>Just now</span></div>
          <div className="preview-price"><span>$</span>427</div>
          <div className="preview-route"><strong>MCI</strong><span>→</span><strong>AMS</strong></div>
          <div className="preview-dates">May 4–18, 2027</div>
          <div className="preview-details"><span>Delta / KLM</span><span>Economy · 1 stop</span><span>9h 42m</span></div>
          <div className="preview-rule"><span>Your target</span><strong>$500</strong><b>$73 below target</b></div>
          <div className="preview-footer"><span>Matches 6 of 6 criteria</span><a href="/alerts">View signal <span>↗</span></a></div>
        </div>
      </section>

      <section className="trust shell"><span>Built for people who want the trip, not the search.</span><div><b>Flexible destinations</b><b>Price targets</b><b>Custom rules</b></div></section>

      <section id="how" className="how shell">
        <h2>One set of rules.<br />A better way to search.</h2>
        <div className="steps">
          <article><h3>Define the trip.</h3><p>Choose your origin, destination, dates, cabin, airlines, trip length, stop limit, and target price.</p></article>
          <article><h3>Let us watch.</h3><p>TripSignal checks fares on your schedule and filters out anything that misses the rules you set.</p></article>
          <article><h3>Get the signal.</h3><p>When a qualifying fare appears, you get the route, dates, price, and the information you need to act.</p></article>
        </div>
      </section>

      <section className="demo shell">
        <div className="demo-copy"><h2>“Anywhere in Europe.<br />Under $500.”</h2><p>That is a search TripSignal can handle. No destination grid. No endless date combinations. Just a clear rule and a signal when it happens.</p><a className="button button-light" href="/alerts">Build an alert <span>↗</span></a></div>
        <div className="criteria"><div className="criteria-title"><span>Your alert</span><i>Active</i></div><div className="criteria-item"><span>From</span><strong>Kansas City <small>MCI</small></strong></div><div className="criteria-item"><span>To</span><strong>Anywhere in Europe</strong></div><div className="criteria-item"><span>Price</span><strong>Under $500</strong></div><div className="criteria-item"><span>Trip</span><strong>7–21 days</strong></div><div className="criteria-item"><span>Frequency</span><strong>Every Monday</strong></div></div>
      </section>

      <section className="signals shell"><h2>Useful when you need them.</h2><div className="signal-list"><div className="signal-item"><div><strong>MCI → Amsterdam</strong><span>May 4–18, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$427</strong><small>Below target</small></div></div><div className="signal-item"><div><strong>MCI → Madrid</strong><span>June 2–15, 2027 · Delta / Air France · 1 stop</span></div><div className="signal-price"><strong>$468</strong><small>Below target</small></div></div><div className="signal-item"><div><strong>MCI → Barcelona</strong><span>June 2–16, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$489</strong><small>Below target</small></div></div></div></section>

      <section className="cta shell"><div><h2>Tell us what a great fare looks like.</h2></div><a className="button button-dark" href="/alerts">Create an alert <span>↗</span></a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
