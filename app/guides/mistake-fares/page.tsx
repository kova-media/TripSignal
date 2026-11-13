import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import '../../legal.css';

export const metadata: Metadata = {
  title: 'Mistake Fares: How They Happen and How to Catch One',
  description: 'What a mistake fare is, why it disappears fast, and how to catch one before the airline fixes the price.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mistake fares: how they happen and how to catch one',
  description: 'What a mistake fare is, why it disappears fast, and how to catch one before the airline fixes the price.',
  author: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
};

export default function MistakeFaresGuidePage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal guides</p>
          <h1>Mistake fares: how they happen and how to catch one</h1>
          <p>Every so often an airline sells a ticket for a fraction of its real price. Here&rsquo;s what&rsquo;s going on — and how to be the one who gets it.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>What a mistake fare is</h2>
            <p>
              A mistake fare is a real ticket sold at a wrong price because of a pricing error:
              a currency conversion slip, a fuel surcharge left off, a digit dropped from the
              fare. The ticket itself is genuine — it just costs far less than the airline
              intended. They are rare, and they never last long.
            </p>
          </section>
          <section>
            <h2>Why they disappear fast</h2>
            <p>
              Airlines notice quickly. A fare that is a tenth of its normal price gets spotted
              within hours, sometimes minutes, and the price gets corrected. Some airlines honor
              the tickets already sold; others cancel them. That uncertainty is part of the deal —
              a mistake fare is a gamble with excellent odds, not a guarantee.
            </p>
          </section>
          <section>
            <h2>How to catch one</h2>
            <p>
              You cannot predict a mistake fare, but you can be positioned for one. Be flexible
              about where and when you fly, because you do not get to choose the route — the
              error does. Watch broadly: set fare alerts on the routes and regions you would
              actually travel, with target prices low enough that a sudden drop stands out.
              When a fare collapses far below its normal range, that is the signal to move.
            </p>
          </section>
          <section>
            <h2>What to do when you find one</h2>
            <p>
              Book it immediately, before the price is corrected — then stop. Do not call the
              airline to ask about the fare; that only speeds up the fix. And do not book
              hotels, rental cars, or anything else non-refundable until your ticket is
              confirmed and issued. If the airline honors it, you have the deal of the year.
              If it cancels the ticket, you are out nothing but the excitement.
            </p>
          </section>
          <section>
            <h2>What a mistake fare is not</h2>
            <p>
              It is not a sale, a promo code, or a loyalty perk. Sales are planned and
              advertised; mistake fares are accidents, and they are gone before most people
              hear about them. The way to catch one is the same as the way to catch any
              good fare: watch the routes you care about, and be ready to book the moment
              the price moves.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/alerts">Set up a fare watch</a> or <a href="/guides/how-fare-alerts-work">learn how fare alerts work</a>.
          </p>
        </div>
      </article>
            <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </main>
  );
}
