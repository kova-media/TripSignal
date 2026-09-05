import Brand from '@/components/brand';
import ThemeToggle from '@/components/theme-toggle';

type SiteHeaderProps = {
  backHref?: string;
  backLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export default function SiteHeader({ backHref, backLabel, primaryHref, primaryLabel }: SiteHeaderProps) {
  return (
    <nav className="nav shell">
      <a className="brand-link" href="/" aria-label="TripSignal home">
        <Brand />
      </a>
      <div className="nav-actions">
        {backHref && backLabel ? <a className="text-link" href={backHref}>{backLabel}</a> : <a className="nav-how" href="#how">How it works</a>}
        {!backHref && <a className="text-button" href="/alerts">Sign in</a>}
        <ThemeToggle />
        {primaryHref && primaryLabel ? <a className="button button-dark" href={primaryHref}>{primaryLabel}</a> : !backHref ? <a className="button button-dark" href="/alerts">Create alert</a> : null}
      </div>
    </nav>
  );
}
