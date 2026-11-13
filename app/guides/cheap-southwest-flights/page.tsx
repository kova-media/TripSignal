import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import '../../legal.css';

export const metadata: Metadata = {
  title: 'How to Find Cheap Southwest Flights',
  description: 'Southwest changed its fares, bags, and seating in 2025–2026. Here is how the new system works and how to get the lowest fare on it.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to find cheap Southwest flights',
  description: 'Southwest changed its fares, bags, and seating in 2025–2026. Here is how the new system works and how to get the lowest fare on it.',
  author: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
};

export default function CheapSouthwestFlightsGuidePage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal guides</p>
          <h1>How to find cheap Southwest flights</h1>
          <p>Southwest is not the airline it was two years ago. Here is how the new fares, bags, and seating work — and where the cheap seats are.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>What changed</h2>
            <p>
              In 2025 and 2026 Southwest rebuilt the basics. Checked bags are no longer free
              for most fares, open seating is gone, and there are now four fare bundles —
              Basic, Choice, Choice Preferred, and Choice Extra — instead of one simple
              ticket. The old advice about Southwest is mostly out of date. The new advice
              starts with doing the math on the total trip, not just the base fare.
            </p>
          </section>
          <section>
            <h2>Count the bags before you count the fare</h2>
            <p>
              On Basic, Choice, and Choice Preferred fares, a first checked bag costs $45
              and a second $55, each way on U.S. mainland routes. A carry-on and a personal
              item are still free on every fare, and Choice Extra includes the first two
              checked bags. A base fare that looks $40 cheaper can cost more than the
              alternative once bags are added — so compare the all-in price, not the
              headline number.
            </p>
          </section>
          <section>
            <h2>Seats are assigned now</h2>
            <p>
              Since January 27, 2026, Southwest uses assigned seating with numbered boarding
              groups 1 through 8. Choice fares and above let you pick a seat at booking;
              Basic passengers get a seat assigned at check-in. The old strategy of lining
              up early for a good seat is gone — the fare you buy now decides where you sit.
            </p>
          </section>
          <section>
            <h2>No change fees is still the real advantage</h2>
            <p>
              One thing did not change: there are no change fees on any Southwest fare, only
              a fare difference if the new flight costs more. That makes Southwest unusually
              friendly to fare watchers. Book when the price is reasonable, and if the fare
              drops later, change to the same flight at the lower price and keep the
              difference as credit. A fare alert does the watching for you.
            </p>
          </section>
          <section>
            <h2>When Southwest is cheapest</h2>
            <p>
              The usual rules hold: midweek flights beat weekend flights, and booking early
              usually beats booking late — but Southwest prices move constantly, and the
              lowest fare on a route often appears and disappears within days. Watch the
              route rather than guessing the day. Set a target price below today&rsquo;s fare
              and let the alert tell you when it drops.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/alerts">Set up a fare watch</a> or <a href="/guides/cheap-flights">learn how to find cheap flights</a>.
          </p>
        </div>
      </article>
            <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </main>
  );
}
