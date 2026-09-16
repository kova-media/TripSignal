import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'TripSignal refund policy for paid flight fare monitoring and Pro subscriptions.',
};

export default function RefundsPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Refund Policy</h1>
          <p>Our refund policy for TripSignal paid subscriptions and other paid features.</p>
        </header>
        <div className="legal-body">
          <h2>1. Pro subscription refunds</h2>
          <p>TripSignal Pro is currently an annual subscription. If you purchased a Pro subscription and decide it is not right for you, you may request a refund within 30 days of the initial purchase.</p>

          <h2>2. How to request a refund</h2>
          <p>Use the <a href="/contact">TripSignal contact form</a> to request a refund. Include the email address associated with your TripSignal account and the date of purchase so we can locate the subscription.</p>

          <h2>3. Refund processing</h2>
          <p>Approved refunds are returned through the original payment method. Processing time can depend on the payment provider and your financial institution.</p>

          <h2>4. Renewals and other charges</h2>
          <p>Refund requests for renewal charges made more than 30 days after the charge are not covered by the standard refund window and may be considered individually. Any refund rights that cannot legally be waived remain unaffected by this policy.</p>

          <h2>5. Free access</h2>
          <p>There is nothing to refund for free TripSignal access. Creating or using a free account does not create a paid charge.</p>

          <h2>6. Changes to this policy</h2>
          <p>We may update this policy when our pricing or billing practices change. The current version will be published on this page.</p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></div>
      </footer>
    </main>
  );
}
