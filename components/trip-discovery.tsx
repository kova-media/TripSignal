'use client';

import { useEffect, useState } from 'react';

type DestinationMode = 'region' | 'airport';
type Airport = { iata_code: string; name: string; municipality?: string; iso_country?: string };

const regions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const cabinOptions = ['Economy', 'Premium economy', 'Business'];

function AirportSearch({
  label,
  value,
  code,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  code: string;
  onSelect: (airport: Airport) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === value.trim()) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/airports?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        setResults(Array.isArray(data.airports) ? data.airports : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => window.clearTimeout(timer);
  }, [query, value]);

  return (
    <div className="discovery-airport-search">
      <label htmlFor={`airport-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</label>
      <input
        id={`airport-${label.toLowerCase().replace(/\s+/g, '-')}`}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {code ? <small>{code} selected</small> : <small>Search by city or airport name</small>}
      {open && (loading || results.length > 0) && (
        <div className="discovery-airport-results" role="listbox">
          {loading && <div className="discovery-airport-result">Searching airports…</div>}
          {!loading && results.map((airport) => (
            <button
              type="button"
              className="discovery-airport-result"
              key={`${airport.iata_code}-${airport.name}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(airport);
                setQuery(`${airport.municipality || airport.name} (${airport.iata_code})`);
                setOpen(false);
              }}
            >
              <strong>{airport.municipality || airport.name}</strong>
              <span>{airport.iata_code} · {airport.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripDiscovery() {
  const [origin, setOrigin] = useState('MCI');
  const [originSearch, setOriginSearch] = useState('Kansas City (MCI)');
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('airport');
  const [region, setRegion] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [cabin, setCabin] = useState('Premium economy');
  const [budget, setBudget] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [specificDate, setSpecificDate] = useState('');

  function buildWatch() {
    if (destinationMode === 'airport' && !destinationAirport) return;

    const params = new URLSearchParams({
      ...(origin ? { origin } : {}),
      destinationMode,
      ...(destinationMode === 'region' ? { region } : { destinationAirport }),
      ...(budget ? { price: budget } : {}),
      passengers,
      cabin: cabin === 'Premium economy' ? 'premium_economy' : cabin.toLowerCase(),
      ...(specificDate ? { dateRange: 'Custom dates', dateStart: specificDate, dateEnd: specificDate } : {}),
    });

    window.location.href = `/alerts?${params.toString()}`;
  }

  return (
    <section className="discovery shell" id="explore">
      <div className="discovery-head">
        <div>
          <p className="section-kicker">Find a trip</p>
          <h2>Search for the trip.<br /><em>We’ll watch the fare.</em></h2>
        </div>
        <p>Tell TripSignal where you want to go and what matters. We’ll use those rules when you create the alert.</p>
      </div>

      <div className="discovery-form">
        <div className="discovery-controls">
          <AirportSearch
            label="From"
            value={originSearch}
            code={origin}
            onSelect={(airport) => {
              setOrigin(airport.iata_code);
              setOriginSearch(`${airport.municipality || airport.name} (${airport.iata_code})`);
            }}
            placeholder="Search city or airport"
          />

          <div className="discovery-field">
            <label>Where</label>
            <div className="discovery-options">
              <button type="button" className={destinationMode === 'region' ? 'active' : ''} onClick={() => setDestinationMode('region')}>Region</button>
              <button type="button" className={destinationMode === 'airport' ? 'active' : ''} onClick={() => setDestinationMode('airport')}>Specific airport</button>
            </div>
          </div>

          {destinationMode === 'region' ? (
            <div className="discovery-field">
              <label htmlFor="discovery-region">Region</label>
              <select id="discovery-region" value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          ) : (
            <AirportSearch
              label="Destination"
              value={destinationSearch}
              code={destinationAirport}
              onSelect={(airport) => {
                setDestinationAirport(airport.iata_code);
                setDestinationSearch(`${airport.municipality || airport.name} (${airport.iata_code})`);
              }}
              placeholder="Search a city or airport"
            />
          )}

          <div className="discovery-field">
            <label>Cabin</label>
            <div className="discovery-options discovery-cabin-options">
              {cabinOptions.map((item) => (
                <button type="button" key={item} className={cabin === item ? 'active' : ''} onClick={() => setCabin(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-passengers">Passengers</label>
            <select id="discovery-passengers" value={passengers} onChange={(event) => setPassengers(event.target.value)}>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} passenger{count === 1 ? '' : 's'}</option>)}
            </select>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-budget">Maximum fare <small>Optional</small></label>
            <div className="discovery-price"><span>$</span><input id="discovery-budget" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} placeholder="No limit" /></div>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-date">Departure date <small>Optional</small></label>
            <input id="discovery-date" type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>

          <button type="button" className="button button-primary discovery-cta" onClick={buildWatch} disabled={destinationMode === 'airport' && !destinationAirport}>
            Create alert
          </button>
        </div>
      </div>
    </section>
  );
}
