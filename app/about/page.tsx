import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'About TripSignal',
  description: 'TripSignal monitors flight fares around the clock and emails you when a fare matches your criteria. A Kova Media Group product.',
};

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About TripSignal',
  url: 'https://tripsignal.travel/about',
  description: 'TripSignal is a flight fare monitoring service. Set up a watch and get an email when a fare matches your criteria.',
  publisher: {
    '@type': 'Organization',
    name: 'Kova Media Group',
  },
};

export default function AboutPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>About TripSignal</h1>
          <p>Flight fares move constantly. TripSignal watches them so you don&rsquo;t have to.</p>
        </header>
        <div className="legal-body">
          <section>
            <h2>What TripSignal does</h2>
            <p>
              TripSignal is a flight price alert service. You tell it where you want to go, when,
              in which cabin, and what you want to pay. It then keeps checking fares and emails
              you when a fare matches your criteria. You book wherever you like — TripSignal
              doesn&rsquo;t sell tickets.
            </p>
          </section>
          <section>
            <h2>How it works</h2>
            <p>
              Create a watch with your route, travel window or dates, cabin, stops, and target
              price. Each watch runs on the check frequency you choose — daily, weekly, or
              monthly — and you get an email the moment a qualifying fare shows up. The free
              plan includes one new watch each month; TripSignal Pro is $19.99 per year with
              unlimited watches.
            </p>
          </section>
          <section>
            <h2>Who builds it</h2>
            <p>
              TripSignal is a Kova Media Group product. It started as a tool we wanted for
              ourselves: a simple, honest fare monitor with no ads, no upsells, and no
              booking markup.
            </p>
          </section>
          <p style={{ marginTop: 48 }}>
            <a href="/faq">Read the FAQ</a> for details, or <a href="/contact">contact us</a> with questions.
          </p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
    </main>
  );
}
