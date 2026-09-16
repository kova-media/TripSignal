'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type Mode = 'airport' | 'country';
export type Airport = { iata_code: string; name: string; municipality?: string; iso_country?: string; latitude?: number; longitude?: number };
export type Country = { code: string; name: string };
export type DestinationSelection =
  | { mode: 'airport'; airport: Airport }
  | { mode: 'country'; country: Country };

type DestinationChooserProps = {
  onModeChange?: (mode: Mode) => void;
};

export default function DestinationChooser({ onModeChange }: DestinationChooserProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [mode, setMode] = useState<Mode>('airport');
  const [airportQuery, setAirportQuery] = useState('');
  const [airport, setAirport] = useState<Airport | null>(null);
  const [airportResults, setAirportResults] = useState<Airport[]>([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [countryResults, setCountryResults] = useState<Country[]>([]);
  const [open, setOpen] = useState(false);
  const airportRequestId = useRef(0);
  const countryRequestId = useRef(0);

  useEffect(() => {
    const fields = Array.from(document.querySelectorAll<HTMLElement>('.discovery-field'));
    const where = fields.find((field) => field.querySelector('label')?.textContent?.trim() === 'Where');
    if (!where) return;

    const originalElements = Array.from(where.querySelectorAll<HTMLElement>('.discovery-options, .discovery-airport-search'));
    originalElements.forEach((element) => element.style.setProperty('display', 'none', 'important'));
    where.classList.add('destination-portal-host');
    setHost(where);

    return () => {
      originalElements.forEach((element) => element.style.removeProperty('display'));
      where.classList.remove('destination-portal-host', 'country-destination-selected');
    };
  }, []);

  useEffect(() => {
    onModeChange?.(mode);
    host?.classList.toggle('country-destination-selected', mode === 'country');
  }, [mode, onModeChange, host]);

  useEffect(() => {
    const query = airportQuery.trim();
    const id = ++airportRequestId.current;
    if (mode !== 'airport' || query.length < 2 || airport?.municipality === query) {
      setAirportResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/airports?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (airportRequestId.current !== id) return;
        setAirportResults(Array.isArray(data.airports) ? data.airports : []);
      } catch {
        if (!controller.signal.aborted && airportRequestId.current === id) setAirportResults([]);
      }
    }, 140);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [airportQuery, airport, mode]);

  useEffect(() => {
    const query = countryQuery.trim();
    const id = ++countryRequestId.current;
    if (mode !== 'country' || query.length < 2 || country?.name === query) {
      setCountryResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/countries?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (countryRequestId.current !== id) return;
        setCountryResults(Array.isArray(data.countries) ? data.countries : []);
      } catch {
        if (!controller.signal.aborted && countryRequestId.current === id) setCountryResults([]);
      }
    }, 140);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [countryQuery, country, mode]);

  if (!host) return null;

  const portal = (
    <div className="destination-chooser-root">
      <div className="discovery-options">
        <button type="button" className={mode === 'airport' ? 'active' : ''} onClick={() => { setMode('airport'); setOpen(false); }}>Specific airport</button>
        <button type="button" className={mode === 'country' ? 'active' : ''} onClick={() => { setMode('country'); setOpen(false); }}>Country</button>
      </div>

      {mode === 'airport' ? (
        <div className="discovery-airport-search destination-chooser-search">
          <label htmlFor="airport-destination">Destination</label>
          <input id="airport-destination" value={airportQuery} onChange={(event) => { setAirportQuery(event.target.value); setAirport(null); setOpen(true); }} onFocus={() => { if (airportQuery.trim().length >= 2) setOpen(true); }} placeholder="Search city or airport" autoComplete="off" aria-autocomplete="list" aria-expanded={open} />
          <small>{airport ? `${airport.iata_code} selected` : 'Search by city or airport name'}</small>
          {open && airportResults.length > 0 && <div className="discovery-airport-results" role="listbox">
            {airportResults.map((result) => <button type="button" className="discovery-airport-result" key={`${result.iata_code}-${result.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => {
              setAirport(result);
              setAirportQuery(`${result.municipality || result.name} (${result.iata_code})`);
              setOpen(false);
              window.dispatchEvent(new CustomEvent<DestinationSelection>('tripsignal:destination-change', { detail: { mode: 'airport', airport: result } }));
            }}>
              <strong>{result.municipality || result.name}</strong><span>{result.iata_code} · {result.name}</span>
            </button>)}
          </div>}
        </div>
      ) : (
        <div className="discovery-airport-search destination-chooser-search">
          <label htmlFor="discovery-country">Destination country</label>
          <input id="discovery-country" value={countryQuery} onChange={(event) => { setCountryQuery(event.target.value); setCountry(null); setOpen(true); }} onFocus={() => { if (countryQuery.trim().length >= 2) setOpen(true); }} placeholder="Search for a country" autoComplete="off" aria-autocomplete="list" aria-expanded={open} />
          <input id="discovery-country-code" type="hidden" value={country?.code ?? ''} readOnly />
          <small>{country ? `${country.code} selected · all major airports` : 'Flights into airports across the country'}</small>
          {open && countryResults.length > 0 && <div className="discovery-airport-results" role="listbox">
            {countryResults.map((result) => <button type="button" className="discovery-airport-result" key={result.code} onMouseDown={(event) => event.preventDefault()} onClick={() => {
              setCountry(result);
              setCountryQuery(result.name);
              setOpen(false);
            }}>
              <strong>{result.name}</strong><span>{result.code} · Search across the country</span>
            </button>)}
          </div>}
        </div>
      )}
    </div>
  );

  return createPortal(portal, host);
}
