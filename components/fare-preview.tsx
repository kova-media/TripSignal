'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './fare-preview.module.css';

type Preview = {
  available: boolean;
  lowest?: number;
  median?: number;
  recentLowest?: number;
  observations?: number;
  lastObservedAt?: string;
  currency?: string;
};

function read(root: HTMLElement, id: string) {
  return root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value.trim() ?? '';
}

function airportCode(value: string) {
  return value.match(/\(([A-Za-z]{3})\)$/)?.[1]?.toUpperCase() ?? '';
}

function cabin(root: HTMLElement) {
  const active = root.querySelector<HTMLButtonElement>('.discovery-cabin-options button.active');
  const value = active?.textContent?.trim() ?? 'Premium economy';
  if (value === 'Premium economy') return 'premium_economy';
  if (value === 'First class') return 'first';
  return value.toLowerCase();
}

export default function FarePreview() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-trip-discovery-direct]');
    if (!root) return;

    let timer = 0;
    let controller: AbortController | null = null;

    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const origin = airportCode(read(root, 'airport-from'));
        const destinationMode = root.querySelector<HTMLButtonElement>('[data-destination-mode="country"].active') ? 'country' : 'airport';
        const destination = destinationMode === 'country' ? read(root, 'discovery-country-code').toUpperCase() : airportCode(read(root, 'airport-destination'));
        if (!origin || !destination) {
          setPreview(null);
          return;
        }

        const params = new URLSearchParams({
          origin,
          destination,
          destinationMode,
          tripType: root.querySelector<HTMLButtonElement>('[data-flight-type="one-way"].active') ? 'one-way' : 'round-trip',
          cabin: cabin(root),
          maxStops: read(root, 'discovery-stops'),
          passengers: read(root, 'discovery-passengers'),
          airlineMode: read(root, 'discovery-airline'),
          tripLength: read(root, 'discovery-trip-length'),
        });

        controller?.abort();
        controller = new AbortController();
        setLoading(true);
        try {
          const response = await fetch(`/api/fare-preview?${params.toString()}`, { signal: controller.signal, cache: 'no-store' });
          const data = (await response.json()) as Preview;
          if (!controller.signal.aborted) setPreview(data.available ? data : null);
        } catch {
          if (!controller.signal.aborted) setPreview(null);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, 250);
    };

    root.addEventListener('input', update);
    root.addEventListener('change', update);
    root.addEventListener('click', update);
    update();
    return () => {
      window.clearTimeout(timer);
      controller?.abort();
      root.removeEventListener('input', update);
      root.removeEventListener('change', update);
      root.removeEventListener('click', update);
    };
  }, []);

  const money = (value?: number) => value == null ? '—' : `$${Math.round(value).toLocaleString()}`;
  const observed = useMemo(() => {
    if (!preview?.lastObservedAt) return '';
    const date = new Date(preview.lastObservedAt);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [preview?.lastObservedAt]);

  if (!preview && !loading) return null;

  return (
    <section className={styles.preview} aria-live="polite">
      <div className={styles.heading}>
        <div>
          <span className={styles.kicker}>FARE HISTORY</span>
          <h3>What TripSignal has seen</h3>
        </div>
        {loading && <span className={styles.loading}>Updating</span>}
      </div>
      {preview ? (
        <div className={styles.stats}>
          <div><span>Lowest observed</span><strong>{money(preview.lowest)}</strong><small>{preview.observations?.toLocaleString()} observations</small></div>
          <div><span>90-day low</span><strong>{money(preview.recentLowest)}</strong><small>{observed ? `Last seen ${observed}` : 'Recent route data'}</small></div>
          <div><span>Typical observed</span><strong>{money(preview.median)}</strong><small>Median of recorded fares</small></div>
        </div>
      ) : (
        <p className={styles.empty}>Checking TripSignal's fare history for this route…</p>
      )}
      {preview && <p className={styles.note}>Based on fares TripSignal has actually observed for matching watches. Historical prices are not a guarantee of future fares.</p>}
    </section>
  );
}
