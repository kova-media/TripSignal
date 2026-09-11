'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import type { FlightOffer } from '@/lib/flights/types';
import styles from './alert-builder.module.css';

type DestinationMode = 'region' | 'airport';
type Frequency = 'Daily' | 'Weekly' | 'Monthly';
type Cabin = 'economy' | 'premium_economy' | 'business' | 'first';
type AirlineOption = { code: string; name: string };
type Airport = { iata_code: string; name: string; municipality?: string; iso_country?: string };

const regions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const airlines: AirlineOption[] = [
  { code: 'DL', name: 'Delta Air Lines' }, { code: 'AF', name: 'Air France' }, { code: 'KL', name: 'KLM' },
  { code: 'VS', name: 'Virgin Atlantic' }, { code: 'KE', name: 'Korean Air' }, { code: 'AM', name: 'Aeromexico' },
  { code: 'AZ', name: 'ITA Airways' }, { code: 'LH', name: 'Lufthansa' }, { code: 'UA', name: 'United Airlines' },
  { code: 'AA', name: 'American Airlines' }, { code: 'IB', name: 'Iberia' }, { code: 'TP', name: 'TAP Air Portugal' },
  { code: 'SK', name: 'SAS' }, { code: 'AY', name: 'Finnair' }, { code: 'TK', name: 'Turkish Airlines' },
];

function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
function datePlusDays(days: number) { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
function airlineLabel(offer: FlightOffer) { const codes = Array.from(new Set(offer.segments.map((segment) => segment.marketingCarrier).filter(Boolean))); return codes.join(' / ') || 'Airline'; }

function AirportSearch({ label, value, code, onSelect, required = true }: { label: string; value: string; code: string; onSelect: (airport: Airport) => void; required?: boolean }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === value.trim()) { setResults([]); return; }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/airports?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        setResults(Array.isArray(data.airports) ? data.airports : []);
        setOpen(true);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, value]);
  return <div className="airport-search">
    <span>{label}</span>
    <input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => { if (query.trim().length >= 2) setOpen(true); }} placeholder="Search city or airport" autoComplete="off" required={required && !code} />
    <small>{code ? `${code} selected` : 'Type a city or airport name'}</small>
    {open && (loading || results.length > 0) && <div className="airport-results" role="listbox">
      {loading && <div className="airport-result">Searching airports…</div>}
      {!loading && results.map((airport) => <button type="button" className="airport-result" key={`${airport.iata_code}-${airport.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(airport); setQuery(`${airport.municipality || airport.name} (${airport.iata_code})`); setOpen(false); }}>
        <strong>{airport.municipality || airport.name}</strong><span>{airport.iata_code} · {airport.name}</span>
      </button>)}
    </div>}
  </div>;
}

export default function AlertBuilder({ accountEmail }: { accountEmail: string | null }) {
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('airport');
  const [region, setRegion] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [price, setPrice] = useState('2000');
  const [airlineMode, setAirlineMode] = useState('all');
  const [stops, setStops] = useState('1');
  const [tripLength, setTripLength] = useState('1–3 weeks');
  const [dateRange, setDateRange] = useState('Next 12 months');
  const [customStart, setCustomStart] = useState(datePlusDays(30));
  const [customEnd, setCustomEnd] = useState(datePlusDays(90));
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [cabin, setCabin] = useState<Cabin>('premium_economy');
  const [passengers, setPassengers] = useState('1');
  const [email, setEmail] = useState(accountEmail ?? '');
  const [saved, setSaved] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [offers, setOffers] = useState<FlightOffer[]>([]);

  useEffect(() => {
    const nextOrigin = searchParams.get('origin');
    const nextOriginName = searchParams.get('originName');
    const nextDestinationMode = searchParams.get('destinationMode');
    const nextDestination = searchParams.get('destinationAirport');
    const nextDestinationName = searchParams.get('destinationName');
    const nextRegion = searchParams.get('region');
    const nextPrice = searchParams.get('price');
    const nextPassengers = searchParams.get('passengers');
    const nextCabin = searchParams.get('cabin') as Cabin | null;
    const nextAirline = searchParams.get('airlineMode');
    const nextStops = searchParams.get('maxStops');
    const nextTripLength = searchParams.get('tripLength');
    const nextDateRange = searchParams.get('dateRange');
    const nextDateStart = searchParams.get('dateStart');
    const nextDateEnd = searchParams.get('dateEnd');
    const nextFrequency = searchParams.get('frequency') as Frequency | null;
    const nextEmail = searchParams.get('email');

    if (nextOrigin) { setOrigin(nextOrigin); setOriginSearch(nextOriginName || nextOrigin); }
    if (nextDestinationMode === 'region' || nextDestinationMode === 'airport') setDestinationMode(nextDestinationMode);
    if (nextRegion) setRegion(nextRegion);
    if (nextDestination) { setDestinationAirport(nextDestination); setDestinationSearch(nextDestinationName || nextDestination); }
    if (nextPrice) setPrice(nextPrice);
    if (nextPassengers) setPassengers(nextPassengers);
    if (nextCabin && ['economy', 'premium_economy', 'business', 'first'].includes(nextCabin)) setCabin(nextCabin);
    if (nextAirline) setAirlineMode(nextAirline);
    if (nextStops) setStops(nextStops);
    if (nextTripLength) setTripLength(nextTripLength);
    if (nextDateRange) setDateRange(nextDateRange);
    if (nextDateStart) setCustomStart(nextDateStart);
    if (nextDateEnd) setCustomEnd(nextDateEnd);
    if (nextFrequency === 'Daily' || nextFrequency === 'Weekly' || nextFrequency === 'Monthly') setFrequency(nextFrequency);
    if (accountEmail) setEmail(accountEmail);
    else if (nextEmail) setEmail(nextEmail);
  }, [searchParams, accountEmail]);

  const destinationLabel = destinationMode === 'region' ? region : destinationAirport || 'Not set';
  const selectedAirline = airlines.find((airline) => airline.code === airlineMode);
  const airlineLabelText = selectedAirline?.name ?? 'All airlines';
  const cabinLabel = cabin === 'premium_economy' ? 'Premium economy' : cabin === 'business' ? 'Business' : cabin === 'first' ? 'First class' : 'Economy';
  const customRangeLabel = customStart && customEnd ? `${formatDate(customStart)} – ${formatDate(customEnd)}` : 'Custom dates';
  const displayDateRange = dateRange === 'Custom dates' ? customRangeLabel : dateRange;
  const summary = useMemo(() => `${origin || 'Not set'} → ${destinationLabel} · ${cabinLabel} · under $${Number(price || 0).toLocaleString()} · ${frequency}`, [origin, destinationLabel, cabinLabel, price, frequency]);

  function isValidEmail() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!origin) { setSearchError('Select a departure airport from the city search.'); return; }
    if (destinationMode === 'airport' && !destinationAirport) { setSearchError('Select an arrival airport from the city search.'); return; }
    if (!isValidEmail()) { setSearchError('Enter a valid email address so we can send your signals.'); return; }
    if (dateRange === 'Custom dates' && customEnd < customStart) { setSearchError('The end date must be on or after the start date.'); return; }
    setSaved(false); setSearching(true); setSearchError(''); setOffers([]);
    const alert = { origin, destinationMode, destination: destinationMode === 'region' ? region : destinationAirport, maxPrice: Number(price), airlineMode, maxStops: stops, tripLength, dateRange, dateStart: dateRange === 'Custom dates' ? customStart : undefined, dateEnd: dateRange === 'Custom dates' ? customEnd : undefined, frequency, cabin, passengers: Number(passengers), ...(accountEmail ? {} : { email: email.trim() }) };
    try {
      const response = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alert) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create your alert.');
      setOffers(data.offers ?? []); setSaved(true); if (data.warning) setSearchError(data.warning);
    } catch (error) { setSearchError(error instanceof Error ? error.message : 'Could not create your alert.'); } finally { setSearching(false); }
  }

  return <main className="builder-page">
    <SiteHeader backHref="/" backLabel="Back to home" />
    <section className="builder shell">
      <div className="builder-intro"><h1>Define the trip.<br /><em>We’ll watch the fare.</em></h1><p>Set the rules once. TripSignal will keep checking and email you when a qualifying fare appears.</p></div>
      <form className="builder-grid" onSubmit={submit}>
        <div className="builder-form">
          <section className="form-section"><div className="form-heading"><div><h2>Where are you going?</h2><p>Search by city or airport. If a city has multiple airports, choose the one you want.</p></div></div><AirportSearch label="Origin airport" value={originSearch} code={origin} onSelect={(airport) => { setOrigin(airport.iata_code); setOriginSearch(`${airport.municipality || airport.name} (${airport.iata_code})`); }} /><fieldset><legend>Destination</legend><div className="select-row"><button type="button" className={destinationMode === 'region' ? 'option active' : 'option'} onClick={() => setDestinationMode('region')}>General location</button><button type="button" className={destinationMode === 'airport' ? 'option active' : 'option'} onClick={() => setDestinationMode('airport')}>Specific airport</button></div>{destinationMode === 'region' ? <label className="nested-field"><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select><small>TripSignal searches a defined set of airports within the selected region.</small></label> : <div className="nested-field"><AirportSearch label="Arrival airport" value={destinationSearch} code={destinationAirport} onSelect={(airport) => { setDestinationAirport(airport.iata_code); setDestinationSearch(`${airport.municipality || airport.name} (${airport.iata_code})`); }} /><small>Search the city, then select the exact airport to monitor.</small></div>}</fieldset></section>
          <section className="form-section"><div className="form-heading"><div><h2>What does a good fare look like?</h2><p>Set your cabin, price, airline, and stop limit.</p></div></div><label><span>Maximum round-trip price</span><div className="input-prefix"><b>$</b><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ''))} required /></div><small>Only fares below this amount will qualify.</small></label><fieldset><legend>Cabin</legend><div className="select-row"><button type="button" className={cabin === 'economy' ? 'option active' : 'option'} onClick={() => setCabin('economy')}>Economy</button><button type="button" className={cabin === 'premium_economy' ? 'option active' : 'option'} onClick={() => setCabin('premium_economy')}>Premium economy</button><button type="button" className={cabin === 'business' ? 'option active' : 'option'} onClick={() => setCabin('business')}>Business</button><button type="button" className={cabin === 'first' ? 'option active' : 'option'} onClick={() => setCabin('first')}>First class</button></div></fieldset><fieldset><legend>Airline</legend><label className="nested-field"><span>Choose one</span><select value={airlineMode} onChange={(event) => setAirlineMode(event.target.value)}><option value="all">All airlines</option>{airlines.map((airline) => <option key={airline.code} value={airline.code}>{airline.name}</option>)}</select><small>Search every airline, or restrict the alert to one carrier.</small></label></fieldset><div className="two-col"><label><span>Maximum stops</span><select value={stops} onChange={(event) => setStops(event.target.value)}><option value="0">Nonstop</option><option value="1">1 stop</option><option value="2">2 stops</option><option value="any">Any</option></select></label><label><span>Trip length</span><select value={tripLength} onChange={(event) => setTripLength(event.target.value)}><option>3–7 days</option><option>1–2 weeks</option><option>1–3 weeks</option><option>1–4 weeks</option></select></label></div></section>
          <section className="form-section"><div className="form-heading"><div><h2>When should we look?</h2><p>Choose the travel window and monitoring rhythm.</p></div></div><div className="two-col"><label><span>Travel window</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Anytime</option><option>Next 3 months</option><option>Next 6 months</option><option>Next 12 months</option><option>Custom dates</option></select></label><label><span>Search frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label></div>{dateRange === 'Custom dates' && <div className="two-col custom-date-fields"><label><span>Start date</span><input type="date" value={customStart} min={datePlusDays(0)} onChange={(event) => setCustomStart(event.target.value)} required /></label><label><span>End date</span><input type="date" value={customEnd} min={customStart || datePlusDays(0)} onChange={(event) => setCustomEnd(event.target.value)} required /></label></div>}{dateRange === 'Custom dates' && <small className="date-range-help">We’ll look for departures within this window.</small>}<label className="nested-field"><span>Passengers</span><select value={passengers} onChange={(event) => setPassengers(event.target.value)}>{Array.from({ length: 9 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} passenger{count === 1 ? '' : 's'}</option>)}</select></label></section>
          {accountEmail ? <section className="form-section contact-section"><div className="form-heading"><div><h2>Where should we send the signal?</h2><p>Your signed-in account will receive this alert.</p></div></div><label><span>Account email</span><input type="email" value={accountEmail} readOnly /><small>This alert will be created for your signed-in account.</small></label></section> : <section className="form-section contact-section"><div className="form-heading"><div><h2>Where should we send the signal?</h2><p>Enter the email address that should receive your fare alerts.</p></div></div><label><span>Email address</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setSearchError(''); }} placeholder="you@example.com" autoComplete="email" required /><small>We’ll use this to send your TripSignal alerts.</small></label></section>}
          <button className="button button-primary builder-submit" type="submit" disabled={searching}>{searching ? 'Creating alert & searching…' : 'Create alert & run search'} <span>↗</span></button>
          {searchError && <div className="saved-state"><strong>{saved ? 'Alert created' : 'Action needed'}</strong><span>{searchError}</span></div>}
          {saved && !searchError && <div className="saved-state"><strong>Alert active</strong><span>We’ll email qualifying signals to {email.trim()}.</span></div>}
          {offers.length > 0 && <section className="signals live-results"><h2>Qualifying fares.</h2><div className="signal-list">{offers.map((offer) => <div className="signal-item" key={offer.id}><div><strong>{offer.origin} → {offer.destination}</strong><span>{formatDate(offer.departureDate)} – {formatDate(offer.returnDate)} · {airlineLabel(offer)} · {offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</span></div><div className="signal-price"><strong>${offer.price.toLocaleString()}</strong><small>Below target</small></div></div>)}</div></section>}
        </div>
        <aside className={`builder-summary ${styles.mobileSummary}`}><div className="summary-label"><span>Your alert</span><i>{searching ? 'Searching' : 'Live'}</i></div><h2>{summary}</h2><div className="summary-list"><div><span>From</span><strong>{origin || 'Not set'}</strong></div><div><span>To</span><strong>{destinationLabel}</strong></div><div><span>Price</span><strong>Under ${Number(price || 0).toLocaleString()}</strong></div><div><span>Cabin</span><strong>{cabinLabel}</strong></div><div><span>Airline</span><strong>{airlineLabelText}</strong></div><div><span>Stops</span><strong>{stops === 'any' ? 'Any' : `${stops} max`}</strong></div><div><span>Trip length</span><strong>{tripLength}</strong></div><div><span>Travel window</span><strong>{displayDateRange}</strong></div><div><span>Passengers</span><strong>{passengers}</strong></div><div><span>Frequency</span><strong>{frequency}</strong></div></div></aside>
      </form>
    </section>
  </main>;
}
