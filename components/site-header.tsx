import Brand from '@/components/brand';
import ThemeToggle from '@/components/theme-toggle';

type SiteHeaderProps = {
  backHref?: string;
  backLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  authenticated?: boolean;
};

export default function SiteHeader({ backHref, backLabel, primaryHref, primaryLabel, authenticated = false }: SiteHeaderProps) {
  return (
    <nav className="nav shell">
      <a className="brand-link" href="/" aria-label="TripSignal home">
        <Brand />
      </a>
      <div className="nav-actions">
        {backHref && backLabel ? <a className="text-link" href={backHref}>{backLabel}</a> : null}
        {authenticated ? <a className="text-button" href="/api/auth/signout">Sign out</a> : !backHref ? <a className="text-button" href="/signin">Sign in</a> : null}
        <ThemeToggle />
        {primaryHref && primaryLabel ? <a className="button button-primary" href={primaryHref}>{primaryLabel}</a> : !backHref ? <a className="button button-primary" href="/alerts">Create alert</a> : null}
      </div>
    </nav>
  );
}
