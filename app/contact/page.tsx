import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact TripSignal for account, billing, refund, privacy and service questions.',
};

export default function ContactPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Contact</h1>
          <p>For questions about your account, flight watches, billing, refunds, privacy or the TripSignal service, contact us by email.</p>
        </header>
        <div className="legal-body">
          <h2>Get in touch</h2>
          <p><a href="mailto:alerts@tripsignal.travel">alerts@tripsignal.travel</a></p>
          <p>When contacting us about an account or billing issue, use the email address associated with your TripSignal account when possible. Do not send payment card numbers or passwords by email.</p>

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
