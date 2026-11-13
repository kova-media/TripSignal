import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
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
  {
    href: '/guides/mistake-fares',
    title: 'Mistake fares: how they happen and how to catch one',
    description: 'What a mistake fare is, why it disappears fast, and what to do when you find one.',
  },
  {
    href: '/guides/how-fare-alerts-work',
    title: 'How fare alerts work',
    description: 'How a fare alert watches a route for you, what makes it fire, and how to set one up.',
  },
  {
    href: '/guides/cheap-southwest-flights',
    title: 'How to find cheap Southwest flights',
    description: 'Southwest changed its fares, bags, and seating in 2025–2026. How the new system works and where the cheap seats are.',
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
            <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesJsonLd) }} />
    </main>
  );
}
