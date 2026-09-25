import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../../legal.css';

export const metadata: Metadata = {
  title: 'When to Book Flights for the Lowest Fare',
  description: 'What actually matters when timing a flight booking: booking windows, seasonality, and why fare monitoring beats guessing.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'When to book flights for the lowest fare',
  description: 'What actually matters when timing a flight booking: booking windows, seasonality, and why fare monitoring beats guessing.',
  author: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Kova Media Group',
  },
};

export default function WhenToBookGuidePage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal guides</p>
          <h1>When to book flights for the lowest fare</h1>
          <p>There&rsquo;s no magic day. But there are patterns worth knowing — and a way to stop guessing.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>The booking window matters more than the weekday</h2>
            <p>
              Studies consistently find that how far in advance you book matters far more than
              which day of the week you buy. For domestic trips, the sweet spot is typically a
              few weeks to a couple of months out; for international travel, it&rsquo;s often
              two to five months. Book too early and you miss later price drops; book too late
              and you pay for scarcity.
            </p>
          </section>
          <section>
            <h2>Seasonality drives prices</h2>
            <p>
              Summer, spring break, and the December holidays are the most expensive times to
              fly. Shoulder seasons — late spring and early fall — usually bring the lowest
              fares. If your schedule allows, shifting a trip by a few weeks into the shoulder
              season is one of the cheapest moves available.
            </p>
          </section>
          <section>
            <h2>Last-minute deals are unreliable</h2>
            <p>
              Airlines do occasionally drop unsold seats at the last minute, but counting on it
              is a gamble. Last-minute fares are more often the most expensive ones, especially
              on business-heavy routes. If you can&rsquo;t be flexible, book when you see a
              good price rather than hoping for a better one.
            </p>
          </section>
          <section>
            <h2>Why watching beats guessing</h2>
            <p>
              Every route has its own rhythm, and general rules can be wrong for your specific
              trip. That&rsquo;s what fare monitoring is for: set your target price, and get
              an email when a fare on your route hits it. TripSignal checks fares daily,
              weekly, or monthly — so instead of wondering whether today is the right day to
              buy, you&rsquo;ll know the moment your price arrives.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/alerts">Set up a fare watch</a> or <a href="/guides/cheap-flights">learn how to find cheap flights</a>.
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
