import './home-refine.css';
import './home-align.css';
import './home-product.css';
import './home-next.css';
import './home-final.css';
import './premium-ui.css';
import './flighty-ui.css';
import Brand from '@/components/brand';
import SiteHeaderAuth from '@/components/site-header-auth';
import DiscoveryWithEmail from '@/components/discovery-with-email';
import HomeDashboard from '@/components/home-dashboard';
import ProUpgrade from '@/components/pro-upgrade';

export default function Home() {
  return (
    <main className="home-page">
      <SiteHeaderAuth />
      <section className="home-hero shell">
        <div className="home-hero-copy">
          <p className="hero-kicker">Flight price alerts & fare monitoring</p>
          <h1>Stop checking<br /><em>flight prices.</em></h1>
          <p className="lede">Tell TripSignal where you want to go and what you want to pay. We monitor flight fares for you and alert you when a fare matches your route, travel window and target price.</p>
          <div className="hero-actions"><a className="button button-primary" href="#explore">Start watching</a><a className="text-link" href="#how-it-works">How it works</a></div>
          <p className="hero-note">You decide when to book. TripSignal keeps watching.</p>
        </div>
      </section>
      <DiscoveryWithEmail />
      <section className="home-difference shell" id="how-it-works"><div className="home-difference-copy"><p className="section-kicker">Why TripSignal</p><h2>Search once.<br /><em>Let TripSignal keep checking.</em></h2></div><div className="home-steps"><article><span>1</span><h3>Set your watch</h3><p>Choose your route, travel window, cabin and target price.</p></article><article><span>2</span><h3>We keep watching</h3><p>TripSignal checks your watch on the schedule you choose.</p></article><article><span>3</span><h3>Get alerted</h3><p>When a fare matches your criteria, we’ll tell you.</p></article></div></section>
      <section className="product-preview shell"><HomeDashboard /></section>
      <section className="pricing-preview shell" aria-label="TripSignal pricing"><div className="pricing-preview-card"><div className="pricing-tier"><span>Free</span><strong>$0</strong><small>1 new watch each month</small><a className="button button-light" href="#explore">Start watching</a></div><div className="pricing-tier pricing-tier-pro"><span>TripSignal Pro</span><strong>$19.99</strong><small>per year · unlimited watches</small><ProUpgrade /></div></div></section>
      <section className="home-cta shell"><div><p className="section-kicker">Start watching flight prices</p><h2>Stop searching.<br /><em>Let TripSignal watch.</em></h2></div><a className="button button-primary" href="#explore">Start watching</a></section>
      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><div className="footer-links"><a href="/about">About</a><a href="/guides">Guides</a><a href="/faq">FAQ</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></div><span>© 2026 TripSignal · A Kova Media Group product</span></footer>
    </main>
  );
}
