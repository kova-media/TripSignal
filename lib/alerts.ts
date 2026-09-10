import type { FlightOffer, FlightSearchCriteria } from './flights/types';
import { getFlightProvider } from './flights/provider';
import { getDb } from './db';
import { sendFareSignalEmail } from './email';

type AlertCriteria = {
  origin: string;
  destinationMode: 'region' | 'airport';
  destination: string;
  maxPrice: number;
  airlineMode: string;
  maxStops: string;
  tripLength: string;
  dateRange: string;
  dateStart?: string;
  dateEnd?: string;
  frequency: 'Weekly' | 'Monthly';
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  passengers?: number;
};

function tripDays(value: string): [number, number] {
  switch (value) {
    case '3–7 days': return [3, 7];
    case '1–2 weeks': return [7, 14];
    case '1–4 weeks': return [7, 28];
    default: return [7, 21];
  }
}

function windowDays(value: string) {
  switch (value) {
    case 'Next 3 months': return 90;
    case 'Next 6 months': return 180;
    case 'Next 12 months': return 365;
    default: return 90;
  }
}

function dateRangeBounds(alert: AlertCriteria): [string, string] {
  if (alert.dateStart && alert.dateEnd) return [alert.dateStart, alert.dateEnd];
  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + windowDays(alert.dateRange));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

function nextDepartureDate(alert: AlertCriteria, salt = 0) {
  const [startValue, endValue] = dateRangeBounds(alert);
  const start = new Date(`${startValue}T00:00:00Z`);
  const end = new Date(`${endValue}T00:00:00Z`);
  const spanDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const sampleCount = alert.destinationMode === 'airport' ? 4 : 2;
  const index = salt % sampleCount;
  const offset = Math.round((spanDays * index) / (sampleCount - 1));
  start.setUTCDate(start.getUTCDate() + offset);
  return start.toISOString().slice(0, 10);
}

function buildCriteria(alert: AlertCriteria, salt = 0): FlightSearchCriteria {
  const [minTripDays, maxTripDays] = tripDays(alert.tripLength);
  const departureStart = nextDepartureDate(alert, salt);
  const [, windowEnd] = dateRangeBounds(alert);
  const allAirlines = alert.airlineMode.toLowerCase() === 'all';
  return {
    origin: alert.origin,
    destination: alert.destinationMode === 'airport'
      ? { type: 'airport', value: alert.destination.toUpperCase() }
      : { type: 'region', value: alert.destination },
    maxPrice: alert.maxPrice,
    cabin: alert.cabin,
    airlines: allAirlines ? [] : [alert.airlineMode.toUpperCase()],
    maxStops: alert.maxStops === 'any' ? null : Number(alert.maxStops),
    minTripDays,
    maxTripDays,
    departureStart,
    departureEnd: windowEnd,
    passengers: alert.passengers ?? 1,
  };
}

export function summarizeAlert(alert: AlertCriteria) {
  const destination = alert.destinationMode === 'airport' ? alert.destination.toUpperCase() : alert.destination;
  const cabin = alert.cabin === 'premium_economy' ? 'Premium economy' : alert.cabin === 'business' ? 'Business' : alert.cabin === 'first' ? 'First class' : 'Economy';
  return `${alert.origin} → ${destination} · ${cabin} · under $${alert.maxPrice.toLocaleString()} · ${alert.dateRange} · ${alert.frequency}`;
}

export async function runAlertSearch(alertId: string, email: string, criteria: AlertCriteria) {
  const db = getDb();
  const runInserted = await db.query<{ id: string }>(
    'insert into alert_runs (alert_id, status) values ($1, $2) returning id',
    [alertId, 'running'],
  );
  const runId = runInserted.rows[0]?.id;

  try {
    const provider = getFlightProvider();
    const searchCount = criteria.destinationMode === 'airport' ? 4 : 2;
    const results: FlightOffer[] = [];
    for (let i = 0; i < searchCount; i += 1) {
      const offers = await provider.search(buildCriteria(criteria, i));
      results.push(...offers);
    }

    const qualifying = results
      .filter((offer) => offer.price < criteria.maxPrice)
      .sort((a, b) => a.price - b.price)
      .filter((offer, index, array) => index === array.findIndex((candidate) => candidate.id === offer.id))
      .slice(0, 10);

    await db.query('update alerts set last_checked_at = now() where id = $1', [alertId]);
    if (qualifying.length === 0) {
      if (runId) await db.query('update alert_runs set status = $1, finished_at = now(), offers_found = $2 where id = $3', ['success', 0, runId]);
      return { offers: [], emailed: false };
    }

    const ids = qualifying.map((offer) => offer.id);
    const existing = await db.query<{ offer_id: string }>('select offer_id from signals where alert_id = $1 and offer_id = any($2::text[])', [alertId, ids]);
    const sentIds = new Set(existing.rows.map((row) => row.offer_id));
    const newOffers = qualifying.filter((offer) => !sentIds.has(offer.id));
    if (newOffers.length === 0) {
      if (runId) await db.query('update alert_runs set status = $1, finished_at = now(), offers_found = $2 where id = $3', ['success', qualifying.length, runId]);
      return { offers: qualifying, emailed: false };
    }

    await sendFareSignalEmail(email, newOffers, criteria as Parameters<typeof sendFareSignalEmail>[2]);
    for (const offer of newOffers) {
      await db.query(
        'insert into signals (alert_id, offer_id, offer) values ($1, $2, $3::jsonb) on conflict (alert_id, offer_id) do nothing',
        [alertId, offer.id, JSON.stringify(offer)],
      );
    }
    if (runId) await db.query('update alert_runs set status = $1, finished_at = now(), offers_found = $2, email_sent = true where id = $3', ['success', newOffers.length, runId]);
    return { offers: newOffers, emailed: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert search failed.';
    if (runId) {
      await db.query('update alert_runs set status = $1, finished_at = now(), error_message = $2 where id = $3', ['error', message.slice(0, 2000), runId]).catch(() => undefined);
    }
    throw error;
  }
}

export async function runDueAlerts() {
  const db = getDb();
  const result = await db.query<{ id: string; email: string; criteria: AlertCriteria; frequency: string }>(
    `select id, email, criteria, frequency
     from alerts
     where active = true
       and (last_checked_at is null
         or (frequency = 'Weekly' and last_checked_at <= now() - interval '7 days')
         or (frequency = 'Monthly' and last_checked_at <= now() - interval '30 days'))
     order by created_at asc
     limit 20`,
  );

  const summary = { checked: 0, signals: 0, emails: 0, errors: 0 };
  for (const alert of result.rows) {
    summary.checked += 1;
    try {
      const run = await runAlertSearch(alert.id, alert.email, alert.criteria);
      summary.signals += run.offers.length;
      if (run.emailed) summary.emails += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(`TripSignal alert ${alert.id} failed:`, error);
    }
  }
  return summary;
}
