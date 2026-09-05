'use client';

import { FormEvent, useMemo, useState } from 'react';
import SiteHeader from '@/components/site-header';
import type { FlightOffer } from '@/lib/flights/types';

type DestinationMode = 'region' | 'airport';
type Frequency = 'Weekly' | 'Monthly';
type Cabin = 'economy' | 'premium_economy' | 'business';

type AirlineOption = { code: string; name: string };

const regions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const airlines: AirlineOption[] = [
  { code: 'DL', name: 'Delta Air Lines' }, { code: 'AF', name: 'Air France' }, { code: 'KL', name: 'KLM' },
  { code: 'VS', name: 'Virgin Atlantic' }, { code: 'KE', name: 'Korean Air' }, { code: 'AM', name: 'Aeromexico' },
  { code: 'AZ', name: 'ITA Airways' }, { code: 'LH', name: 'Lufthansa' }, { code: 'UA', name: 'United Airlines' },
  { code: 'AA', name: 'American Airlines' }, { code: 'IB', name: 'Iberia' }, { code: 'TP', name: 'TAP Air Portugal' },
  { code: 'SK', name: 'SAS' }, { code: 'AY', name: 'Finnair' }, { code: 'TK', name: 'Turkish Airlines' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function airlineLabel(offer: FlightOffer) {
  const codes = Array.from(new Set(offer.segments.map((segment) => segment.marketingCarrier).filter(Boolean)));
  return codes.join(' / ') || 'Airline';
}

export default function AlertBuilder() {
  const [origin, setOrigin] = useState('MCI');
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('region');
  const [region, setRegion] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('AMS');
  const [price, setPrice] = useState('2000');
  const [airlineMode, setAirlineMode] = useState('all');
  const [stops, setStops] = useState('1');
  const [tripLength, setTripLength] = useState('1–3 weeks');
  const [dateRange, setDateRange] = useState('Next 12 months');
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [cabin, setCabin] = useState<Cabin>('premium_economy');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [offers, setOffers] = useState<FlightOffer[]>([]);

  const destinationLabel = destinationMode === 'region' ? region : destinationAirport || 'Airport';
  const selectedAirline = airlines.find((airline) => airline.code === airlineMode);
  const airlineLabelText = selectedAirline?.name ?? 'All airlines';
  const cabinLabel = cabin === 'premium_economy' ? 'Premium economy' : cabin === 'business' ? 'Business' : 'Economy';

  const summary = useMemo(
    () => `${origin || 'MCI'} → ${destinationLabel} · ${cabinLabel} · under $${Number(price || 0).toLocaleString()} · ${frequency}`,
    [origin, destinationLabel, cabinLabel, price, frequency],
  );

  function isValidEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail()) {
      setSearchError('Enter a valid email address so we can send your signals.');
      return;
    }

    setSaved(false); setSearching(true); setSearchError(''); setOffers([]);
    const alert = {
      origin,
      destinationMode,
      destination: destinationMode === 'region' ? region : destinationAirport,
      maxPrice: Number(price),
      airlineMode,
      maxStops: stops,
      tripLength,
      dateRange,
      frequency,
      cabin,
      email: email.trim(),
    };

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create your alert.');
      setOffers(data.offers ?? []);
      setSaved(true);
      if (data.warning) setSearchError(data.warning);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not create your alert.');
    } finally { setSearching(false); }
  }

  return (
    <main className="builder-page">
      <SiteHeader backHref="/" backLabel="Back to home" />

      <section className="builder shell">
        <div className="builder-intro">
          <h1>Define the trip.<br /><em>We’ll watch the fare.</em></h1>
          <p>Set the rules once. TripSignal will keep checking and email you when a qualifying fare appears.</p>
        </div>

        <form className="builder-grid" onSubmit={submit}>
          <div className="builder-form">
            <section className="form-section">
              <div className="form-heading"><div><h2>Where are you going?</h2><p>Choose a broad region or enter an exact airport.</p></div></div>
              <label><span>Origin airport</span><input value={origin} onChange={(event) => setOrigin(event.target.value.toUpperCase())} placeholder="MCI" maxLength={3} required /><small>Use a three-letter airport code.</small></label>
              <fieldset><legend>Destination</legend><div className="select-row"><button type="button" className={destinationMode === 'region' ? 'option active' : 'option'} onClick={() => setDestinationMode('region')}>General location</button><button type="button" className={destinationMode === 'airport' ? 'option active' : 'option'} onClick={() => setDestinationMode('airport')}>Specific airport</button></div>
                {destinationMode === 'region' ? <label className="nested-field"><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select><small>TripSignal searches a defined set of airports within the selected region.</small></label> : <label className="nested-field"><span>Airport code</span><input value={destinationAirport} onChange={(event) => setDestinationAirport(event.target.value.toUpperCase())} placeholder="AMS" maxLength={3} required /><small>Enter the exact three-letter airport you want to monitor.</small></label>}
              </fieldset>
            </section>

            <section className="form-section">
              <div className="form-heading"><div><h2>What does a good fare look like?</h2><p>Set your cabin, price, airline, and stop limit.</p></div></div>
              <label><span>Maximum round-trip price</span><div className="input-prefix"><b>$</b><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ''))} required /></div><small>Only fares below this amount will qualify.</small></label>
              <fieldset><legend>Cabin</legend><div className="select-row"><button type="button" className={cabin === 'economy' ? 'option active' : 'option'} onClick={() => setCabin('economy')}>Economy</button><button type="button" className={cabin === 'premium_economy' ? 'option active' : 'option'} onClick={() => setCabin('premium_economy')}>Premium economy</button><button type="button" className={cabin === 'business' ? 'option active' : 'option'} onClick={() => setCabin('business')}>Business</button></div></fieldset>
              <fieldset><legend>Airline</legend><label className="nested-field"><span>Choose one</span><select value={airlineMode} onChange={(event) => setAirlineMode(event.target.value)}><option value="all">All airlines</option>{airlines.map((airline) => <option key={airline.code} value={airline.code}>{airline.name}</option>)}</select><small>Search every airline, or restrict the alert to one carrier.</small></label></fieldset>
              <div className="two-col"><label><span>Maximum stops</span><select value={stops} onChange={(event) => setStops(event.target.value)}><option value="0">Nonstop</option><option value="1">1 stop</option><option value="2">2 stops</option><option value="any">Any</option></select></label><label><span>Trip length</span><select value={tripLength} onChange={(event) => setTripLength(event.target.value)}><option>3–7 days</option><option>1–2 weeks</option><option>1–3 weeks</option><option>1–4 weeks</option></select></label></div>
            </section>

            <section className="form-section">
              <div className="form-heading"><div><h2>When should we look?</h2><p>Choose the travel window and monitoring rhythm.</p></div></div>
              <div className="two-col"><label><span>Travel window</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Anytime</option><option>Next 3 months</option><option>Next 6 months</option><option>Next 12 months</option></select></label><label><span>Search frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}><option>Weekly</option><option>Monthly</option></select></label></div>
            </section>

            <section className="form-section contact-section">
              <div className="form-heading"><div><h2>Where should we send the signal?</h2><p>Enter the email address that should receive your fare alerts.</p></div></div>
              <label><span>Email address</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setSearchError(''); }} placeholder="you@example.com" autoComplete="email" required /><small>We’ll use this to send your TripSignal alerts.</small></label>
            </section>

            <button className="button button-primary builder-submit" type="submit" disabled={searching}>{searching ? 'Creating alert & searching…' : 'Create alert & run search'} <span>↗</span></button>
            {searchError && <div className="saved-state"><strong>{saved ? 'Alert created' : 'Action needed'}</strong><span>{searchError}</span></div>}
            {saved && !searchError && <div className="saved-state"><strong>Alert active</strong><span>We’ll email qualifying signals to {email.trim()}.</span></div>}
            {offers.length > 0 && <section className="signals live-results"><h2>Qualifying fares.</h2><div className="signal-list">{offers.map((offer) => <div className="signal-item" key={offer.id}><div><strong>{offer.origin} → {offer.destination}</strong><span>{formatDate(offer.departureDate)} – {formatDate(offer.returnDate)} · {airlineLabel(offer)} · {offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</span></div><div className="signal-price"><strong>${offer.price.toLocaleString()}</strong><small>Below target</small></div></div>)}</div></section>}
          </div>

          <aside className="builder-summary">
            <div className="summary-label"><span>Your alert</span><i>{searching ? 'Searching' : 'Live'}</i></div>
            <h2>{summary}</h2>
            <div className="summary-list"><div><span>From</span><strong>{origin || 'MCI'}</strong></div><div><span>To</span><strong>{destinationLabel}</strong></div><div><span>Price</span><strong>Under ${Number(price || 0).toLocaleString()}</strong></div><div><span>Cabin</span><strong>{cabinLabel}</strong></div><div><span>Airline</span><strong>{airlineLabelText}</strong></div><div><span>Stops</span><strong>{stops === 'any' ? 'Any' : stops === '0' ? 'Nonstop' : `${stops} stop`}</strong></div><div><span>Trip</span><strong>{tripLength}</strong></div><div><span>Window</span><strong>{dateRange}</strong></div><div><span>Frequency</span><strong>{frequency}</strong></div><div><span>Signal</span><strong>{email || 'Not set'}</strong></div></div>
            <div className="summary-note"><span className="summary-check">✓</span><p>Alerts are stored securely and checked on schedule.</p></div>
          </aside>
        </form>
      </section>
    </main>
  );
}
