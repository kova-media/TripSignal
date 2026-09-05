export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <div className="brand"><span className="brand-mark" />TripSignal</div>
        <div className="nav-actions"><a href="#how">How it works</a><button className="ghost">Sign in</button><button className="dark">Get started</button></div>
      </nav>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">TRAVEL DEAL ALERTS</p>
          <h1>Stop searching.<br /><span>Start getting signals.</span></h1>
          <p className="lede">Tell TripSignal where you want to go, what you want to pay, and how flexible you are. We watch for the trip that fits.</p>
          <div className="hero-actions"><button className="primary">Create your first alert <span>→</span></button><a className="text-link" href="#how">See how it works</a></div>
          <p className="micro">Free to start · Cancel anytime</p>
        </div>
        <div className="signal-card">
          <div className="card-head"><div><span className="live-dot" /> LIVE SIGNAL</div><span>TripSignal</span></div>
          <div className="big-price">$427 <span>round trip</span></div>
          <div className="route">Kansas City <span>→</span> Amsterdam</div>
          <div className="route-meta">May 4–18, 2027 · Economy · 1 stop</div>
          <div className="divider" />
          <div className="airline-row"><strong>Delta / KLM</strong><span className="deal">$73 below your target</span></div>
          <div className="score-row"><span>DEAL SCORE</span><strong>94 / 100</strong></div>
          <div className="score"><i /></div>
          <button className="card-button">View flight →</button>
        </div>
      </section>
      <section className="trust shell"><span>BUILT FOR PEOPLE WHO WANT THE TRIP, NOT THE SEARCH.</span><div><b>Flexible destinations</b><b>Price targets</b><b>Weekly alerts</b><b>Custom rules</b></div></section>
      <section id="how" className="how shell"><div className="section-label">HOW IT WORKS</div><h2>Set the signal.<br />We’ll find the opportunity.</h2><div className="steps"><article><span>01</span><h3>Tell us what you want.</h3><p>Choose your origin, destination, dates, airlines, cabin, trip length, stop limit, and target price.</p></article><article><span>02</span><h3>We watch the market.</h3><p>TripSignal checks available fares on your schedule and filters out anything that misses your rules.</p></article><article><span>03</span><h3>You get the signal.</h3><p>When a qualifying fare appears, we send it to your inbox with the dates, route, price, and booking link.</p></article></div></section>
      <section className="demo shell"><div className="demo-copy"><p className="eyebrow">A BETTER WAY TO SEARCH</p><h2>“Anywhere in Europe.<br />Under $500.”</h2><p>That’s a search TripSignal can handle. No destination grid. No endless date combinations. Just a clear rule and an alert when it happens.</p><button className="primary">Build an alert <span>→</span></button></div><div className="criteria"><div className="criteria-title">YOUR ALERT</div><div className="criteria-item"><span>FROM</span><strong>Kansas City (MCI)</strong></div><div className="criteria-item"><span>TO</span><strong>Anywhere in Europe</strong></div><div className="criteria-item"><span>PRICE</span><strong>Under $500</strong></div><div className="criteria-item"><span>TRIP</span><strong>7–21 days</strong></div><div className="criteria-item"><span>FREQUENCY</span><strong>Every Monday</strong></div></div></section>
      <section className="signals shell"><div className="section-label">EXAMPLE SIGNALS</div><h2>What you could wake up to.</h2><div className="signal-list"><div className="signal-item"><div><strong>MCI → Amsterdam</strong><span>May 4–18, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$427</strong><small>94 score</small></div></div><div className="signal-item"><div><strong>MCI → Rome</strong><span>Apr 11–25, 2027 · Delta / Air France · 1 stop</span></div><div className="signal-price"><strong>$468</strong><small>91 score</small></div></div><div className="signal-item"><div><strong>MCI → Barcelona</strong><span>Jun 2–16, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$489</strong><small>89 score</small></div></div></div></section>
      <section className="cta shell"><div><p className="eyebrow">TRIPSIGNAL</p><h2>Tell us what a great fare looks like.</h2></div><button className="primary">Get started <span>→</span></button></section>
      <footer className="footer shell"><div className="brand"><span className="brand-mark" />TripSignal</div><span>Travel deals that meet your criteria.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
