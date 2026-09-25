'use client';

import { FormEvent, useState } from 'react';
import Brand from '@/components/brand';
import SiteHeader from '@/components/site-header';

const REGIONS = [
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Middle East',
  'Oceania',
] as const;

const CABINS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
] as const;

type Offer = {
  id: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  stops: number;
  source: string;
};

type AnywhereResult = { destination: string; price: number; offer: Offer };

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AnywherePage() {
  const [origin, setOrigin] = useState('');
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [maxPrice, setMaxPrice] = useState('600');
  const [cabin, setCabin] = useState<string>('economy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<AnywhereResult[]>([]);
  const [meta, setMeta] = useState<{ origin: string; region: string; departureStart: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const response = await fetch('/api/anywhere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, region, maxPrice: Number(maxPrice), cabin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed. Try again.');
      setResults(Array.isArray(data.results) ? data.results : []);
      setMeta({ origin: data.origin, region: data.region, departureStart: data.departureStart });
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="anywhere-page">
      <SiteHeader />
      <section className="shell anywhere-shell">
        <p className="section-kicker">Anywhere fares</p>
        <h1>Where can your budget take you?</h1>
        <p className="anywhere-lede">
          Pick a home airport and a region. We scan round-trip fares to every major airport in that
          region — departing about a month out, trips of 7–14 days — and show the cheapest spots
          under your max price.
        </p>

        <form onSubmit={submit} className="anywhere-form">
          <label>
            <span>Home airport</span>
            <input
              value={origin}
              onChange={(event) => setOrigin(event.target.value.toUpperCase())}
              placeholder="MCI"
              maxLength={3}
              autoComplete="off"
              required
            />
          </label>
          <label>
            <span>Region</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              {REGIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Max price (USD)</span>
            <input
              type="number"
              min={1}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="600"
              required
            />
          </label>
          <label>
            <span>Cabin</span>
            <select value={cabin} onChange={(event) => setCabin(event.target.value)}>
              {CABINS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Scanning fares…' : 'Find destinations'}
          </button>
        </form>

        {error && <p className="anywhere-error">{error}</p>}
        {loading && <p className="anywhere-note">Scanning dozens of routes — this can take a minute.</p>}

        {searched && !loading && meta && (
          <div className="anywhere-results">
            <h2>
              {results.length
                ? `Cheapest destinations from ${meta.origin} across ${meta.region}`
                : `Nothing under budget from ${meta.origin}`}
            </h2>
            {results.length ? (
              <>
                <p className="anywhere-note">
                  Round trips departing around {formatDate(meta.departureStart)}, 7–14 day trips. Prices move — set a watch to get alerted.
                </p>
                <div className="anywhere-grid">
                  {results.map((result) => (
                    <article className="anywhere-card" key={result.destination}>
                      <div className="anywhere-card-top">
                        <strong>{result.destination}</strong>
                        <span className="anywhere-price">${Math.round(result.price).toLocaleString()}</span>
                      </div>
                      <small>
                        {formatDate(result.offer.departureDate)} → {formatDate(result.offer.returnDate)}
                        {' · '}{result.offer.stops === 0 ? 'Nonstop' : `${result.offer.stops} stop${result.offer.stops === 1 ? '' : 's'}`}
                      </small>
                      <a className="text-link" href="/alerts">Watch this fare</a>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="anywhere-note">No fares found under your max price. Try a higher budget or a different region.</p>
            )}
          </div>
        )}
      </section>

      <footer className="footer shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a>
        <span>© 2026 TripSignal</span>
      </footer>

      <style jsx global>{`
        .anywhere-page{min-height:100vh;display:flex;flex-direction:column}
        .anywhere-shell{flex:1;padding:56px 0 90px;max-width:1020px}
        .anywhere-shell h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(34px,5vw,54px);line-height:1.02;letter-spacing:-.05em;margin:10px 0 14px}
        .anywhere-lede{color:var(--muted);font-size:15px;line-height:1.7;max-width:640px;margin:0 0 30px}
        .anywhere-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;align-items:end;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px;margin-bottom:26px}
        .anywhere-form label{display:flex;flex-direction:column;gap:8px}
        .anywhere-form label>span{font-size:12px;font-weight:600}
        .anywhere-form input,.anywhere-form select{border:1px solid var(--line-strong);background:var(--bg);border-radius:11px;padding:13px 14px;color:var(--ink);outline:none;font-size:15px}
        .anywhere-form input:focus,.anywhere-form select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .anywhere-form button{padding:14px 18px;white-space:nowrap}
        .anywhere-error{color:#a24f4f;font-size:13px;margin:0 0 18px}
        .anywhere-note{color:var(--muted);font-size:13px;line-height:1.7;margin:0 0 18px}
        .anywhere-results h2{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,30px);letter-spacing:-.03em;margin:34px 0 10px}
        .anywhere-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:18px}
        .anywhere-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:8px}
        .anywhere-card-top{display:flex;align-items:baseline;justify-content:space-between}
        .anywhere-card-top strong{font-family:'Space Grotesk',sans-serif;font-size:26px;letter-spacing:-.02em}
        .anywhere-price{font-size:20px;font-weight:700;color:var(--accent,#2f7de1)}
        .anywhere-card small{color:var(--muted);font-size:12px}
        .anywhere-card .text-link{font-size:13px;font-weight:600;margin-top:4px}
        @media(max-width:560px){.anywhere-shell{padding:38px 0 64px}.anywhere-form{grid-template-columns:1fr 1fr}}
      `}</style>
    </main>
  );
}
