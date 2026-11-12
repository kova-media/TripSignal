import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import { getDeals, getDealOrigins, type Deal } from '@/lib/deals';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Flight fare drops this week',
  description: 'The biggest flight fare drops TripSignal spotted in the last 7 days — real fares from live checks, updated daily. Set a watch and get alerted when your route drops.',
};

function countryName(code: unknown) {
  const value = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return String(code ?? 'Not set');
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value;
}

function destinationLabel(deal: Deal) {
  if (deal.destinationMode === 'country') return countryName(deal.destination);
  return String(deal.destination).toUpperCase();
}

function cabinLabel(cabin: string | null) {
  if (!cabin) return 'Any cabin';
  return cabin.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tripLabel(tripType: string | null) {
  if (tripType === 'one-way') return 'One way';
  return 'Round trip';
}

function priceLabel(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

const CABINS = ['economy', 'premium_economy', 'business', 'first'];

export default async function DealsPage({ searchParams }: { searchParams?: Promise<{ origin?: string; cabin?: string }> }) {
  const params = (await searchParams) ?? {};
  const origin = /^[A-Za-z]{3}$/.test(params.origin ?? '') ? params.origin!.toUpperCase() : undefined;
  const cabin = CABINS.includes(params.cabin ?? '') ? params.cabin! : undefined;
  let deals: Deal[] = [];
  let origins: string[] = [];
  try {
    [deals, origins] = await Promise.all([getDeals({ origin, cabin }), getDealOrigins()]);
  } catch {
    deals = [];
    origins = [];
  }

  const dealsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Recent flight fare drops',
    description: 'Flight routes where TripSignal observed a fare drop in the last 7 days.',
    itemListElement: deals.map((deal, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${deal.origin} → ${destinationLabel(deal)} · ${cabinLabel(deal.cabin)} · ${tripLabel(deal.tripType)}`,
      description: `Fare dropped ${deal.dropPercent}% to ${priceLabel(deal.latestPrice)} (was ${priceLabel(deal.previousPrice)}).`,
    })),
  };

  return (
    <main className="legal-page">
      <SiteHeader />
      <article className="legal-content shell">
        <header className="legal-heading">
          <p className="section-kicker">TripSignal</p>
          <h1>Recent fare drops</h1>
          <p>Routes where TripSignal spotted fares falling in the last 7 days. Real observations from live fare checks — no made-up deals.</p>
        </header>
        <div className="legal-body">
          <form className="deal-filters" method="get" action="/deals">
            <label>From
              <select name="origin" defaultValue={origin ?? ''}>
                <option value="">Any origin</option>
                {origins.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <label>Cabin
              <select name="cabin" defaultValue={cabin ?? ''}>
                <option value="">Any cabin</option>
                {CABINS.map((code) => <option key={code} value={code}>{cabinLabel(code)}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="submit">Filter</button>
            {origin || cabin ? <a className="text-link" href="/deals">Clear</a> : null}
          </form>
          {deals.length ? (
            <div className="deal-list">
              {deals.map((deal) => (
                <article className="deal-card" key={`${deal.origin}-${deal.destination}-${deal.cabin}-${deal.tripType}`}>
                  <div className="deal-route">
                    <strong>{deal.origin} → {destinationLabel(deal)}</strong>
                    <small>{cabinLabel(deal.cabin)} · {tripLabel(deal.tripType)} · spotted {new Date(deal.observedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                  </div>
                  <div className="deal-drop">
                    <strong>−{deal.dropPercent}%</strong>
                    <small>{priceLabel(deal.latestPrice)} <s>{priceLabel(deal.previousPrice)}</s></small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No fresh deals right now — check back soon.</p>
          )}
          <p style={{ marginTop: 48 }}>
            Want alerts like these for your own routes? <a href="/alerts">Create a watch</a> and we&rsquo;ll email you when a fare drops.
          </p>
        </div>
      </article>
      <footer className="legal-footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <div className="legal-footer-links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>
      </footer>
      <style dangerouslySetInnerHTML={{ __html: `
        .deal-list{display:flex;flex-direction:column;gap:14px;margin-top:8px}
        .deal-filters{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:22px}
        .deal-filters label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:600;color:var(--muted)}
        .deal-filters select{border:1px solid var(--line-strong);background:var(--surface);border-radius:10px;padding:11px 12px;color:var(--ink);font:inherit;outline:none}
        .deal-filters select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .deal-filters .text-link{align-self:center;padding-bottom:2px}
        .deal-card{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 22px}
        .deal-route strong{font-size:18px;letter-spacing:-.02em}
        .deal-route small{display:block;color:var(--muted);font-size:13px;margin-top:5px}
        .deal-drop{text-align:right;flex:none}
        .deal-drop strong{color:#2e7d4f;font-size:24px;letter-spacing:-.02em}
        .deal-drop small{display:block;color:var(--muted);font-size:13px;margin-top:5px}
        .deal-drop s{color:var(--quiet)}
        @media(max-width:560px){.deal-card{flex-direction:column;align-items:flex-start}.deal-drop{text-align:left}}
      ` }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealsJsonLd) }} />
    </main>
  );
}
