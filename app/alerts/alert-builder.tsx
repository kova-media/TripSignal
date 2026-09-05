'use client';

import { FormEvent, useMemo, useState } from 'react';
import ThemeToggle from '@/components/theme-toggle';

type Destination = 'Europe' | 'North America' | 'Asia' | 'Anywhere';
type Frequency = 'Weekly' | 'Monthly';

const destinations: Destination[] = ['Europe', 'North America', 'Asia', 'Anywhere'];
const frequencies: Frequency[] = ['Weekly', 'Monthly'];

export default function AlertBuilder() {
  const [origin, setOrigin] = useState('MCI');
  const [destination, setDestination] = useState<Destination>('Europe');
  const [price, setPrice] = useState('500');
  const [airlineMode, setAirlineMode] = useState('Delta + SkyTeam');
  const [stops, setStops] = useState('1');
  const [tripLength, setTripLength] = useState('1–3 weeks');
  const [dateRange, setDateRange] = useState('Next 12 months');
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [saved, setSaved] = useState(false);

  const summary = useMemo(() => `${origin || 'MCI'} → ${destination} · Economy · under $${Number(price || 0).toLocaleString()} · ${frequency}`, [origin, destination, price, frequency]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <main className="builder-page">
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="TripSignal home"><span className="brand-mark" aria-hidden="true"><i /></span>TripSignal</a>
        <div className="nav-actions"><a className="text-link" href="/">Back to home</a><ThemeToggle /></div>
      </nav>

      <section className="builder shell">
        <div className="builder-intro">
          <p className="eyebrow">CREATE A FLIGHT ALERT</p>
          <h1>Define the trip.<br /><em>We’ll watch the fare.</em></h1>
          <p>Set the rules once. TripSignal uses them to identify qualifying opportunities. You can change them later.</p>
        </div>

        <form className="builder-grid" onSubmit={submit}>
          <div className="builder-form">
            <section className="form-section">
              <div className="form-heading"><span>01</span><div><h2>Where are you going?</h2><p>Start with your origin and the kind of destination you want.</p></div></div>
              <label><span>Origin airport</span><input value={origin} onChange={(event) => setOrigin(event.target.value.toUpperCase())} placeholder="MCI" maxLength={4} /><small>Use an airport code, such as MCI.</small></label>
              <fieldset><legend>Destination</legend><div className="option-grid">{destinations.map((item) => <button type="button" key={item} className={destination === item ? 'option active' : 'option'} onClick={() => setDestination(item)}>{item}</button>)}</div></fieldset>
            </section>

            <section className="form-section">
              <div className="form-heading"><span>02</span><div><h2>What does a good fare look like?</h2><p>Tell us how much you want to spend and who you are willing to fly.</p></div></div>
              <label><span>Maximum round-trip price</span><div className="input-prefix"><b>$</b><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ''))} /></div><small>Only fares strictly below this amount will qualify.</small></label>
              <fieldset><legend>Airlines</legend><div className="select-row"><button type="button" className={airlineMode === 'Any airline' ? 'option active' : 'option'} onClick={() => setAirlineMode('Any airline')}>Any airline</button><button type="button" className={airlineMode === 'Delta + SkyTeam' ? 'option active' : 'option'} onClick={() => setAirlineMode('Delta + SkyTeam')}>Delta + SkyTeam</button></div></fieldset>
              <div className="two-col"><label><span>Maximum stops</span><select value={stops} onChange={(event) => setStops(event.target.value)}><option value="0">Nonstop</option><option value="1">1 stop</option><option value="2">2 stops</option><option value="any">Any</option></select></label><label><span>Trip length</span><select value={tripLength} onChange={(event) => setTripLength(event.target.value)}><option>3–7 days</option><option>1–2 weeks</option><option>1–3 weeks</option><option>1–4 weeks</option></select></label></div>
            </section>

            <section className="form-section">
              <div className="form-heading"><span>03</span><div><h2>When should we look?</h2><p>Give TripSignal a window and a rhythm. We handle the combinations.</p></div></div>
              <div className="two-col"><label><span>Travel window</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Anytime</option><option>Next 3 months</option><option>Next 6 months</option><option>Next 12 months</option></select></label><label><span>Search frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}>{frequencies.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            </section>

            <button className="button button-primary builder-submit" type="submit">Save flight alert <span>↗</span></button>
          </div>

          <aside className="builder-summary">
            <div className="summary-label"><span>YOUR ALERT</span><i>PREVIEW</i></div>
            <h2>{summary}</h2>
            <div className="summary-list"><div><span>FROM</span><strong>{origin || 'MCI'}</strong></div><div><span>TO</span><strong>{destination}</strong></div><div><span>PRICE</span><strong>Under ${Number(price || 0).toLocaleString()}</strong></div><div><span>AIRLINES</span><strong>{airlineMode}</strong></div><div><span>STOPS</span><strong>{stops === 'any' ? 'Any' : stops === '0' ? 'Nonstop' : `${stops} stop`}</strong></div><div><span>TRIP</span><strong>{tripLength}</strong></div><div><span>WINDOW</span><strong>{dateRange}</strong></div><div><span>FREQUENCY</span><strong>{frequency}</strong></div></div>
            <div className="summary-note"><span className="summary-check">✓</span><p>We’ll only surface fares that match the rules you set.</p></div>
            {saved && <div className="saved-state"><strong>Alert saved</strong><span>This prototype stores the alert locally. Flight-data connection is the next backend milestone.</span></div>}
          </aside>
        </form>
      </section>
    </main>
  );
}
