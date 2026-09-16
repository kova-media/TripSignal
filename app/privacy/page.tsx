import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'TripSignal privacy policy covering account information, flight watch criteria, alerts, billing and service data.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Privacy Policy</h1>
          <p>This policy explains what information TripSignal collects, how it is used, and the choices available to you when you use the service.</p>
        </header>
        <div className="legal-body">
          <h2>1. Information we collect</h2>
          <p>When you use TripSignal, we may collect information you provide directly and information generated while the service operates.</p>
          <ul>
            <li>Account information, such as your email address and name if you provide one.</li>
            <li>Flight watch information, such as origin, destination, dates or travel windows, cabin, stop preferences and target price.</li>
            <li>Alert and service history, such as when a watch was checked and when a qualifying signal was sent.</li>
            <li>Subscription and billing information needed to manage paid access. Payment card details are handled by the payment provider rather than stored directly by TripSignal.</li>
            <li>Technical information needed to operate and secure the service, such as session information and limited request or device information.</li>
          </ul>

          <h2>2. How we use information</h2>
          <p>We use information to create and operate your account, monitor the flight criteria you choose, send requested alerts, provide paid features, process billing, maintain security, troubleshoot the service, and improve TripSignal.</p>

          <h2>3. Email alerts</h2>
          <p>If you create a flight watch, we use your email address to deliver the alerts associated with that watch and other necessary service communications. TripSignal does not need your email address for unrelated marketing unless you separately choose to receive such communications.</p>

          <h2>4. Payments</h2>
          <p>Paid subscriptions are processed through our payment provider. TripSignal receives the information necessary to identify the customer and subscription status, but payment card information is handled by the payment provider.</p>

          <h2>5. Service providers</h2>
          <p>TripSignal uses third-party providers to operate parts of the service, including payment processing, transactional email, hosting and infrastructure, and flight or fare data. Those providers may process information as necessary to provide their services to TripSignal.</p>

          <h2>6. Data retention</h2>
          <p>We retain account, watch and service information for as long as reasonably necessary to provide the service, maintain records, resolve disputes, enforce our terms, and meet legal or security requirements. You may request deletion of your account information, subject to information we are required or permitted to retain.</p>

          <h2>7. Security</h2>
          <p>TripSignal uses reasonable technical and organizational measures intended to protect account and service information. No internet service can guarantee absolute security.</p>

          <h2>8. Cookies and sessions</h2>
          <p>TripSignal may use cookies or similar browser storage mechanisms that are necessary to keep you signed in, maintain sessions, remember service preferences, and protect the service. Disabling required browser storage may prevent parts of the service from working correctly.</p>

          <h2>9. Your choices</h2>
          <p>You can stop using TripSignal at any time. You may also contact us to request access to, correction of, or deletion of personal information associated with your account, subject to applicable law and legitimate retention requirements.</p>

          <h2>10. Children's privacy</h2>
          <p>TripSignal is not directed to children under 13, and we do not knowingly collect personal information from children under 13.</p>

          <h2>11. Changes to this policy</h2>
          <p>We may update this Privacy Policy when the service or applicable requirements change. The current version will be published on this page.</p>

          <h2>12. Contact</h2>
          <p>Privacy questions or requests can be sent to <a href="mailto:alerts@tripsignal.travel">alerts@tripsignal.travel</a>.</p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></div>
      </footer>
    </main>
  );
}
