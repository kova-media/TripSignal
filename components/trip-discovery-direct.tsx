'use client';

import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TripDiscovery from '@/components/trip-discovery';
import styles from './trip-discovery-direct.module.css';

type DiscoveryDirectProps = {
  children?: ReactNode;
  accountEmail?: string | null;
};

function valueOf(root: HTMLElement, id: string) {
  const element = root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  return element?.value.trim() ?? '';
}

function selectedCabin(root: HTMLElement) {
  const active = root.querySelector<HTMLButtonElement>('.discovery-cabin-options button.active');
  return active?.textContent?.trim() ?? 'Premium economy';
}

function selectedDestinationMode(root: HTMLElement) {
  const fields = Array.from(root.querySelectorAll<HTMLElement>('.discovery-field'));
  const whereField = fields.find((field) => field.querySelector('label')?.textContent?.trim() === 'Where');
  const active = whereField?.querySelector<HTMLButtonElement>('.discovery-options button.active');
  return active?.textContent?.trim() === 'Region' ? 'region' : 'airport';
}

function airportCode(inputValue: string) {
  const match = inputValue.match(/\(([A-Za-z]{3})\)$/);
  return match?.[1]?.toUpperCase() ?? '';
}

function cabinParam(cabin: string) {
  if (cabin === 'Premium economy') return 'premium_economy';
  if (cabin === 'First class') return 'first';
  return cabin.toLowerCase();
}

export default function TripDiscoveryDirect({ children, accountEmail }: DiscoveryDirectProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
    return () => {
      cancelAnimationFrame(firstFrame);
      window.clearTimeout(timer);
    };
  }, [accountEmail]);

  async function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button.discovery-cta');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    if (submitting) return;

    const root = event.currentTarget;
    const origin = airportCode(valueOf(root, 'airport-from'));
    const destinationMode = selectedDestinationMode(root) as 'region' | 'airport';
    const destinationInput = valueOf(root, 'airport-destination');
    const destination = destinationMode === 'region' ? valueOf(root, 'discovery-region') : airportCode(destinationInput);
    const specificDate = valueOf(root, 'discovery-date');
    const dateRange = specificDate ? 'Custom dates' : valueOf(root, 'discovery-window');
    const email = accountEmail ?? valueOf(root, 'discovery-email');
    const cabin = selectedCabin(root);
    const payload = {
      origin,
      destinationMode,
      destination,
      maxPrice: Number(valueOf(root, 'discovery-budget')),
      airlineMode: valueOf(root, 'discovery-airline'),
      maxStops: valueOf(root, 'discovery-stops'),
      tripLength: valueOf(root, 'discovery-trip-length'),
      dateRange,
      ...(specificDate ? { dateStart: specificDate, dateEnd: specificDate } : {}),
      frequency: valueOf(root, 'discovery-frequency'),
      cabin: cabinParam(cabin),
      passengers: Number(valueOf(root, 'discovery-passengers')),
      email,
    };

    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create alert.');
      setSuccess(data.signInEmailSent
        ? 'Alert created. Check your email for your TripSignal sign-in link.'
        : 'Alert created. TripSignal is now watching this fare.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create alert.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${styles.wrapper}${accountEmail ? ' account-bound' : ''}`} data-trip-discovery-direct onClickCapture={handleClick} aria-busy={submitting}>
      <TripDiscovery />
      {success && <p className={`${styles.message} discovery-direct-success`} role="status">{success}</p>}
      {error && <p className={`${styles.message} ${styles.error} discovery-direct-error`} role="alert">{error}</p>}
      {submitting && <p className={`${styles.message} ${styles.status} discovery-direct-status`} role="status">Creating your alert…</p>}
      {children}
    </div>
  );
}
