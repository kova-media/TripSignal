'use client';

import { FormEvent, useEffect, useState } from 'react';
import SiteHeader from '@/components/site-header';

type Cabin = 'economy' | 'premium_economy' | 'business' | 'first';
const cabins: Array<[Cabin, string]> = [['economy','Economy'],['premium_economy','Premium economy'],['business','Business'],['first','First class']];
const regions = ['Europe','North America','South America','Asia','Africa','Middle East','Oceania'];
const airlines = [['all','All airlines'],['DL','Delta Air Lines'],['AF','Air France'],['KL','KLM'],['VS','Virgin Atlantic'],['KE','Korean Air'],['AM','Aeromexico'],['AZ','ITA Airways'],['LH','Lufthansa'],['UA','United Airlines'],['AA','American Airlines'],['IB','Iberia'],['TP','TAP Air Portugal'],['SK','SAS'],['AY','Finnair'],['TK','Turkish Airlines']];

export default function EditAlert({ id }: { id: string }) {
  const [criteria, setCriteria] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { (async () => { const r = await fetch(`/api/alerts/${id}`); const d = await r.json(); if (!r.ok) setError(d.error || 'Could not load alert.'); else { setCriteria(d.alert.criteria); setEmail(d.alert.email); } })(); }, [id]);

  function update(key: string, value: unknown) { setCriteria((current: any) => ({ ...current, [key]: value })); }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const r = await fetch(`/api/alerts/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...criteria, email}) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not save changes.');
      setCriteria(d.alert.criteria); setMessage('Alert updated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes.'); } finally { setSaving(false); }
  }

  if (!criteria && !error) return <main className="builder-page"><SiteHeader backHref="/profile" backLabel="Back to profile" /><section className="builder shell"><p>Loading alert…</p></section></main>;
  if (!criteria) return <main className="builder-page"><SiteHeader backHref="/profile" backLabel="Back to profile" /><section className="builder shell"><p>{error}</p></section></main>;

  const custom = criteria.dateRange === 'Custom dates';
  return <main className="builder-page">
    <SiteHeader backHref="/profile" backLabel="Back to profile" />
    <section className="builder shell">
      <div className="builder-intro"><h1>Edit your alert.<br /><em>Change the rules anytime.</em></h1><p>Update the route, dates, cabin, fare target, or any other search criteria.</p></div>
      <form className="builder-grid" onSubmit={save}><div className="builder-form">
        <section className="form-section"><div className="form-heading"><div><h2>Trip</h2><p>Change the route or destination.</p></div></div>
          <label><span>Origin airport</span><input value={criteria.origin || ''} onChange={e=>update('origin',e.target.value.toUpperCase())} maxLength={3} required /><small>Use the three-letter airport code.</small></label>
          <label><span>Destination type</span><select value={criteria.destinationMode || 'airport'} onChange={e=>update('destinationMode',e.target.value)}><option value="airport">Specific airport</option><option value="region">General location</option></select></label>
          {criteria.destinationMode === 'region' ? <label><span>Region</span><select value={criteria.destination || 'Europe'} onChange={e=>update('destination',e.target.value)}>{regions.map(r=><option key={r}>{r}</option>)}</select></label> : <label><span>Destination airport</span><input value={criteria.destination || ''} onChange={e=>update('destination',e.target.value.toUpperCase())} maxLength={3} required /><small>Use the three-letter airport code.</small></label>}
        </section>
        <section className="form-section"><div className="form-heading"><div><h2>Fare</h2><p>Change what counts as a qualifying fare.</p></div></div>
          <label><span>Maximum round-trip price</span><div className="input-prefix"><b>$</b><input inputMode="numeric" value={criteria.maxPrice ?? ''} onChange={e=>update('maxPrice',Number(e.target.value.replace(/[^0-9]/g,'')))} required /></div></label>
          <fieldset><legend>Cabin</legend><div className="select-row">{cabins.map(([value,label])=><button type="button" key={value} className={`option ${criteria.cabin===value?'active':''}`} onClick={()=>update('cabin',value)}>{label}</button>)}</div></fieldset>
          <label><span>Airline</span><select value={criteria.airlineMode || 'all'} onChange={e=>update('airlineMode',e.target.value)}>{airlines.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
          <div className="two-col"><label><span>Maximum stops</span><select value={criteria.maxStops || '1'} onChange={e=>update('maxStops',e.target.value)}><option value="0">Nonstop</option><option value="1">1 stop</option><option value="2">2 stops</option><option value="any">Any</option></select></label><label><span>Trip length</span><select value={criteria.tripLength || '1–3 weeks'} onChange={e=>update('tripLength',e.target.value)}><option>3–7 days</option><option>1–2 weeks</option><option>1–3 weeks</option><option>1–4 weeks</option></select></label></div>
        </section>
        <section className="form-section"><div className="form-heading"><div><h2>Dates and alerts</h2><p>Change when TripSignal searches and how often it checks.</p></div></div>
          <div className="two-col"><label><span>Travel window</span><select value={criteria.dateRange || 'Next 12 months'} onChange={e=>update('dateRange',e.target.value)}><option>Anytime</option><option>Next 3 months</option><option>Next 6 months</option><option>Next 12 months</option><option>Custom dates</option></select></label><label><span>Search frequency</span><select value={criteria.frequency || 'Weekly'} onChange={e=>update('frequency',e.target.value)}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label></div>
          {custom && <div className="two-col"><label><span>Start date</span><input type="date" value={criteria.dateStart || ''} min={new Date().toISOString().slice(0,10)} onChange={e=>update('dateStart',e.target.value)} required /></label><label><span>End date</span><input type="date" value={criteria.dateEnd || ''} min={criteria.dateStart || new Date().toISOString().slice(0,10)} onChange={e=>update('dateEnd',e.target.value)} required /></label></div>}
          <label><span>Passengers</span><select value={criteria.passengers || 1} onChange={e=>update('passengers',Number(e.target.value))}>{Array.from({length:9},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} passenger{n===1?'':'s'}</option>)}</select></label>
          <label><span>Alert email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        </section>
        {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div></form>
    </section>
  </main>;
}
