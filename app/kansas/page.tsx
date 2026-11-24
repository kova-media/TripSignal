import type { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Built in Kansas | TripSignal',
  description: 'TripSignal is a flight fare-alert service built in Kansas.',
};

const kansasJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Built in Kansas',
  url: 'https://tripsignal.travel/kansas',
  description: 'TripSignal is a flight fare-alert service built in Kansas.',
  publisher: {
    '@type': 'Organization',
    name: 'TripSignal',
  },
};

export default function KansasPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Built in Kansas</h1>
          <p>TripSignal is a flight fare-alert service built in Kansas.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>Home</h2>
            <p>
              TripSignal was built in Kansas, by someone who got tired of checking flight
              prices by hand. It watches fares around the clock and emails you the moment
              one drops under the price you set — so you don&rsquo;t have to keep looking.
            </p>
          </section>
          <section>
            <h2>Kansas</h2>
            <p>
              <a href="https://myhomekansas.com" target="_blank" rel="noopener">My Home Kansas</a>{' '}
              is a community directory for Kansans — local events, businesses, and things
              to do around the state.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(kansasJsonLd) }} />
    </main>
  );
}
