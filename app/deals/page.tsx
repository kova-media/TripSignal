import type { Metadata } from 'next';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';
import { getDeals, type Deal } from '@/lib/deals';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Flight deals',
  description: 'Recent flight fare drops spotted by TripSignal fare monitoring. See which routes got cheaper this week.',
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

export default async function DealsPage() {
  let deals: Deal[] = [];
  try {
    deals = await getDeals();
  } catch {
    deals = [];
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
