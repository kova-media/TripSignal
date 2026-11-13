import Brand from '@/components/brand';

/**
 * The one shared footer. Every public and signed-in page renders this exact
 * footer: brand, the full nav, and the copyright line.
 *
 * Do not copy-paste a local footer variant into a page — use this. The old
 * per-page footers (slim legal-footer, tagline footer, brand-only footer, and
 * pages with no footer at all) were the reason the site looked inconsistent.
 */
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`footer shell${className ? ` ${className}` : ''}`}>
      <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
      <div className="footer-links">
        <a href="/about">About</a>
        <a href="/deals">Deals</a>
        <a href="/anywhere">Anywhere</a>
        <a href="/guides">Guides</a>
        <a href="/faq">FAQ</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/refunds">Refunds</a>
        <a href="/contact">Contact</a>
      </div>
      <span>© 2026 TripSignal</span>
    </footer>
  );
}
