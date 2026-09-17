'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './fare-preview.module.css';

type Preview = {
  available: boolean;
  lowest?: number;
  highest?: number;
  median?: number;
  recentLowest?: number;
  observations?: number;
  lastObservedAt?: string;
  matchLevel?: 'matching' | 'route' | null;
  target?: number | null;
  targetDelta?: number | null;
  targetPercent?: number | null;
  intelligence?: { commonStops: number; commonStopsShare: number } | null;
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

function activeButton(root: HTMLElement, text: string) {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button')).some((button) => button.textContent?.trim() === text && button.classList.contains('active'));
}

export default function FarePreview() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRoute, setHasRoute] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-trip-discovery-direct]');
    const button = root?.querySelector<HTMLElement>('.discovery-cta');
    if (!root || !button?.parentElement) return;
    const existing = root.querySelector<HTMLElement>('.fare-preview-host');
    if (existing) { setHost(existing); return; }
    const element = document.createElement('div');
    element.className = 'fare-preview-host';
    button.parentElement.insertBefore(element, button);
    setHost(element);
    return () => element.remove();
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-trip-discovery-direct]');
    if (!root) return;
    let timer = 0;
    let controller: AbortController | null = null;

    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const origin = airportCode(read(root, 'airport-from'));
        const countryCode = read(root, 'discovery-country-code').toUpperCase();
        const destinationMode = countryCode ? 'country' : 'airport';
        const destination = destinationMode === 'country' ? countryCode : airportCode(read(root, 'airport-destination'));
        const routeSelected = Boolean(origin && destination);
        setHasRoute(routeSelected);
        if (!routeSelected) { controller?.abort(); setPreview(null); setLoading(false); return; }

        const params = new URLSearchParams({
          origin,
          destination,
          destinationMode,
          tripType: activeButton(root, 'One way') ? 'one-way' : 'round-trip',
          cabin: cabin(root),
          maxStops: read(root, 'discovery-stops'),
          passengers: read(root, 'discovery-passengers'),
          airlineMode: read(root, 'discovery-airline'),
          tripLength: read(root, 'discovery-trip-length'),
          target: read(root, 'discovery-budget'),
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
      }, 400);
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

  const money = (value?: number | null) => value == null ? '—' : `$${Math.round(value).toLocaleString()}`;
  const observed = useMemo(() => {
    if (!preview?.lastObservedAt) return '';
    const date = new Date(preview.lastObservedAt);
    if (Number.isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [preview?.lastObservedAt]);

  if (!host || !hasRoute) return null;

  const target = preview?.target;
  const targetDelta = preview?.targetDelta;
  const targetText = targetDelta == null ? '' : targetDelta >= 0
    ? `${money(targetDelta)} above typical`
    : `${money(Math.abs(targetDelta))} below typical`;

  return createPortal(
    <section className={styles.preview} aria-live="polite">
      <div className={styles.heading}>
        <div>
          <span className={styles.kicker}>FARE HISTORY</span>
          <h3>What TripSignal has seen</h3>
        </div>
        <div className={styles.headingMeta}>{loading && <span className={styles.loading}>Checking</span>}{observed && !loading && <span className={styles.freshness}>Last seen {observed}</span>}</div>
      </div>
      {preview?.available ? (
        <>
          <div className={styles.range}>
            <div><span>Historical range</span><strong>{money(preview.lowest)} <i>to</i> {money(preview.highest)}</strong></div>
            {target != null && <div><span>Your target</span><strong>{money(target)}</strong><small>{targetText}</small></div>}
          </div>
          <div className={styles.stats}>
            <div><span>{preview.matchLevel === 'route' ? 'Route low' : 'Lowest observed'}</span><strong>{money(preview.lowest)}</strong><small>{preview.observations?.toLocaleString()} observations</small></div>
            <div><span>90-day low</span><strong>{money(preview.recentLowest)}</strong><small>Recent route data</small></div>
            <div><span>Typical fare</span><strong>{money(preview.median)}</strong><small>Median of recorded fares</small></div>
          </div>
          {preview.targetPercent != null && <div className={styles.targetBar} aria-label="Target compared with typical fare"><div><span>Target vs. typical</span><strong>{preview.targetPercent >= 0 ? `${preview.targetPercent}% above` : `${Math.abs(preview.targetPercent)}% below`}</strong></div><div className={styles.bar}><span style={{ width: `${Math.max(0, Math.min(100, 50 + preview.targetPercent / 2))}%` }} /></div></div>}
          {preview.intelligence && <p className={styles.intelligence}>In recorded searches, {preview.intelligence.commonStops === 0 ? 'nonstop' : `${preview.intelligence.commonStops}-stop`} fares made up {preview.intelligence.commonStopsShare}% of observations.</p>}
          <p className={styles.note}>{preview.matchLevel === 'route' ? 'Route history across recorded fare searches. It may include different cabin or trip settings.' : 'Based on fares TripSignal has actually observed. Historical prices are not a guarantee of future fares.'}</p>
        </>
      ) : (
        <p className={styles.empty}>{loading ? 'Checking current fares and route history…' : 'TripSignal has not observed this route yet.'}</p>
      )}
    </section>,
    host,
  );
}
