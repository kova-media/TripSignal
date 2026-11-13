'use client';

import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import TripDiscovery from '@/components/trip-discovery';
import DestinationChooser from '@/components/destination-chooser';
import FarePreview from '@/components/fare-preview';
import styles from './trip-discovery-direct.module.css';

type DiscoveryDirectProps = { children?: ReactNode; accountEmail?: string | null };
type DestinationMode = 'country' | 'airport' | 'region';
type TripType = 'round-trip' | 'one-way';

// Keep in sync with REGION_AIRPORTS in lib/flights/provider.ts (that
// module pulls in the server-only flight client, so the list is mirrored
// here rather than imported).
const REGIONS = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Middle East', 'Oceania'];

function valueOf(root: HTMLElement, id: string) { const element = root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`); return element?.value.trim() ?? ''; }
function selectedCabin(root: HTMLElement) { const active = root.querySelector<HTMLButtonElement>('.discovery-cabin-options button.active'); return active?.textContent?.trim() ?? 'Premium economy'; }
function airportCode(inputValue: string) { const match = inputValue.match(/\(([A-Za-z]{3})\)$/); return match?.[1]?.toUpperCase() ?? ''; }
function cabinParam(cabin: string) { if (cabin === 'Premium economy') return 'premium_economy'; if (cabin === 'First class') return 'first'; return cabin.toLowerCase(); }

export default function TripDiscoveryDirect({ children, accountEmail }: DiscoveryDirectProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('airport');
  const [region, setRegion] = useState(REGIONS[0]!);
  const [tripType, setTripType] = useState<TripType>('round-trip');
  const [controlsHost, setControlsHost] = useState<HTMLElement | null>(null);

  // When a region is chosen the airport/country chooser above is hidden so
  // the two destination inputs cannot contradict each other.
  useEffect(() => {
    const syncChooser = () => {
      const chooser = document.querySelector<HTMLElement>('.destination-chooser-root');
      if (chooser) chooser.style.display = destinationMode === 'region' ? 'none' : '';
    };
    syncChooser();
    const timer = window.setTimeout(syncChooser, 100);
    return () => window.clearTimeout(timer);
  }, [destinationMode]);

  useEffect(() => {
    if (!accountEmail) return;
    const syncAccountEmail = () => {
      const input = document.querySelector<HTMLInputElement>('#discovery-email');
      const button = document.querySelector<HTMLButtonElement>('.discovery-cta');
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, accountEmail);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (button) button.disabled = false;
    };
    const firstFrame = requestAnimationFrame(syncAccountEmail);
    const timer = window.setTimeout(syncAccountEmail, 100);
    return () => { cancelAnimationFrame(firstFrame); window.clearTimeout(timer); };
  }, [accountEmail]);

  useEffect(() => {
    const findControls = () => {
      const host = document.querySelector<HTMLElement>('[data-trip-discovery-direct] .discovery-controls');
      if (host) setControlsHost(host);
    };
    const firstFrame = requestAnimationFrame(findControls);
    const timer = window.setTimeout(findControls, 50);
    return () => { cancelAnimationFrame(firstFrame); window.clearTimeout(timer); };
  }, []);

  async function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button.discovery-cta');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    if (submitting) return;
    const root = event.currentTarget;
    const origin = airportCode(valueOf(root, 'airport-from'));
    const destinationInput = valueOf(root, 'airport-destination');
    const countryCode = valueOf(root, 'discovery-country-code');
    const destination = destinationMode === 'region' ? region : destinationMode === 'country' ? countryCode : airportCode(destinationInput);
    const specificDate = valueOf(root, 'discovery-date');
    const dateRange = specificDate ? 'Custom dates' : valueOf(root, 'discovery-window');
    const email = accountEmail ?? valueOf(root, 'discovery-email');
    const cabin = selectedCabin(root);
    const payload = { origin, destinationMode, destination, tripType, maxPrice: Number(valueOf(root, 'discovery-budget')), airlineMode: valueOf(root, 'discovery-airline'), maxStops: valueOf(root, 'discovery-stops'), tripLength: valueOf(root, 'discovery-trip-length'), dateRange, ...(specificDate ? { dateStart: specificDate, dateEnd: specificDate } : {}), frequency: valueOf(root, 'discovery-frequency'), cabin: cabinParam(cabin), passengers: Number(valueOf(root, 'discovery-passengers')), email };
    setSubmitting(true); setSuccess(''); setError('');
    try {
      const response = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create alert.');
      // Surface the API warning (confirmation email or initial search
      // failed) instead of reporting plain success regardless.
      let message = data.pendingVerification
        ? 'Alert created. Check your email for your TripSignal sign-in link — your alert activates once you sign in.'
        : data.signInEmailSent ? 'Alert created. Check your email for your TripSignal sign-in link.' : 'Alert created. TripSignal is now watching this fare.';
      if (data.warning) message += ` Warning: ${data.warning}`;
      setSuccess(message);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create alert.'); }
    finally { setSubmitting(false); }
  }

  const tripTypeSelector = (
    <div className={styles.tripType} role="group" aria-label="Flight type">
      <span>Flight type</span>
      <div className={styles.tripTypeOptions}>
        <button type="button" data-flight-type="round-trip" className={tripType === 'round-trip' ? styles.tripTypeActive : ''} onClick={() => setTripType('round-trip')}>Round trip</button>
        <button type="button" data-flight-type="one-way" className={tripType === 'one-way' ? styles.tripTypeActive : ''} onClick={() => setTripType('one-way')}>One way</button>
      </div>
    </div>
  );

  const regionSelector = (
    <div className={styles.tripType} role="group" aria-label="Destination region">
      <span>Destination region</span>
      <select
        aria-label="Destination region"
        value={destinationMode === 'region' ? region : ''}
        onChange={(event) => {
          const value = event.target.value;
          if (!value) { setDestinationMode('airport'); return; }
          setRegion(value);
          setDestinationMode('region');
        }}
        style={{ minHeight: 48, width: '100%', border: '1px solid var(--line-strong)', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', padding: '0 14px', font: 'inherit', fontSize: 14, fontWeight: 600 }}
      >
        <option value="">No region — use airport or country above</option>
        {REGIONS.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  );

  return (
    <div className={`${styles.wrapper}${accountEmail ? ' account-bound' : ''}${tripType === 'one-way' ? ` ${styles.oneWay}` : ''}`} data-trip-discovery-direct onClickCapture={handleClick} aria-busy={submitting}>
      <TripDiscovery />
      {controlsHost && createPortal(<>{tripTypeSelector}{regionSelector}</>, controlsHost)}
      <DestinationChooser onModeChange={setDestinationMode} />
      <FarePreview />
      {success && <p className={`${styles.message} discovery-direct-success`} role="status">{success}</p>}
      {error && <p className={`${styles.message} ${styles.error} discovery-direct-error`} role="alert">{error}</p>}
      {submitting && <p className={`${styles.message} ${styles.status} discovery-direct-status`} role="status">Creating your alert…</p>}
      {children}
    </div>
  );
}
