'use client';

import { useMemo, useState } from 'react';

const routes = [
  { code: 'AMS', city: 'Amsterdam', region: 'Europe', price: 687, typical: 940, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', x: 61, y: 31 },
  { code: 'FCO', city: 'Rome', region: 'Europe', price: 812, typical: 1090, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', x: 63, y: 40 },
  { code: 'BCN', city: 'Barcelona', region: 'Europe', price: 774, typical: 1010, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', x: 59, y: 40 },
  { code: 'CDG', city: 'Paris', region: 'Europe', price: 862, typical: 1120, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', x: 59, y: 34 },
  { code: 'LIS', city: 'Lisbon', region: 'Europe', price: 798, typical: 1060, cabin: 'Premium economy', stops: '1 stop', days: '7–21 days', x: 55, y: 41 },
  { code: 'NRT', city: 'Tokyo', region: 'Asia', price: 1198, typical: 1450, cabin: 'Premium economy', stops: '1 stop', days: '10–21 days', x: 86, y: 39 },
  { code: 'CUN', city: 'Cancún', region: 'North America', price: 398, typical: 525, cabin: 'Economy', stops: '1 stop', days: '3–7 days', x: 28, y: 53 },
];

const benchmarks: Record<string, { excellent: number; good: number; typical: number }> = {
  'Premium economy': { excellent: 900, good: 1100, typical: 1350 },
  Business: { excellent: 1600, good: 1900, typical: 2400 },
  Economy: { excellent: 500, good: 650, typical: 800 },
};

const destinationOptions = ['Europe', 'North America', 'Asia'];
const cabinOptions = ['Premium economy', 'Business', 'Economy'];

export default function TripDiscovery() {
  const [origin, setOrigin] = useState('MCI');
  const [destination, setDestination] = useState('Europe');
  const [cabin, setCabin] = useState('Premium economy');
  const [budget, setBudget] = useState('1000');
  const [selectedCode, setSelectedCode] = useState('AMS');

  const filtered = useMemo(() => routes.filter((route) => route.region === destination && route.cabin === cabin), [destination, cabin]);
  const selected = filtered.find((route) => route.code === selectedCode) ?? filtered[0] ?? routes[0];
  const benchmark = benchmarks[cabin];
  const budgetValue = Number(budget) || 0;
  const signalCount = filtered.filter((route) => route.price <= budgetValue).length;

  function buildWatch() {
    const params = new URLSearchParams({ origin, destinationMode: 'airport', destinationAirport: selected.code, price: String(budgetValue || selected.price), cabin: cabin === 'Premium economy' ? 'premium_economy' : cabin.toLowerCase(), tripLength: selected.days });
    window.location.href = `/alerts?${params.toString()}`;
  }

  return (
    <section className="discovery shell" id="explore">
      <div className="discovery-head">
        <div>
          <p className="section-kicker">5 / Find a trip</p>
          <h2>Search the map.<br /><em>Know what a good fare looks like.</em></h2>
        </div>
        <p>Start broad, then narrow the search when a route catches your eye. The benchmark gives you context before you create a watch.</p>
      </div>

      <div className="discovery-layout">
        <div className="discovery-controls">
          <div className="discovery-field"><label htmlFor="discovery-origin">From</label><input id="discovery-origin" value={origin} maxLength={3} onChange={(event) => setOrigin(event.target.value.toUpperCase())} /></div>
          <div className="discovery-field"><label>Where</label><div className="discovery-options">{destinationOptions.map((item) => <button type="button" key={item} className={destination === item ? 'active' : ''} onClick={() => { setDestination(item); const next = routes.find((route) => route.region === item && route.cabin === cabin); if (next) setSelectedCode(next.code); }}>{item}</button>)}</div></div>
          <div className="discovery-field"><label>Cabin</label><div className="discovery-options">{cabinOptions.map((item) => <button type="button" key={item} className={cabin === item ? 'active' : ''} onClick={() => { setCabin(item); const next = routes.find((route) => route.region === destination && route.cabin === item); if (next) setSelectedCode(next.code); }}>{item}</button>)}</div></div>
          <div className="discovery-field"><label htmlFor="discovery-budget">Maximum fare</label><div className="discovery-price"><span>$</span><input id="discovery-budget" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} /></div></div>
          <div className="benchmark">
            <div className="benchmark-head"><span>Fare benchmark</span><strong>{cabin}</strong></div>
            <div className="benchmark-scale"><span className="excellent" style={{ width: `${Math.min(100, benchmark.excellent / benchmark.typical * 100)}%` }} /></div>
            <div className="benchmark-labels"><span><b>Excellent</b> under ${benchmark.excellent.toLocaleString()}</span><span><b>Good</b> under ${benchmark.good.toLocaleString()}</span><span><b>Typical</b> ${benchmark.typical.toLocaleString()}</span></div>
            <p>{selected.price <= benchmark.excellent ? 'This route is in excellent territory.' : selected.price <= benchmark.good ? 'This route is in good territory.' : 'This route is above the good-fare range.'}</p>
          </div>
          <button type="button" className="button button-primary discovery-cta" onClick={buildWatch}>Watch {origin} → {selected.code} <span>↗</span></button>
        </div>

        <div className="route-map" aria-label="TripSignal route map">
          <div className="route-map-top"><span>FARE MAP</span><span>{signalCount} routes under your budget</span></div>
          <svg viewBox="0 0 1000 520" role="img" aria-label="Stylized world route map">
            <g className="map-grid"><path d="M0 100H1000M0 200H1000M0 300H1000M0 400H1000M100 0V520M200 0V520M300 0V520M400 0V520M500 0V520M600 0V520M700 0V520M800 0V520M900 0V520" /></g>
            <g className="map-land"><path d="M92 160l42-47 71-21 65 18 43 43-12 39-44 19-26 45-45-3-19-35-42-12z" /><path d="M314 290l44 13 30 49-17 64-34 43-22-32 6-44-29-37z" /><path d="M485 143l37-31 55 5 27 31-18 25 26 28-30 19-32-15-37 8-26-27z" /><path d="M515 222l43-12 39 26 13 61-31 47-47-24-18-49z" /><path d="M630 147l71-30 91 11 69 39 52 57-38 32-72-14-54 26-62-22-31-42z" /><path d="M774 302l54-6 49 30-12 46-58 28-41-34z" /></g>
            {routes.map((route) => {
              const active = route.code === selected.code;
              return <g key={route.code} className={active ? 'map-route active' : 'map-route'} onClick={() => setSelectedCode(route.code)}><path d={`M 270 235 Q ${(27 + route.x) * 5} ${(47 + route.y) * 5 - 85} ${route.x * 10} ${route.y * 10}`} /><circle cx={route.x * 10} cy={route.y * 10} r={active ? 7 : 4} /></g>;
            })}
            <circle className="map-origin" cx="270" cy="235" r="8" /><text className="map-origin-label" x="285" y="231">{origin}</text>
          </svg>
          <div className="route-map-detail"><div><span>{origin} → {selected.code}</span><strong>${selected.price.toLocaleString()}</strong></div><p>{selected.city} · {selected.cabin} · {selected.stops}</p><small>${Math.max(0, selected.typical - selected.price).toLocaleString()} below typical · {selected.days}</small></div>
        </div>
      </div>

      <div className="discovery-routes"><div className="discovery-routes-head"><span>Routes worth watching</span><span>Personalized to {origin}</span></div>{filtered.slice(0, 4).map((route) => <button type="button" key={route.code} className={route.code === selected.code ? 'route-row active' : 'route-row'} onClick={() => setSelectedCode(route.code)}><span><strong>{origin} → {route.code}</strong><small>{route.city} · {route.cabin} · {route.stops}</small></span><span><b>${route.price.toLocaleString()}</b><small>${Math.max(0, route.typical - route.price).toLocaleString()} below typical</small></span></button>)}</div>
    </section>
  );
}
