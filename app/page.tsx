import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';

const faqs = [
  ['What does TripSignal actually watch?', 'You define the rules for a trip, including route, destination region, dates, price, cabin, airlines, stops, and trip length. TripSignal searches for fares that fit those rules and sends you a signal when it finds one.'],
  ['Does TripSignal book the flight?', 'No. TripSignal finds and filters qualifying fares. When a signal arrives, you can follow the flight link and book directly with the airline or travel provider.'],
  ['Can I search flexible destinations?', 'Yes. You can create alerts around regions such as Europe instead of naming one destination, then let TripSignal identify qualifying routes.'],
  ['How often will TripSignal check?', 'Your alert has a search frequency. TripSignal checks active alerts on that schedule and only sends a signal when a fare meets your criteria.'],
  ['Can I control the airlines and number of stops?', 'Yes. Your alert can include airline preferences and a maximum number of stops, along with your price, cabin, dates, and trip length.'],
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero shell">
        <div className="hero-copy">
          <p className="hero-kicker">Flight search, on your terms.</p>
          <h1>Tell us what a great flight looks like.<br /><em>We’ll find it.</em></h1>
          <p className="lede">Set your route, destinations, dates, cabin, airlines, stops, trip length, and price. TripSignal keeps searching until a fare fits the rules you set.</p>
          <div className="hero-actions"><a className="button button-primary" href="/alerts">Create your first alert <span>↗</span></a><a className="text-link" href="#how">See how it works</a></div>
          <p className="hero-note">Set it once. We do the searching.</p>
        </div>

        <div className="product-preview hero-signal" aria-label="Example TripSignal flight signal">
          <div className="preview-top"><span className="status"><i /> Signal found</span><span>Just now</span></div>
          <div className="signal-context">Your alert · MCI → Anywhere in Europe · Under $500</div>
          <div className="preview-price"><span>$</span>427</div>
          <div className="preview-route"><strong>MCI</strong><span>→</span><strong>AMS</strong></div>
          <div className="preview-dates">May 4–18, 2027</div>
          <div className="preview-details"><span>Delta / KLM</span><span>Economy · 1 stop</span><span>9h 42m</span></div>
          <div className="preview-rule"><span>Your target</span><strong>$500</strong><b>$73 below target</b></div>
          <div className="preview-footer"><span>Matches 6 of 6 criteria</span><a href="/alerts">View signal <span>↗</span></a></div>
        </div>
      </section>

      <section className="trust shell"><span>Built for people who want the trip, not the search.</span><div><b>Flexible destinations</b><b>Price targets</b><b>Custom rules</b><b>Scheduled searches</b></div></section>

      <section id="how" className="how shell">
        <div className="section-intro"><p className="section-kicker">How it works</p><h2>Give us the hard search.<br />Keep the easy part.</h2><p>Google Flights is excellent when you want to search. TripSignal is for when you already know what a good fare looks like and want someone to keep looking for it.</p></div>
        <div className="steps">
          <article><h3>Define the trip.</h3><p>Choose your origin, destination or region, dates, cabin, airlines, trip length, stop limit, and target price.</p></article>
          <article><h3>Let us watch.</h3><p>TripSignal checks active alerts on your schedule and filters out anything that misses the rules you set.</p></article>
          <article><h3>Get the signal.</h3><p>When a qualifying fare appears, you get the route, dates, price, airline, and a link to view the flight.</p></article>
        </div>
      </section>

      <section className="alert-demo shell">
        <div className="alert-demo-copy">
          <p className="section-kicker">Build the search once</p>
          <h2>“Anywhere in Europe.<br />Under $500.”</h2>
          <p>That is a search TripSignal can handle. Add the rules that matter to you, then stop rebuilding the same search every week.</p>
          <a className="button button-primary" href="/alerts">Build an alert <span>↗</span></a>
        </div>
        <div className="criteria-live">
          <div className="criteria-title"><span>Your alert</span><i>Ready to watch</i></div>
          <div className="criteria-item"><span>From</span><strong>Kansas City <small>MCI</small></strong></div>
          <div className="criteria-item"><span>To</span><strong>Anywhere in Europe</strong></div>
          <div className="criteria-item"><span>Price</span><strong>Under $500</strong></div>
          <div className="criteria-item"><span>Trip length</span><strong>7–21 days</strong></div>
          <div className="criteria-item"><span>Stops</span><strong>1 or fewer</strong></div>
          <div className="criteria-item"><span>Frequency</span><strong>Every Monday</strong></div>
        </div>
      </section>

      <section className="why shell">
        <div className="section-intro"><p className="section-kicker">Why TripSignal</p><h2>More rules.<br />Less searching.</h2></div>
        <div className="why-grid">
          <article><h3>You choose the rules.</h3><p>Not just a route and a date. Set price, airlines, stops, trip length, cabin, and flexible destinations.</p></article>
          <article><h3>We search while you don't.</h3><p>Your alert stays active on its schedule. You do not have to rebuild the same combinations over and over.</p></article>
          <article><h3>You only hear when it matters.</h3><p>A signal means a fare matched the criteria you set. The useful details arrive together so you can decide quickly.</p></article>
        </div>
      </section>

      <section className="signals shell">
        <div className="section-intro"><p className="section-kicker">Example signals</p><h2>Useful when you need them.</h2><p>These are examples of what a qualifying signal can look like.</p></div>
        <div className="signal-list"><div className="signal-item"><div><strong>MCI → Amsterdam</strong><span>May 4–18, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$427</strong><small>$73 below target</small></div></div><div className="signal-item"><div><strong>MCI → Madrid</strong><span>June 2–15, 2027 · Delta / Air France · 1 stop</span></div><div className="signal-price"><strong>$468</strong><small>$32 below target</small></div></div><div className="signal-item"><div><strong>MCI → Barcelona</strong><span>June 2–16, 2027 · Delta / KLM · 1 stop</span></div><div className="signal-price"><strong>$489</strong><small>$11 below target</small></div></div></div>
      </section>

      <section className="trust-panel shell"><div><p className="section-kicker">Simple by design</p><h2>TripSignal finds the fare.<br />You make the decision.</h2></div><p>We do not sell the ticket. We surface qualifying fares and give you the information and flight link you need to decide whether to book.</p></section>

      <section className="faq shell"><div className="section-intro"><p className="section-kicker">Questions</p><h2>Before you create an alert.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="cta shell"><div><p className="section-kicker">Start watching</p><h2>Tell us what a great fare looks like.</h2></div><a className="button button-primary" href="/alerts">Create an alert <span>↗</span></a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
