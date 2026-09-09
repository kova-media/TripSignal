'use client';

import { useState } from 'react';

const destinationOptions = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];
const cabinOptions = ['Economy', 'Premium economy', 'Business', 'First class'];

function cabinParam(cabin: string) {
  if (cabin === 'Premium economy') return 'premium_economy';
  if (cabin === 'First class') return 'first';
  return cabin.toLowerCase();
}

export default function TripDiscovery() {
  const [origin, setOrigin] = useState('');
  const [destinationMode, setDestinationMode] = useState<'region' | 'airport'>('airport');
  const [destination, setDestination] = useState('Europe');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [cabin, setCabin] = useState('Economy');
  const [budget, setBudget] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [specificDate, setSpecificDate] = useState('');

  function buildWatch() {
    const params = new URLSearchParams({
      ...(origin ? { origin: origin.toUpperCase() } : {}),
      destinationMode,
      ...(destinationMode === 'region' ? { region: destination } : { destinationAirport: destinationAirport.toUpperCase() }),
      ...(budget ? { price: budget } : {}),
      passengers,
      cabin: cabinParam(cabin),
      ...(specificDate ? { dateRange: 'Custom dates', dateStart: specificDate, dateEnd: specificDate } : {}),
    });
    window.location.href = `/alerts?${params.toString()}`;
  }

  return (
    <section className="discovery shell" id="explore">
      <div className="discovery-head">
        <div><p className="section-kicker">4 / Find a trip</p><h2>Search the map.<br /><em>Know what a good fare looks like.</em></h2></div>
        <p>Start broad with a region or narrow the search to an exact airport and date. The benchmark gives you context before you create a watch.</p>
      </div>

      <div className="discovery-layout">
        <div className="discovery-controls">
          <div className="discovery-field">
            <label htmlFor="discovery-origin">From</label>
            <input id="discovery-origin" value={origin} maxLength={3} placeholder="Airport code" onChange={(event) => setOrigin(event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())} />
          </div>

          <div className="discovery-field">
            <label>Where</label>
            <div className="discovery-options">
              <button type="button" className={destinationMode === 'region' ? 'active' : ''} onClick={() => setDestinationMode('region')}>Region</button>
              <button type="button" className={destinationMode === 'airport' ? 'active' : ''} onClick={() => setDestinationMode('airport')}>Specific airport</button>
            </div>
            {destinationMode === 'region' ? (
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {destinationOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            ) : (
              <input id="discovery-destination-airport" value={destinationAirport} maxLength={3} placeholder="Airport code" onChange={(event) => setDestinationAirport(event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())} />
            )}
          </div>

          <div className="discovery-field">
            <label>Cabin</label>
            <div className="discovery-options">
              {cabinOptions.map((item) => (
                <button type="button" key={item} className={cabin === item ? 'active' : ''} onClick={() => setCabin(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-passengers">Passengers</label>
            <select id="discovery-passengers" value={passengers} onChange={(event) => setPassengers(event.target.value)}>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>{count} passenger{count === 1 ? '' : 's'}</option>
              ))}
            </select>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-budget">Maximum fare</label>
            <div className="discovery-price">
              <span>$</span>
              <input id="discovery-budget" inputMode="numeric" value={budget} placeholder="Maximum fare" onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} />
            </div>
            <small>Total fare for the selected passengers</small>
          </div>

          <div className="discovery-field">
            <label htmlFor="discovery-date">Specific departure date <small>Optional</small></label>
            <input id="discovery-date" type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>

          <button type="button" className="button button-primary discovery-cta" onClick={buildWatch}>
            Create watch
          </button>
        </div>
      </div>
    </section>
  );
}
