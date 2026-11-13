import Brand from '@/components/brand';

type SiteHeaderProps = { backHref?: string; backLabel?: string; primaryHref?: string; primaryLabel?: string; authenticated?: boolean };

export default function SiteHeader({ backHref, backLabel, primaryHref, primaryLabel, authenticated = false }: SiteHeaderProps) {
  return <nav className="nav shell site-header"><a className="brand-link site-header-brand" href="/" aria-label="TripSignal home"><Brand /></a><div className="nav-actions site-header-actions">{backHref && backLabel ? <a className="text-link site-header-back" href={backHref}>{backLabel}</a> : null}{authenticated ? <a className="text-link site-header-account" href="/profile">Profile</a> : null}{authenticated ? <form method="post" action="/api/auth/signout" style={{ display: 'contents' }}><button className="text-button site-header-signin" type="submit">Sign out</button></form> : <a className="text-button site-header-signin" href="/signin">Sign in</a>}{primaryHref && primaryLabel && primaryLabel !== 'Profile' ? <a className="button button-primary site-header-primary" href={primaryHref}>{primaryLabel}</a> : !backHref && !authenticated ? <a className="button button-primary site-header-primary" href="/alerts">Create alert</a> : null}</div></nav>;
}
