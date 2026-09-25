import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about TripSignal flight price alerts: how fare monitoring works, pricing, and how to get the most out of your watches.',
};

const faqs: Array<{ q: string; a: string }> = [
  {
    q: 'What is TripSignal?',
    a: 'TripSignal is a flight fare monitoring service. You tell it where you want to go, when, in which cabin, and what you want to pay — then it keeps checking fares and emails you when a fare matches your criteria.',
  },
  {
    q: 'How do flight price alerts work?',
    a: 'Create a watch with your route, travel window or dates, cabin, stops, and target price. TripSignal checks fares on the schedule you choose — daily, weekly, or monthly — and sends you an email when a qualifying fare appears. You decide where to book.',
  },
  {
    q: 'Does TripSignal book my flights?',
    a: 'No. TripSignal monitors fares and alerts you; it does not sell tickets or complete bookings. When you get an alert, you book directly with the airline or travel site of your choice.',
  },
  {
    q: 'How much does TripSignal cost?',
    a: 'The free plan includes one new watch each month. TripSignal Pro is $19.99 per year and includes unlimited watches.',
  },
  {
    q: 'How often are fares checked?',
    a: 'Each watch runs on the check frequency you select: daily, weekly, or monthly. You can change it any time from your account.',
  },
  {
    q: 'Which routes and airlines are covered?',
    a: 'TripSignal monitors fares worldwide. You can narrow a watch to a specific airline, a maximum number of stops, and a cabin class — or leave it open to catch the cheapest qualifying fare.',
  },
  {
    q: 'Why haven\u2019t I received an alert yet?',
    a: 'You only get an alert when a fare meets all of your criteria. If nothing has matched yet, try widening your travel window, raising your target price, or allowing more stops. Fares move constantly, so a watch that is quiet today can trigger tomorrow.',
  },
  {
    q: 'How do I cancel TripSignal Pro?',
    a: 'You can manage your subscription from your account billing page. Refunds follow the refund policy published on this site.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Frequently asked questions</h1>
          <p>How flight price alerts work, what TripSignal costs, and how to get the most out of your watches.</p>
        </header>
        <div className="legal-body">
          {faqs.map((faq) => (
            <section key={faq.q}>
              <h2>{faq.q}</h2>
              <p>{faq.a}</p>
            </section>
          ))}
          <p style={{ marginTop: 48 }}>
            Still stuck? <a href="/contact">Contact us</a> and we&rsquo;ll help.
          </p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
