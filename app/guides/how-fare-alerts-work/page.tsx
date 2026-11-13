import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import '../../legal.css';

export const metadata: Metadata = {
  title: 'How Fare Alerts Work',
  description: 'How a fare alert watches a route for you, what makes it fire, and how to set one up so you only hear about it when the price is right.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How fare alerts work',
  description: 'How a fare alert watches a route for you, what makes it fire, and how to set one up so you only hear about it when the price is right.',
  author: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
};

export default function HowFareAlertsWorkGuidePage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal guides</p>
          <h1>How fare alerts work</h1>
          <p>Set a price once, and let something else do the checking. Here&rsquo;s what happens behind the scenes.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>You describe the trip you want</h2>
            <p>
              A fare alert starts with a watch: where you are flying from and to, your travel
              dates, the cabin, and the maximum price you are willing to pay. You can narrow
              it further — a specific airline, or a limit on stops. The more precise the
              watch, the more precise the alert.
            </p>
          </section>
          <section>
            <h2>The watch gets checked on a schedule</h2>
            <p>
              Fares change constantly, sometimes several times a day, so checking once by hand
              is not enough. TripSignal checks your watch on a regular schedule and compares
              the latest fare against your target price. You do not have to remember to look —
              the checking happens whether you are thinking about the trip or not.
            </p>
          </section>
          <section>
            <h2>The alert only fires when the price is right</h2>
            <p>
              An alert goes out only when a fare comes in under your target — and only the
              first time that fare appears. You will not get an email every time the same
              cheap fare is seen again, and you will not get emails about fares above your
              price. Silence means the fare has not dropped yet, not that the watch stopped
              working.
            </p>
          </section>
          <section>
            <h2>Set the target honestly</h2>
            <p>
              The target price is the whole game. Set it at a fare you would actually book,
              not a fantasy number — a target no fare ever reaches produces no alerts at all.
              A good starting point is 15–25% below the fare you see today, then adjust if
              nothing fires after a few weeks. And remember: the alert tells you the price
              dropped. Booking it is still up to you, and the fare can rise again.
            </p>
          </section>
          <section>
            <h2>One watch per trip, or watch everywhere</h2>
            <p>
              If you know exactly where you are going, one watch on that route is enough. If
              you are flexible, you can watch a whole region instead and let the alert tell
              you where the cheap fares are. Either way, the principle is the same: decide
              your price in advance, and let the alert do the waiting.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/alerts">Set up a fare watch</a> or <a href="/guides/mistake-fares">learn about mistake fares</a>.
          </p>
        </div>
      </article>
            <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </main>
  );
}
