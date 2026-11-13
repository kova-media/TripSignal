import type { PoolClient } from 'pg';
import type { FlightOffer, FlightSearchCriteria } from './flights/types';
import { getFlightProvider } from './flights/provider';
import { getDb } from './db';
import { sendFareSignalEmail, sendMonthlyDigestEmail } from './email';
import { isSmsConfigured, sendSmsAlert } from './sms';

// Returns true when there was nothing to send or the SMS went out, false
// when the Twilio send failed (so the caller can flag it for retry).
async function sendSmsSignal(alertId: string, offer: FlightOffer | undefined): Promise<boolean> {
  if (!offer || !isSmsConfigured()) return true;
  const db = getDb();
  const result = await db.query<{ phone: string | null; sms_opt_in: boolean }>('select u.phone, coalesce(u.sms_opt_in, false) as sms_opt_in from users u join alerts a on a.user_id = u.id where a.id = $1 limit 1', [alertId]);
  const row = result.rows[0];
  if (!row?.sms_opt_in || !row.phone) return true;
  const message = `TripSignal: $${Math.round(offer.price).toLocaleString()} ${offer.origin}→${offer.destination} is under your target. Check your email for details.`;
  try {
    await sendSmsAlert(row.phone, message);
    return true;
  } catch (error) {
    console.error('TripSignal SMS alert failed:', error);
    return false;
  }
}

// Retry SMS sends that failed on an earlier run. The offer JSON is stored
// on the signal row, so the retry needs no fresh search.
async function retryFailedSms(alertId: string) {
  const db = getDb();
  let failed: Array<{ id: string; offer: FlightOffer }>;
  try {
    const result = await db.query<{ id: string; offer: FlightOffer }>('select id, offer from signals where alert_id = $1 and sms_failed = true order by sent_at asc', [alertId]);
    failed = result.rows;
  } catch (error) {
    console.error(`TripSignal SMS retry lookup failed for alert ${alertId}:`, error);
    return;
  }
  for (const signal of failed) {
    const ok = await sendSmsSignal(alertId, signal.offer);
    if (ok) await db.query('update signals set sms_failed = false where id = $1', [signal.id]).catch(() => undefined);
  }
}

// Activates alerts created by a signed-out user once they click the magic
// link. Wired into the magic-link verify route by the coordinator; this
// helper only performs the activation.
export async function activatePendingAlerts(userId: string): Promise<number> {
  const db = getDb();
  const result = await db.query('update alerts set active = true, pending_verification = false where user_id = $1 and pending_verification = true and deleted_at is null returning id', [userId]);
  return result.rowCount ?? 0;
}

// Per-alert advisory lock so cron and an admin "Run now" cannot process
// the same alert at the same time. Held on the caller's dedicated client
// and released after the alert is done.
async function tryAlertLock(client: PoolClient, alertId: string): Promise<boolean> {
  try {
    const result = await client.query<{ locked: boolean }>('select pg_try_advisory_lock(hashtextextended($1, 0)) as locked', [alertId]);
    return result.rows[0]?.locked === true;
  } catch {
    return false;
  }
}

async function unlockAlert(client: PoolClient, alertId: string) {
  await client.query('select pg_advisory_unlock(hashtextextended($1, 0))', [alertId]).catch(() => undefined);
}

type AlertCriteria = {
  origin: string; destinationMode: 'country' | 'airport' | 'region'; destination: string; tripType?: 'round-trip' | 'one-way'; maxPrice: number; airlineMode: string; maxStops: string; tripLength: string; dateRange: string; dateStart?: string; dateEnd?: string; frequency: 'Daily' | 'Weekly' | 'Monthly'; cabin: 'economy' | 'premium_economy' | 'business' | 'first'; passengers?: number;
};
function tripDays(value: string): [number, number] { switch (value) { case '3–7 days': return [3, 7]; case '1–2 weeks': return [7, 14]; case '1–4 weeks': return [7, 28]; default: return [7, 21]; } }
function windowDays(value: string) { switch (value) { case 'Next 3 months': return 90; case 'Next 6 months': return 180; case 'Next 12 months': return 365; default: return 90; } }
function dateRangeBounds(alert: AlertCriteria): [string, string] { if (alert.dateStart && alert.dateEnd) return [alert.dateStart, alert.dateEnd]; const start = new Date(); const end = new Date(start); end.setUTCDate(end.getUTCDate() + windowDays(alert.dateRange)); return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]; }
function nextDepartureDate(alert: AlertCriteria, salt = 0) { const [startValue, endValue] = dateRangeBounds(alert); const start = new Date(`${startValue}T00:00:00Z`); const end = new Date(`${endValue}T00:00:00Z`); const [, maxTripDays] = tripDays(alert.tripLength); const spanDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000)); const latestDepartureOffset = alert.tripType === 'one-way' ? spanDays : Math.max(0, spanDays - maxTripDays); const sampleCount: number = alert.destinationMode === 'airport' ? 4 : 2; const index = salt % sampleCount; const offset = Math.round((latestDepartureOffset * index) / (sampleCount - 1)); start.setUTCDate(start.getUTCDate() + offset); return start.toISOString().slice(0, 10); }
function buildCriteria(alert: AlertCriteria, salt = 0): FlightSearchCriteria { const [minTripDays, maxTripDays] = tripDays(alert.tripLength); const departureStart = nextDepartureDate(alert, salt); const [, windowEnd] = dateRangeBounds(alert); const allAirlines = alert.airlineMode.toLowerCase() === 'all'; return { origin: alert.origin, destination: alert.destinationMode === 'airport' ? { type: 'airport', value: alert.destination.toUpperCase() } : alert.destinationMode === 'country' ? { type: 'country', value: alert.destination.toUpperCase() } : { type: 'region', value: alert.destination }, tripType: alert.tripType === 'one-way' ? 'one-way' : 'round-trip', maxPrice: alert.maxPrice, cabin: alert.cabin, airlines: allAirlines ? [] : [alert.airlineMode.toUpperCase()], maxStops: alert.maxStops === 'any' ? null : Number(alert.maxStops), minTripDays, maxTripDays, departureStart, departureEnd: windowEnd, passengers: alert.passengers ?? 1 }; }
export function summarizeAlert(alert: AlertCriteria) { const destination = alert.destinationMode === 'airport' ? alert.destination.toUpperCase() : alert.destinationMode === 'country' ? alert.destination.toUpperCase() : alert.destination; const cabin = alert.cabin === 'premium_economy' ? 'Premium economy' : alert.cabin === 'business' ? 'Business' : alert.cabin === 'first' ? 'First class' : 'Economy'; const tripType = alert.tripType === 'one-way' ? 'One way' : 'Round trip'; return `${alert.origin} → ${destination} · ${tripType} · ${cabin} · under $${alert.maxPrice.toLocaleString()} · ${alert.dateRange} · ${alert.frequency}`; }
export async function runAlertSearch(alertId: string, email: string, criteria: AlertCriteria) {
  const db = getDb();
  await retryFailedSms(alertId);
  const runInserted = await db.query<{ id: string }>('insert into alert_runs (alert_id, status) values ($1, $2) returning id', [alertId, 'running']); const runId = runInserted.rows[0]?.id;
  // last_checked_at is stamped only after a check completes successfully.
  // Stamping it before the email send used to lose the notification until
  // the next due interval when the send failed; the signals dedup check
  // makes a re-send on the next run safe.
  const markChecked = async (offersFound: number, emailSent: boolean) => {
    await db.query('update alerts set last_checked_at = now() where id = $1', [alertId]);
    if (runId) await db.query('update alert_runs set status = $1, finished_at = now(), offers_found = $2, email_sent = $3 where id = $4', ['success', offersFound, emailSent, runId]);
  };
  try {
    const provider = getFlightProvider(); const searchCount = criteria.destinationMode === 'airport' ? 4 : 1; const results: FlightOffer[] = []; for (let i = 0; i < searchCount; i += 1) results.push(...await provider.search(buildCriteria(criteria, i)));
    const lowest = results.filter((offer) => Number.isFinite(offer.price) && offer.price > 0).sort((a, b) => a.price - b.price)[0];
    const tripType = criteria.tripType === 'one-way' ? 'one-way' : 'round-trip';
    if (lowest) await db.query('insert into fare_observations (alert_id, price, offer, origin, destination_mode, destination, trip_type, cabin, departure_date, return_date, destination_airport) values ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11)', [alertId, lowest.price, JSON.stringify(lowest), criteria.origin, criteria.destinationMode, criteria.destination.toUpperCase(), tripType, criteria.cabin, lowest.departureDate, tripType === 'one-way' ? null : lowest.returnDate, lowest.destination]);
    const qualifying = results.filter((offer) => offer.price < criteria.maxPrice).sort((a, b) => a.price - b.price).filter((offer, index, array) => index === array.findIndex((candidate) => candidate.id === offer.id)).slice(0, 10);
    if (qualifying.length === 0) { await markChecked(0, false); return { offers: [], emailed: false }; }
    const ids = qualifying.map((offer) => offer.id); const existing = await db.query<{ offer_id: string }>('select offer_id from signals where alert_id = $1 and offer_id = any($2::text[])', [alertId, ids]); const sentIds = new Set(existing.rows.map((row) => row.offer_id)); const newOffers = qualifying.filter((offer) => !sentIds.has(offer.id));
    if (newOffers.length === 0) { await markChecked(qualifying.length, false); return { offers: qualifying, emailed: false }; }
    await sendFareSignalEmail(email, newOffers, criteria as Parameters<typeof sendFareSignalEmail>[2]);
    const smsFailed = !(await sendSmsSignal(alertId, newOffers[0]));
    for (const offer of newOffers) await db.query('insert into signals (alert_id, offer_id, offer, sms_failed) values ($1, $2, $3::jsonb, $4) on conflict (alert_id, offer_id) do nothing', [alertId, offer.id, JSON.stringify(offer), smsFailed]);
    await markChecked(newOffers.length, true);
    return { offers: newOffers, emailed: true };
  } catch (error) { const message = error instanceof Error ? error.message : 'Alert search failed.'; if (runId) await db.query('update alert_runs set status = $1, finished_at = now(), error_message = $2 where id = $3', ['error', message.slice(0, 2000), runId]).catch(() => undefined); throw error; }
}
export async function runDueAlerts() { const db = getDb(); const result = await db.query<{ id: string; email: string; criteria: AlertCriteria; frequency: string }>(`select id, email, criteria, frequency from alerts where active = true and pending_verification = false and deleted_at is null and (last_checked_at is null or (frequency = 'Daily' and last_checked_at <= now() - interval '24 hours') or (frequency = 'Weekly' and last_checked_at <= now() - interval '7 days') or (frequency = 'Monthly' and last_checked_at <= now() - interval '30 days')) order by created_at asc`); const summary = { checked: 0, signals: 0, emails: 0, errors: 0, digests: 0 }; const client = await db.connect(); try { for (let index = 0; index < result.rows.length; index += 1) { const alert = result.rows[index]!; if (!(await tryAlertLock(client, alert.id))) continue; summary.checked += 1; try { const run = await runAlertSearch(alert.id, alert.email, alert.criteria); summary.signals += run.offers.length; if (run.emailed) summary.emails += 1; } catch (error) { summary.errors += 1; console.error(`TripSignal alert ${alert.id} failed:`, error); } finally { await unlockAlert(client, alert.id); } if (index < result.rows.length - 1) await new Promise((resolve) => setTimeout(resolve, 2000)); } } finally { client.release(); } try { summary.digests = await runMonthlyDigests(); } catch (error) { summary.errors += 1; console.error('TripSignal monthly digest run failed:', error); } return summary; }

export async function runMonthlyDigests() { const db = getDb(); const result = await db.query<{ id: string; email: string; criteria: AlertCriteria }>(`select id, email, criteria from alerts where active = true and pending_verification = false and deleted_at is null and created_at <= now() - interval '30 days' and last_checked_at is not null and (last_monthly_digest_at is null or last_monthly_digest_at <= now() - interval '30 days') order by created_at asc`); let sent = 0; const client = await db.connect(); try { for (const alert of result.rows) { if (!(await tryAlertLock(client, alert.id))) continue; try { const recentSignal = await db.query<{ id: string }>('select id from signals where alert_id = $1 and sent_at >= now() - interval \'30 days\' limit 1', [alert.id]); if (recentSignal.rows.length > 0) { await db.query('update alerts set last_monthly_digest_at = now() where id = $1', [alert.id]); continue; } const lowest = await db.query<{ price: string | null }>('select min(price) as price from fare_observations where alert_id = $1 and observed_at >= now() - interval \'30 days\'', [alert.id]); const lowestPrice = lowest.rows[0]?.price == null ? null : Number(lowest.rows[0].price); await sendMonthlyDigestEmail(alert.email, summarizeAlert(alert.criteria), lowestPrice, alert.criteria.maxPrice); await db.query('update alerts set last_monthly_digest_at = now() where id = $1', [alert.id]); sent += 1; } catch (error) { console.error(`TripSignal monthly digest for alert ${alert.id} failed:`, error); } finally { await unlockAlert(client, alert.id); } } } finally { client.release(); } return sent; }
