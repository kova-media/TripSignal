'use client';

import { useMemo, useState } from 'react';
import { geoEqualEarth, geoGraticule, geoInterpolate, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';

const routes = [
  { code: 'AMS', city: 'Amsterdam', region: 'Europe', price: 687, typical: 940, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', coordinates: [4.7639, 52.3086] as [number, number] },
  { code: 'FCO', city: 'Rome', region: 'Europe', price: 812, typical: 1090, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', coordinates: [12.2389, 41.8003] as [number, number] },
  { code: 'BCN', city: 'Barcelona', region: 'Europe', price: 774, typical: 1010, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', coordinates: [2.0833, 41.2974] as [number, number] },
  { code: 'LIS', city: 'Lisbon', region: 'Europe', price: 798, typical: 1060, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', coordinates: [-9.1359, 38.7742] as [number, number] },
  { code: 'AMS', city: 'Amsterdam', region: 'Europe', price: 1486, typical: 2180, cabin: 'Business', stops: '1 stop', days: '7–21 days', coordinates: [4.7639, 52.3086] as [number, number] },
  { code: 'FRA', city: 'Frankfurt', region: 'Europe', price: 1520, typical: 2250, cabin: 'Business', stops: '1 stop', days: '7–21 days', coordinates: [8.5622, 50.0379] as [number, number] },
  { code: 'MAD', city: 'Madrid', region: 'Europe', price: 1340, typical: 1980, cabin: 'Business', stops: '1 stop', days: '7–21 days', coordinates: [-3.5676, 40.4983] as [number, number] },
  { code: 'LHR', city: 'London', region: 'Europe', price: 1210, typical: 1780, cabin: 'Economy', stops: '1 stop', days: '3–10 days', coordinates: [-0.4543, 51.47] as [number, number] },
  { code: 'CDG', city: 'Paris', region: 'Europe', price: 1180, typical: 1690, cabin: 'Economy', stops: '1 stop', days: '3–10 days', coordinates: [2.5553, 49.0097] as [number, number] },
  { code: 'JFK', city: 'New York', region: 'North America', price: 3180, typical: 4200, cabin: 'First class', stops: 'Nonstop', days: '3–10 days', coordinates: [-73.7781, 40.6413] as [number, number] },
  { code: 'CUN', city: 'Cancún', region: 'North America', price: 398, typical: 525, cabin: 'Economy', stops: '1 stop', days: '3–7 days', coordinates: [-86.8515, 21.0365] as [number, number] },
  { code: 'LAX', city: 'Los Angeles', region: 'North America', price: 455, typical: 590, cabin: 'Economy', stops: 'Nonstop', days: '3–10 days', coordinates: [-118.4085, 33.9416] as [number, number] },
  { code: 'GRU', city: 'São Paulo', region: 'South America', price: 735, typical: 980, cabin: 'Economy', stops: '1 stop', days: '7–14 days', coordinates: [-46.4731, -23.4356] as [number, number] },
  { code: 'SCL', city: 'Santiago', region: 'South America', price: 820, typical: 1080, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', coordinates: [-70.7858, -33.393] as [number, number] },
  { code: 'NRT', city: 'Tokyo', region: 'Asia', price: 1198, typical: 1450, cabin: 'Premium economy', stops: '1 stop', days: '10–21 days', coordinates: [140.3929, 35.772] as [number, number] },
  { code: 'ICN', city: 'Seoul', region: 'Asia', price: 1270, typical: 1510, cabin: 'Premium economy', stops: '1 stop', days: '10–21 days', coordinates: [126.4407, 37.4602] as [number, number] },
  { code: 'DXB', city: 'Dubai', region: 'Middle East', price: 1080, typical: 1390, cabin: 'Business', stops: '1 stop', days: '7–21 days', coordinates: [55.3644, 25.2532] as [number, number] },
  { code: 'JNB', city: 'Johannesburg', region: 'Africa', price: 1120, typical: 1460, cabin: 'Premium economy', stops: '1 stop', days: '10–21 days', coordinates: [28.246, -26.1337] as [number, number] },
  { code: 'SYD', city: 'Sydney', region: 'Oceania', price: 1380, typical: 1690, cabin: 'Premium economy', stops: '1 stop', days: '10–21 days', coordinates: [151.1772, -33.9461] as [number, number] },
];

const benchmarks: Record<string, { excellent: number; good: number; typical: number }> = {
  Economy: { excellent: 500, good: 650, typical: 800 },
  'Premium economy': { excellent: 900, good: 1100, typical: 1350 },
  Business: { excellent: 1600, good: 1900, typical: 2400 },
  'First class': { excellent: 2500, good: 3200, typical: 4200 },
};

const destinationOptions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const cabinOptions = ['Premium economy', 'Business', 'First class', 'Economy'];
const airports: Record<string, [number, number]> = {
  MCI: [-94.7139, 39.2976], JFK: [-73.7781, 40.6413], LAX: [-118.4085, 33.9416], ORD: [-87.9073, 41.9742], ATL: [-84.4277, 33.6407],
  AMS: [4.7639, 52.3086], FCO: [12.2389, 41.8003], BCN: [2.0833, 41.2974], LIS: [-9.1359, 38.7742], FRA: [8.5622, 50.0379], MAD: [-3.5676, 40.4983],
  LHR: [-0.4543, 51.47], CDG: [2.5553, 49.0097], MUC: [11.7861, 48.3538], CUN: [-86.8515, 21.0365], GRU: [-46.4731, -23.4356], SCL: [-70.7858, -33.393],
  NRT: [140.3929, 35.772], HND: [139.7798, 35.5494], ICN: [126.4407, 37.4602], PEK: [116.597, 40.0799], PVG: [121.8052, 31.1443], DXB: [55.3644, 25.2532],
  DOH: [51.6081, 25.2731], JNB: [28.246, -26.1337], CPT: [18.6021, -33.9715], SYD: [151.1772, -33.9461], MEL: [144.843, -37.6733], AKL: [174.785, -37.0082],
  DUB: [-6.2701, 53.4264], VIE: [16.5697, 48.1103], ZRH: [8.5492, 47.4581], ATH: [23.9445, 37.9364], MXP: [8.7281, 45.6306], YYZ: [-79.6248, 43.6777], YVR: [-123.184, 49.1939],
  MIA: [-80.287, 25.7959], BOS: [-71.0096, 42.3656], SFO: [-122.375, 37.6188],
};

const worldFeatures = feature(worldAtlas as any, (worldAtlas as any).objects.countries) as any;

function projectRoutePath(projection: ReturnType<typeof geoEqualEarth>, from: [number, number], to: [number, number]) {
  const interpolate = geoInterpolate(from, to);
  const coordinates = Array.from({ length: 41 }, (_, index) => interpolate(index / 40));
  return geoPath(projection)({ type: 'LineString', coordinates } as any) ?? '';
}

function cabinParam(cabin: string) {
  if (cabin === 'Premium economy') return 'premium_economy';
  if (cabin === 'First class') return 'first';
  return cabin.toLowerCase();
}

export default function TripDiscovery() {
  const [origin, setOrigin] = useState('MCI');
  const [destinationMode, setDestinationMode] = useState<'region' | 'airport'>('region');
  const [destination, setDestination] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('AMS');
  const [cabin, setCabin] = useState('Premium economy');
  const [budget, setBudget] = useState('1000');
  const [passengers, setPassengers] = useState('1');
  const [specificDate, setSpecificDate] = useState('');
  const [selectedCode, setSelectedCode] = useState('AMS');

  const filtered = useMemo(() => routes.filter((route) => route.region === destination && route.cabin === cabin), [destination, cabin]);
  const selected = filtered.find((route) => route.code === selectedCode) ?? filtered[0] ?? routes[0];
  const benchmark = benchmarks[cabin];
  const budgetValue = Number(budget) || 0;
  const signalCount = filtered.filter((route) => route.price <= budgetValue).length;
  const hasOrigin = Boolean(origin && airports[origin]);
  const mapOrigin = hasOrigin ? airports[origin] : airports.LAX;
  const requestedDestination = destinationMode === 'airport' ? destinationAirport.toUpperCase() : selected.code;
  const hasDestination = Boolean(requestedDestination && airports[requestedDestination]);
  const mapDestination = hasDestination ? airports[requestedDestination] : selected.coordinates;
  const mapDestinationCode = requestedDestination || selected.code;
  const watchDestination = destinationMode === 'airport' ? destinationAirport.toUpperCase() : selected.code;

  const projection = useMemo(() => geoEqualEarth().fitExtent([[34, 34], [966, 470]], worldFeatures), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule().step([20, 20])(), []);
  const originPoint = projection(mapOrigin);
  const destinationPoint = projection(mapDestination);

  function buildWatch() {
    const params = new URLSearchParams({
      ...(origin ? { origin: origin.toUpperCase() } : {}),
      destinationMode,
      ...(destinationMode === 'region' ? { region: destination } : { destinationAirport: destinationAirport.toUpperCase() }),
      price: String(budgetValue || selected.price),
      passengers,
      cabin: cabinParam(cabin),
      ...(specificDate ? { dateRange: 'Custom dates', dateStart: specificDate, dateEnd: specificDate } : {}),
    });
    window.location.href = `/alerts?${params.toString()}`;
  }

  function chooseDestination(item: string) {
    setDestination(item);
    const next = routes.find((route) => route.region === item && route.cabin === cabin);
    if (next) setSelectedCode(next.code);
  }

  function chooseCabin(item: string) {
    setCabin(item);
    const next = routes.find((route) => route.region === destination && route.cabin === item);
    if (next) setSelectedCode(next.code);
  }

  return (
    <section className="discovery shell" id="explore">
      <div className="discovery-head">
        <div><p className="section-kicker">4 / Find a trip</p><h2>Search the map.<br /><em>Know what a good fare looks like.</em></h2></div>
        <p>Start broad with a region or narrow the search to an exact airport and date. The benchmark gives you context before you create a watch.</p>
      </div>

      <div className="discovery-layout">
        <div className="discovery-controls">
          <div className="discovery-field"><label htmlFor="discovery-origin">From</label><input id="discovery-origin" value={origin} maxLength={3} placeholder="Airport code" onChange={(event) => setOrigin(event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())} /></div>
          <div className="discovery-field">
            <label>Where</label>
            <div className="discovery-options"><button type="button" className={destinationMode === 'region' ? 'active' : ''} onClick={() => setDestinationMode('region')}>Region</button><button type="button" className={destinationMode === 'airport' ? 'active' : ''} onClick={() => setDestinationMode('airport')}>Specific airport</button></div>
            {destinationMode === 'region' ? <select value={destination} onChange={(event) => chooseDestination(event.target.value)}>{destinationOptions.map((item) => <option key={item}>{item}</option>)}</select> : <input id="discovery-destination-airport" value={destinationAirport} maxLength={3} placeholder="Airport code" onChange={(event) => { const code = event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase(); setDestinationAirport(code); setSelectedCode(code); }} />}
          </div>
          <div className="discovery-field"><label>Cabin</label><div className="discovery-options">{cabinOptions.map((item) => <button type="button" key={item} className={cabin === item ? 'active' : ''} onClick={() => chooseCabin(item)}>{item}</button>)}</div></div>
          <div className="discovery-field"><label htmlFor="discovery-passengers">Passengers</label><select id="discovery-passengers" value={passengers} onChange={(event) => setPassengers(event.target.value)}>{Array.from({ length: 9 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} passenger{count === 1 ? '' : 's'}</option>)}</select></div>
          <div className="discovery-field"><label htmlFor="discovery-budget">Maximum fare</label><div className="discovery-price"><span>$</span><input id="discovery-budget" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} /></div><small>Total fare for the selected passengers</small></div>
          <div className="discovery-field"><label htmlFor="discovery-date">Specific departure date <small>Optional</small></label><input id="discovery-date" type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} /></div>
          <div className="benchmark">
            <div className="benchmark-head"><span>Fare benchmark</span><strong>{cabin}</strong></div>
            <div className="benchmark-scale"><span className="excellent" style={{ width: `${Math.min(100, benchmark.excellent / benchmark.typical * 100)}%` }} /></div>
            <div className="benchmark-labels"><span><b>Excellent</b> under ${benchmark.excellent.toLocaleString()}</span><span><b>Good</b> under ${benchmark.good.toLocaleString()}</span><span><b>Typical</b> ${benchmark.typical.toLocaleString()}</span></div>
            <p>{selected.price <= benchmark.excellent ? 'This route is in excellent territory.' : selected.price <= benchmark.good ? 'This route is in good territory.' : 'This route is above the good-fare range.'}</p>
          </div>
          <button type="button" className="button button-primary discovery-cta" onClick={buildWatch}>Create {origin || 'your'} watch {watchDestination ? `→ ${watchDestination}` : ''}</button>
        </div>

        <div className="route-map" aria-label="TripSignal geographic fare map">
          <div className="route-map-top"><span>{hasOrigin ? 'FARE MAP' : 'EXAMPLE FARE MAP'}</span><span>{signalCount} routes under your budget</span></div>
          <div className="route-map-canvas">
            <svg viewBox="0 0 1000 520" role="img" aria-label={`World map showing ${hasOrigin ? `routes from ${origin}` : 'an example route from LAX'}`}>
              <path d={path(graticule) ?? ''} className="map-graticule" />
              <g className="map-countries">{worldFeatures.features.map((country: any) => <path key={country.id ?? country.properties?.name} d={path(country) ?? ''} />)}</g>
              <g className="map-routes">{filtered.map((route) => { const active = route.code === selected.code && destinationMode === 'region'; return <g key={`${route.code}-${route.cabin}`} className={active ? 'map-route active' : 'map-route'} onClick={() => setSelectedCode(route.code)}><path d={projectRoutePath(projection, mapOrigin, route.coordinates)} /></g>; })}</g>
              {destinationMode === 'airport' && <path d={projectRoutePath(projection, mapOrigin, mapDestination)} className="map-route-preview" />}
              {originPoint && <g className="map-origin"><circle cx={originPoint[0]} cy={originPoint[1]} r="6" /><circle cx={originPoint[0]} cy={originPoint[1]} r="14" /><text x={originPoint[0] + 12} y={originPoint[1] - 10}>{hasOrigin ? origin : 'LAX'}</text><text x={originPoint[0] + 12} y={originPoint[1] + 4} className="map-marker-sub">{hasOrigin ? 'DEPARTURE' : 'EXAMPLE'}</text></g>}
              {destinationPoint && <g className="map-destination"><circle cx={destinationPoint[0]} cy={destinationPoint[1]} r="6" /><circle cx={destinationPoint[0]} cy={destinationPoint[1]} r="14" /><text x={destinationPoint[0] + 12} y={destinationPoint[1] - 10}>{mapDestinationCode}</text><text x={destinationPoint[0] + 12} y={destinationPoint[1] + 4} className="map-marker-sub">ARRIVAL</text></g>}
            </svg>
          </div>
          <div className="route-map-detail"><div><span>{hasOrigin ? `${origin} → ${mapDestinationCode}` : `LAX → ${mapDestinationCode}`}</span><strong>${selected.price.toLocaleString()}</strong></div><p>{selected.city} · {selected.cabin} · {selected.stops}</p><small>${Math.max(0, selected.typical - selected.price).toLocaleString()} below typical · {selected.days}</small></div>
        </div>
      </div>

      <div className="discovery-routes"><div className="discovery-routes-head"><span>Routes worth watching</span><span>{hasOrigin ? `Personalized to ${origin}` : 'Enter an origin to personalize'}</span></div>{filtered.slice(0, 4).map((route) => <button type="button" key={`${route.code}-${route.cabin}`} className={route.code === selected.code ? 'route-row active' : 'route-row'} onClick={() => setSelectedCode(route.code)}><span><strong>{hasOrigin ? `${origin} → ${route.code}` : route.code}</strong><small>{route.city} · {route.cabin} · {route.stops}</small></span><span><b>${route.price.toLocaleString()}</b><small>${Math.max(0, route.typical - route.price).toLocaleString()} below typical</small></span></button>)}</div>
    </section>
  );
}
