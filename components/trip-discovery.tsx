'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoGraticule, geoInterpolate, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import TripExtras from '@/components/trip-extras';
import type { AffiliateContext } from '@/lib/affiliates';

type DestinationMode = 'region' | 'airport';
type Airport = { iata_code: string; name: string; municipality?: string; iso_country?: string; latitude?: number; longitude?: number };
type Coordinate = [number, number];
type Frequency = 'Daily' | 'Weekly' | 'Monthly';
type DestinationSelection =
  | { mode: 'airport'; airport: Airport }
  | { mode: 'country'; country: { code: string; name: string } };

const regions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const cabinOptions = ['Economy', 'Premium economy', 'Business', 'First class'];
const airlines = [
  { code: 'all', name: 'All airlines' }, { code: 'DL', name: 'Delta Air Lines' }, { code: 'AF', name: 'Air France' }, { code: 'KL', name: 'KLM' },
  { code: 'VS', name: 'Virgin Atlantic' }, { code: 'KE', name: 'Korean Air' }, { code: 'AM', name: 'Aeromexico' }, { code: 'AZ', name: 'ITA Airways' },
  { code: 'LH', name: 'Lufthansa' }, { code: 'UA', name: 'United Airlines' }, { code: 'AA', name: 'American Airlines' }, { code: 'IB', name: 'Iberia' },
  { code: 'TP', name: 'TAP Air Portugal' }, { code: 'SK', name: 'SAS' }, { code: 'AY', name: 'Finnair' }, { code: 'TK', name: 'Turkish Airlines' },
];

const cabinMax: Record<string, number> = { Economy: 1500, 'Premium economy': 2500, Business: 4000, 'First class': 6000 };

const airportCoordinates: Record<string, Coordinate> = {
  MCI: [-94.7139, 39.2976], ATL: [-84.4277, 33.6407], BOS: [-71.0096, 42.3656], BWI: [-76.6684, 39.1754], CLT: [-80.9431, 35.214],
  DCA: [-77.0402, 38.8512], DEN: [-104.6737, 39.8561], DFW: [-97.0403, 32.8998], DTW: [-83.3534, 42.2162], EWR: [-74.1687, 40.6895],
  FLL: [-80.1527, 26.0726], IAH: [-95.3414, 29.9902], JFK: [-73.7781, 40.6413], LAX: [-118.4085, 33.9416], LAS: [-115.1522, 36.084],
  LGA: [-73.8726, 40.7769], MCO: [-81.3089, 28.4312], MIA: [-80.287, 25.7959], MSP: [-93.2218, 44.8848], ORD: [-87.9073, 41.9742],
  PHL: [-75.2439, 39.8744], PHX: [-112.0116, 33.4352], SAN: [-117.1897, 32.7336], SEA: [-122.3088, 47.4502], SFO: [-122.379, 37.6213],
  SLC: [-111.9791, 40.7899], STL: [-90.3708, 38.7487], TPA: [-82.5332, 27.9755], YYZ: [-79.6248, 43.6777], YVR: [-123.184, 49.1947], YUL: [-73.7408, 45.4577],
  AMS: [4.7639, 52.3086], ATH: [23.9445, 37.9364], BCN: [2.0833, 41.2974], BER: [13.5033, 52.3667], BRU: [4.4844, 50.901],
  CDG: [2.5553, 49.0097], CPH: [12.656, 55.6181], DUB: [-6.2701, 53.4264], FCO: [12.2389, 41.8003], FRA: [8.5622, 50.0379],
  GVA: [6.109, 46.2381], LHR: [-0.4543, 51.47], LGW: [-0.1821, 51.1537], STN: [0.235, 51.885], LTN: [-0.3683, 51.8747],
  LCY: [0.0553, 51.5053], LIS: [-9.1359, 38.7742], MAD: [-3.5676, 40.4983], MXP: [8.7231, 45.6306], LIN: [9.2767, 45.4451],
  MUC: [11.7861, 48.3538], PRG: [14.26, 50.1008], VIE: [16.5697, 48.1103], ZRH: [8.5492, 47.4582], BUD: [19.2556, 47.4369],
  ZAG: [16.0688, 45.7429], VCE: [12.3519, 45.5053], NCE: [7.2159, 43.6653], IST: [28.7519, 41.2753], NRT: [140.3929, 35.772],
  HND: [139.7798, 35.5494], ICN: [126.4407, 37.4602], GMP: [126.7906, 37.5583], PEK: [116.5977, 40.0799], PKX: [116.6031, 39.5098],
  PVG: [121.8052, 31.1443], HKG: [113.9185, 22.308], SIN: [103.9894, 1.3644], BKK: [100.7501, 13.69], DEL: [77.1, 28.5562],
  BOM: [72.8679, 19.0896], DXB: [55.3644, 25.2531], DOH: [51.6138, 25.2731], JNB: [28.246, -26.1337], CPT: [18.6021, -33.9715],
  GRU: [-46.4731, -23.4356], EZE: [-58.5358, -34.8222], SCL: [-70.7858, -33.393], MEX: [-99.0721, 19.4363], CUN: [-86.8515, 21.0365],
  SYD: [151.1772, -33.9461], MEL: [144.843, -37.669], AKL: [174.785, -37.0082],
};

const worldFeatures = feature(worldAtlas as any, (worldAtlas as any).objects.countries) as any;

function projectRoutePath(projection: ReturnType<typeof geoEqualEarth>, from: Coordinate, to: Coordinate) {
  const interpolate = geoInterpolate(from, to);
  const coordinates = Array.from({ length: 41 }, (_, index) => interpolate(index / 40));
  return geoPath(projection)({ type: 'LineString', coordinates } as any) ?? '';
}

function cabinParam(cabin: string) {
  if (cabin === 'Premium economy') return 'premium_economy';
  if (cabin === 'First class') return 'first';
  return cabin.toLowerCase();
}

function AirportSearch({ label, value, code, onSelect, placeholder }: { label: string; value: string; code: string; onSelect: (airport: Airport) => void; placeholder: string }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const trimmed = query.trim();
    const currentRequestId = ++requestId.current;
    if (trimmed.length < 2 || trimmed === value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/airports?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = await response.json();
        if (requestId.current !== currentRequestId) return;
        setResults(Array.isArray(data.airports) ? data.airports : []);
        setOpen(true);
      } catch (error) {
        if (controller.signal.aborted || requestId.current !== currentRequestId) return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted && requestId.current === currentRequestId) setLoading(false);
      }
    }, 160);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, value]);

  return (
    <div className="discovery-airport-search">
      <label htmlFor={`airport-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</label>
      <input id={`airport-${label.toLowerCase().replace(/\s+/g, '-')}`} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => { if (query.trim().length >= 2) setOpen(true); }} placeholder={placeholder} autoComplete="off" aria-autocomplete="list" aria-expanded={open} />
      {code ? <small>{code} selected</small> : <small>Search by city or airport name</small>}
      {open && (loading || results.length > 0) && (
        <div className="discovery-airport-results" role="listbox">
          {loading && <div className="discovery-airport-result">Searching airports…</div>}
          {!loading && results.map((airport) => (
            <button type="button" className="discovery-airport-result" key={`${airport.iata_code}-${airport.name}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(airport); setQuery(`${airport.municipality || airport.name} (${airport.iata_code})`); setOpen(false); }}>
              <strong>{airport.municipality || airport.name}</strong><span>{airport.iata_code} · {airport.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripDiscovery() {
  const [origin, setOrigin] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [originCoordinate, setOriginCoordinate] = useState<Coordinate | undefined>();
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('airport');
  const [region, setRegion] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationCoordinate, setDestinationCoordinate] = useState<Coordinate | undefined>();
  const [cabin, setCabin] = useState('Premium economy');
  const [budget, setBudget] = useState('1000');
  const [passengers, setPassengers] = useState('1');
  const [specificDate, setSpecificDate] = useState('');
  const [airlineMode, setAirlineMode] = useState('all');
  const [stops, setStops] = useState('1');
  const [tripLength, setTripLength] = useState('1–3 weeks');
  const [dateRange, setDateRange] = useState('Next 12 months');
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleDestinationChange = (event: Event) => {
      const detail = (event as CustomEvent<DestinationSelection>).detail;
      if (!detail) return;

      if (detail.mode === 'airport') {
        const airport = detail.airport;
        setDestinationMode('airport');
        setDestinationAirport(airport.iata_code);
        setDestinationSearch(`${airport.municipality || airport.name} (${airport.iata_code})`);
        setDestinationCoordinate(
          airport.latitude != null && airport.longitude != null
            ? [airport.longitude, airport.latitude]
            : airportCoordinates[airport.iata_code]
        );
        return;
      }

      setDestinationMode('region');
      setDestinationSearch(detail.country.name);
      setDestinationAirport('');
      setDestinationCoordinate(undefined);
    };

    window.addEventListener('tripsignal:destination-change', handleDestinationChange);
    return () => window.removeEventListener('tripsignal:destination-change', handleDestinationChange);
  }, []);

  const budgetValue = Number(budget) || 0;
  const destinationCoordinates = destinationAirport ? (airportCoordinates[destinationAirport] ?? destinationCoordinate) : destinationCoordinate;
  const originCoordinates = origin ? (airportCoordinates[origin] ?? originCoordinate) : originCoordinate;
  const projection = useMemo(() => {
    const base = geoEqualEarth();
    return base.fitExtent([[40, 28], [960, 492]], worldFeatures);
  }, []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule().step([20, 20])(), []);
  const originPoint = originCoordinates ? projection(originCoordinates) : undefined;
  const destinationPoint = destinationCoordinates ? projection(destinationCoordinates) : undefined;

  const affiliateContext: AffiliateContext = {
    ...(destinationAirport ? { destination: destinationAirport } : {}),
    ...(origin ? { origin } : {}),
    ...(specificDate ? { departureDate: specificDate, returnDate: specificDate } : {}),
  };

  function buildWatch() {
    if (!origin || (destinationMode === 'airport' && !destinationAirport) || !email.trim()) return;
    const effectiveDateRange = specificDate ? 'Custom dates' : dateRange;
    const params = new URLSearchParams({ origin, destinationMode, ...(destinationMode === 'region' ? { region } : { destinationAirport }), ...(budget ? { price: budget } : {}), passengers, cabin: cabinParam(cabin), airlineMode, maxStops: stops, tripLength, dateRange: effectiveDateRange, ...(specificDate ? { dateStart: specificDate, dateEnd: specificDate } : {}), frequency, email: email.trim() });
    window.location.href = `/alerts?${params.toString()}`;
  }

  return (
    <section className="discovery shell" id="explore">
      <div className="discovery-head">
        <div><p className="section-kicker">Find a trip</p><h2>Tell us where.<br /><em>Set the fare.</em></h2></div>
        <p>Set the route, timing and fare you want. Advanced criteria are optional.</p>
      </div>

      <div className="discovery-layout">
        <div className="discovery-controls">
          <AirportSearch label="From" value={originSearch} code={origin} onSelect={(airport) => { setOrigin(airport.iata_code); setOriginSearch(`${airport.municipality || airport.name} (${airport.iata_code})`); setOriginCoordinate(airport.latitude != null && airport.longitude != null ? [airport.longitude, airport.latitude] : undefined); }} placeholder="Search city or airport" />
          <div className="discovery-field"><label>Where</label><div className="discovery-options"><button type="button" className={destinationMode === 'region' ? 'active' : ''} onClick={() => setDestinationMode('region')}>Region</button><button type="button" className={destinationMode === 'airport' ? 'active' : ''} onClick={() => setDestinationMode('airport')}>Specific airport</button></div></div>
          {destinationMode === 'region' ? <div className="discovery-field"><label htmlFor="discovery-region">Region</label><select id="discovery-region" value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div> : <AirportSearch label="To" value={destinationSearch} code={destinationAirport} onSelect={(airport) => { setDestinationAirport(airport.iata_code); setDestinationSearch(`${airport.municipality || airport.name} (${airport.iata_code})`); setDestinationCoordinate(airport.latitude != null && airport.longitude != null ? [airport.longitude, airport.latitude] : undefined); }} placeholder="Search city or airport" />}
          <div className="discovery-field"><label>Budget</label><div className="discovery-range"><input id="discovery-budget" type="range" min="100" max={cabinMax[cabin] ?? 6000} step="50" value={budgetValue} onChange={(event) => setBudget(event.target.value)} /><output>${Number(budgetValue).toLocaleString()}</output></div></div>
          <div className="discovery-field"><label>Travel window</label><select id="discovery-window" value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Next 3 months</option><option>Next 6 months</option><option>Next 12 months</option></select></div>
          <div className="discovery-field"><label>Specific date</label><input id="discovery-date" type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} /></div>
          <div className="discovery-field"><label>Cabin</label><div className="discovery-options discovery-cabin-options">{cabinOptions.map((item) => <button key={item} type="button" className={cabin === item ? 'active' : ''} onClick={() => { setCabin(item); if (Number(budget) > (cabinMax[item] ?? 6000)) setBudget(String(cabinMax[item] ?? 6000)); }}>{item}</button>)}</div></div>
          <div className="discovery-field"><label htmlFor="discovery-passengers">Passengers</label><select id="discovery-passengers" value={passengers} onChange={(event) => setPassengers(event.target.value)}><option value="1">1 passenger</option><option value="2">2 passengers</option><option value="3">3 passengers</option><option value="4">4 passengers</option><option value="5">5 passengers</option><option value="6">6 passengers</option><option value="7">7 passengers</option><option value="8">8 passengers</option><option value="9">9 passengers</option></select></div>
          <div className="discovery-field"><label htmlFor="discovery-airline">Airline</label><select id="discovery-airline" value={airlineMode} onChange={(event) => setAirlineMode(event.target.value)}>{airlines.map((airline) => <option key={airline.code} value={airline.code}>{airline.name}</option>)}</select></div>
          <div className="discovery-field"><label htmlFor="discovery-stops">Stops</label><select id="discovery-stops" value={stops} onChange={(event) => setStops(event.target.value)}><option value="0">Nonstop</option><option value="1">1 stop max</option><option value="2">2 stops max</option><option value="any">Any</option></select></div>
          <div className="discovery-field"><label htmlFor="discovery-trip-length">Trip length</label><select id="discovery-trip-length" value={tripLength} onChange={(event) => setTripLength(event.target.value)}><option>3–7 days</option><option>1–2 weeks</option><option>1–3 weeks</option><option>1–4 weeks</option></select></div>
          <div className="discovery-field"><label htmlFor="discovery-frequency">Check frequency</label><select id="discovery-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
          <div className="discovery-field discovery-email-field"><label htmlFor="discovery-email">Email</label><input id="discovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
          <button type="button" className="button button-primary discovery-cta" onClick={buildWatch}>Start watching</button>
        </div>
        <div className="discovery-map route-map" aria-hidden="true">
          <svg viewBox="0 0 1000 520" role="presentation"><path className="map-graticule" d={path(graticule) ?? ''} /><path className="map-countries" d={path(worldFeatures) ?? ''} />{originPoint && destinationPoint && <path className="map-route-preview" d={projectRoutePath(projection, originCoordinates!, destinationCoordinates!)} />}{originPoint && <circle className="map-origin" cx={originPoint[0]} cy={originPoint[1]} r="4.5" />}{destinationPoint && <circle className="map-destination" cx={destinationPoint[0]} cy={destinationPoint[1]} r="4.5" />}</svg>
        </div>
      </div>
      <TripExtras context={affiliateContext} />
    </section>
  );
}
