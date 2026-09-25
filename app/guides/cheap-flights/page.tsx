import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../../legal.css';

export const metadata: Metadata = {
  title: 'How to Find Cheap Flights',
  description: 'Practical advice on finding cheap flights: flexible dates, fare alerts, alternate airports, and booking directly with airlines.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to find cheap flights',
  description: 'Practical advice on finding cheap flights: flexible dates, fare alerts, alternate airports, and booking directly with airlines.',
  author: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Kova Media Group',
  },
};

export default function CheapFlightsGuidePage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal guides</p>
          <h1>How to find cheap flights</h1>
          <p>The strategies that actually lower fares — no incognito-mode myths required.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>Be flexible with dates</h2>
            <p>
              This is the single biggest lever. Flying a day or two earlier or later can cut the
              fare by a third or more, especially around weekends and holidays. Midweek flights
              are almost always cheaper than Friday evening or Sunday evening flights.
            </p>
          </section>
          <section>
            <h2>Set a fare alert and wait</h2>
            <p>
              Fares change constantly — sometimes several times a day. Rather than checking
              manually, set a fare alert with your target price and let it do the checking for
              you. TripSignal watches fares on a schedule you choose and emails you when one
              matches your criteria, so you book when the price is right instead of when you
              happen to look.
            </p>
          </section>
          <section>
            <h2>Check alternate airports</h2>
            <p>
              Big metro areas often have two or three airports, and fares between them can
              differ wildly. Factor in ground transportation costs, but a cheaper airport
              paired with a train or bus can still beat the convenient option by a wide margin.
            </p>
          </section>
          <section>
            <h2>Book directly with the airline when you can</h2>
            <p>
              Third-party sites occasionally undercut the airline, but booking direct usually
              means better change and cancellation policies, faster customer service, and full
              frequent-flyer credit. Compare prices, then check the airline&rsquo;s own site
              before you buy.
            </p>
          </section>
          <section>
            <h2>Be wary of fare myths</h2>
            <p>
              Clearing cookies or using incognito mode does not reliably lower prices. There is
              no magic day of the week to buy — what matters is the specific route, season,
              and how full the flight already is. Consistent monitoring beats superstition.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/alerts">Set up a fare watch</a> or <a href="/guides/when-to-book">learn when to book</a>.
          </p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </main>
  );
}
