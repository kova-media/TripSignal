'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './lounge-guide.module.css';

type AirportContext = {
  airport: string;
  context: 'departure' | 'layover' | 'arrival';
  segmentIndex?: number;
  arrival?: string;
  departure?: string;
  directories: Array<{ name: string; description: string; url: string }>;
};

type Lounge = {
  id: string;
  airport: string;
  name: string;
  terminal: string | null;
  location: string | null;
  airside: boolean | null;
  accessMethods: string[];
  membershipRequired: boolean | null;
  dayPassPrice: string | null;
  hourlyPrice: string | null;
  maxStay: string | null;
  amenities: string[];
  guestPolicy: string | null;
  hours: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
};

export default function LoungeGuide({ alertId }: { alertId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [airports, setAirports] = useState<AirportContext[]>([]);
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [itineraryFound, setItineraryFound] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    fetch(`/api/alerts/${alertId}/lounges`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load lounge guide.')))
      .then((data) => {
        setAirports(Array.isArray(data.airports) ? data.airports : []);
        setLounges(Array.isArray(data.lounges) ? data.lounges : []);
        setItineraryFound(Boolean(data.itineraryFound));
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, [alertId, loaded, open]);

  const grouped = useMemo(() => airports.map((airport) => ({
    ...airport,
    records: lounges.filter((lounge) => lounge.airport === airport.airport),
  })), [airports, lounges]);

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>Lounge guide</span>
        <span className={styles.toggleMeta}>{open ? 'Hide' : 'View lounges'}</span>
      </button>
      {open && (
        <div className={styles.panel}>
          {loading && <p className={styles.muted}>Loading lounge information…</p>}
          {!loading && !itineraryFound && <div className={styles.empty}><strong>No itinerary yet.</strong><p>TripSignal will show departure and layover lounges once it has an actual flight itinerary to work from.</p></div>}
          {!loading && itineraryFound && grouped.length === 0 && <div className={styles.empty}><strong>No airport segments found.</strong><p>The latest fare observation did not include usable airport segment data.</p></div>}
          {!loading && grouped.map((airport) => (
            <section className={styles.airport} key={`${airport.airport}-${airport.context}-${airport.segmentIndex ?? ''}`}>
              <div className={styles.airportHead}>
                <div><span className={styles.context}>{airport.context}</span><strong>{airport.airport}</strong></div>
                {airport.context === 'layover' && airport.arrival && airport.departure && <span className={styles.connection}>{formatTimeRange(airport.arrival, airport.departure)}</span>}
              </div>
              {airport.records.length > 0 ? airport.records.map((lounge) => (
                <article className={styles.lounge} key={lounge.id}>
                  <div className={styles.loungeTitle}><strong>{lounge.name}</strong>{lounge.terminal && <span>{lounge.terminal}</span>}</div>
                  <div className={styles.facts}>
                    {lounge.membershipRequired != null && <span>{lounge.membershipRequired ? 'Membership required' : 'No membership required'}</span>}
                    {lounge.dayPassPrice && <span>Day pass {lounge.dayPassPrice}</span>}
                    {lounge.hourlyPrice && <span>Hourly {lounge.hourlyPrice}</span>}
                    {lounge.maxStay && <span>Up to {lounge.maxStay}</span>}
                    {lounge.airside != null && <span>{lounge.airside ? 'Airside' : 'Landside'}</span>}
                  </div>
                  {lounge.amenities.length > 0 && <p className={styles.amenities}>{lounge.amenities.join(' · ')}</p>}
                  {lounge.hours && <p className={styles.detail}>Hours: {lounge.hours}</p>}
                  {lounge.guestPolicy && <p className={styles.detail}>Guests: {lounge.guestPolicy}</p>}
                  {lounge.sourceUrl && <a href={lounge.sourceUrl} target="_blank" rel="noreferrer" className={styles.source}>Verify current details</a>}
                </article>
              )) : (
                <div className={styles.directoryBox}>
                  <p>No TripSignal lounge records for this airport yet.</p>
                  <div>{airport.directories.map((directory) => <a key={directory.name} href={directory.url} target="_blank" rel="noreferrer">{directory.name}</a>)}</div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeRange(arrival: string, departure: string) {
  const a = new Date(arrival);
  const d = new Date(departure);
  if (Number.isNaN(a.getTime()) || Number.isNaN(d.getTime())) return 'Layover';
  const minutes = Math.max(0, Math.round((d.getTime() - a.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m layover`;
}
