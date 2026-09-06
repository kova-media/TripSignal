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
    <nav className="nav shell site-header">
      <a className="brand-link site-header-brand" href="/" aria-label="TripSignal home">
        <Brand />
      </a>

      <div className="nav-actions site-header-actions">
        {backHref && backLabel ? <a className="text-link site-header-back" href={backHref}>{backLabel}</a> : null}
        <a className="text-button site-header-signin" href={authenticated ? '/api/auth/signout' : '/signin'}>
          {authenticated ? 'Sign out' : 'Sign in'}
        </a>
        <div className="site-header-theme"><ThemeToggle /></div>
        {primaryHref && primaryLabel ? <a className="button button-primary site-header-primary" href={primaryHref}>{primaryLabel}</a> : !backHref ? <a className="button button-primary site-header-primary" href="/alerts">Create alert</a> : null}
      </div>
    </nav>
  );
}
