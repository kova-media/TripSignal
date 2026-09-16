import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of TripSignal, including flight fare monitoring, accounts, subscriptions and alerts.',
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Terms of Service</h1>
          <p>These terms govern your use of TripSignal, a flight fare monitoring service that checks selected fare criteria and sends alerts when a qualifying fare is found.</p>
        </header>
        <div className="legal-body">
          <h2>1. Using TripSignal</h2>
          <p>By creating an account or using TripSignal, you agree to these Terms of Service. You must provide accurate account information and keep your login credentials secure. You are responsible for activity performed through your account.</p>

          <h2>2. What TripSignal does</h2>
          <p>TripSignal monitors flight fare information according to the criteria you provide, such as route, travel dates or travel window, cabin, stops and target price. Alerts are informational. TripSignal does not sell or issue airline tickets and does not complete flight bookings for you.</p>
          <p>Fare availability, pricing, schedules and airline inventory can change at any time. A fare shown in an alert may no longer be available when you attempt to book it. TripSignal does not guarantee that a qualifying fare will remain available or that an alert will be delivered without delay.</p>

          <h2>3. Accounts and alerts</h2>
          <p>You may create and manage flight price watches through your account. You are responsible for selecting appropriate criteria and for reviewing alerts before making travel decisions. TripSignal may limit or suspend automated activity that appears abusive, fraudulent or harmful to the service.</p>

          <h2>4. Free and paid plans</h2>
          <p>TripSignal may offer both free and paid features. Current pricing and included features are shown on the site at the time of purchase. Paid access is subject to the refund policy published on the site.</p>

          <h2>5. Pro subscriptions</h2>
          <p>TripSignal Pro is currently offered as an annual subscription. Unless otherwise stated at checkout, a subscription continues for its stated term and may renew according to the terms shown when you purchase it. You can manage eligible billing actions through the account billing controls.</p>

          <h2>6. Acceptable use</h2>
          <p>You may not use TripSignal to interfere with the service, bypass reasonable access controls, scrape or abuse the service, impersonate another person, or use the service for unlawful activity. You may not attempt to gain unauthorized access to another account or to systems connected to TripSignal.</p>

          <h2>7. Service changes and availability</h2>
          <p>TripSignal may change, suspend or discontinue features as the service develops. We may also perform maintenance or experience interruptions. We do not guarantee uninterrupted availability.</p>

          <h2>8. Disclaimers</h2>
          <p>TripSignal is provided for informational and monitoring purposes. Travel purchases are your responsibility. TripSignal does not guarantee any particular fare, savings amount, booking outcome, airline availability, schedule, or travel experience.</p>

          <h2>9. Limitation of liability</h2>
          <p>To the fullest extent permitted by applicable law, TripSignal will not be liable for indirect, incidental, special, consequential or punitive damages arising from your use of the service, including losses resulting from fare changes, missed availability, booking decisions or service interruptions.</p>

          <h2>10. Termination</h2>
          <p>You may stop using TripSignal at any time. We may suspend or terminate access when reasonably necessary, including for violations of these terms, fraud, abuse, security concerns or legal requirements.</p>

          <h2>11. Changes to these terms</h2>
          <p>We may update these terms as the service changes. The current version will be published on this page. Continued use of TripSignal after an update becomes effective constitutes acceptance of the revised terms to the extent permitted by law.</p>

          <h2>12. Contact</h2>
          <p>Questions about these terms can be sent to <a href="mailto:alerts@tripsignal.travel">alerts@tripsignal.travel</a>.</p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></div>
      </footer>
    </main>
  );
}
