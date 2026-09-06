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
    <>
      <nav className="nav shell site-header">
        <a className="brand-link site-header-brand" href="/" aria-label="TripSignal home">
          <Brand />
        </a>
        <div className="nav-actions site-header-actions">
          {backHref && backLabel ? <a className="text-link site-header-back" href={backHref}>{backLabel}</a> : null}
          {authenticated ? <a className="text-button site-header-signin" href="/api/auth/signout">Sign out</a> : !backHref ? <a className="text-button site-header-signin" href="/signin">Sign in</a> : null}
          <div className="site-header-theme"><ThemeToggle /></div>
          {primaryHref && primaryLabel ? <a className="button button-primary site-header-primary" href={primaryHref}>{primaryLabel}</a> : !backHref ? <a className="button button-primary site-header-primary" href="/alerts">Create alert</a> : null}
        </div>
      </nav>
      <style>{`
        @media (max-width: 640px) {
          .site-header.nav {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-areas:
              "brand primary"
              "theme theme";
            align-items: center;
            gap: 12px 14px;
            min-height: 0;
            padding-top: 12px;
            padding-bottom: 14px;
          }

          .site-header-brand { grid-area: brand; min-width: 0; }
          .site-header-brand .brand { max-width: 100%; }
          .site-header-brand .brand-wordmark { overflow: hidden; text-overflow: ellipsis; }

          .site-header-actions {
            display: contents;
          }

          .site-header-primary {
            grid-area: primary;
            padding: 11px 15px;
            font-size: 12px;
          }

          .site-header-theme {
            grid-area: theme;
            width: 100%;
          }

          .site-header-theme .theme-toggle {
            width: 100%;
            justify-content: center;
          }

          .site-header-theme .theme-option {
            flex: 1 1 0;
            min-width: 0;
            justify-content: center;
          }

          .site-header-signin,
          .site-header-back {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
