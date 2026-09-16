import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import ContactForm from './contact-form';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact TripSignal about your account, flight watches, billing, refunds, privacy or service questions.',
};

export default function ContactPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Contact</h1>
          <p>Have a question about your account, flight watches, billing, refunds, privacy or the TripSignal service? Send us a message and we’ll get back to you.</p>
        </header>
        <div className="legal-body">
          <h2>Send a message</h2>
          <p>Use the form below. Your message is sent directly to the TripSignal team. The automated address used for flight alerts is not monitored for incoming mail.</p>
          <ContactForm />

          <h2>Support topics</h2>
          <ul>
            <li>Account access and flight price watches</li>
            <li>Alert delivery and service issues</li>
            <li>TripSignal Pro billing</li>
            <li>Refund requests</li>
            <li>Privacy and personal-data requests</li>
          </ul>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></div>
      </footer>
    </main>
  );
}
