import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Flight Deal Guides',
  description: 'Practical guides from TripSignal on finding cheap flights and booking at the right time.',
};

const guides = [
  {
    href: '/guides/cheap-flights',
    title: 'How to find cheap flights',
    description: 'Honest, practical advice on finding lower fares: flexible dates, fare alerts, alternate airports, and more.',
  },
  {
    href: '/guides/when-to-book',
    title: 'When to book flights for the lowest fare',
    description: 'What the research actually says about booking windows — and why watching beats guessing.',
  },
];

const guidesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Flight Deal Guides',
  description: 'Practical guides from TripSignal on finding cheap flights and booking at the right time.',
};

export default function GuidesPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Flight deal guides</h1>
          <p>Practical advice on finding cheap flights and booking at the right time. No hype — just what works.</p>
        </header>
        <div className="legal-body">
          {guides.map((guide) => (
            <section key={guide.href}>
              <h2><a href={guide.href}>{guide.title}</a></h2>
              <p>{guide.description}</p>
            </section>
          ))}
          <p style={{ marginTop: 48 }}>
            Questions? <a href="/faq">Read the FAQ</a> or <a href="/contact">contact us</a>.
          </p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesJsonLd) }} />
    </main>
  );
}
