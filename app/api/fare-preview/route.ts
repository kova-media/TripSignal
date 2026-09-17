import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { getFlightProvider } from '@/lib/flights/provider';
import type { FlightSearchCriteria } from '@/lib/flights/types';

export const dynamic = 'force-dynamic';

type FareRow = { price: string; observed_at: string; offer: any };

type MatchLevel = 'matching' | 'route' | null;

function clean(value: string | null) { return String(value ?? '').trim().toUpperCase(); }

async function queryObservations(db: ReturnType<typeof getDb>, where: string, values: string[]) {
  return db.query<FareRow>(
    `select fo.price::text, fo.observed_at::text, fo.offer
     from fare_observations fo
     left join alerts a on a.id = fo.alert_id
     where ${where}
     order by fo.observed_at desc
     limit 1000`,
    values,
  );
}

async function getObservations(db: ReturnType<typeof getDb>, origin: string, destinationMode: string, destination: string, tripType: string, cabin: string) {
  const exact = await queryObservations(db,
    `upper(coalesce(fo.origin, a.criteria->>'origin', '')) = $1
     and lower(coalesce(fo.destination_mode, a.criteria->>'destinationMode', 'airport')) = $2
     and upper(coalesce(fo.destination, a.criteria->>'destination', '')) = $3
     and lower(coalesce(fo.trip_type, a.criteria->>'tripType', 'round-trip')) = $4
     and lower(coalesce(fo.cabin, a.criteria->>'cabin', 'premium_economy')) = lower($5)`,
    [origin, destinationMode, destination, tripType, cabin],
  );

  if (exact.rows.length >= 3) return { rows: exact.rows, matchLevel: 'matching' as MatchLevel };

  const route = await queryObservations(db,
    `upper(coalesce(fo.origin, a.criteria->>'origin', '')) = $1
     and lower(coalesce(fo.destination_mode, a.criteria->>'destinationMode', 'airport')) = $2
     and upper(coalesce(fo.destination, a.criteria->>'destination', '')) = $3`,
    [origin, destinationMode, destination],
  );

  if (route.rows.length >= 3) return { rows: route.rows, matchLevel: 'route' as MatchLevel };
  if (exact.rows.length) return { rows: exact.rows, matchLevel: 'matching' as MatchLevel };
  return { rows: route.rows, matchLevel: route.rows.length ? ('route' as MatchLevel) : null };
}

function tripDays(value: string): [number, number] {
  switch (value) {
    case '3–7 days': return [3, 7];
    case '1–2 weeks': return [7, 14];
    case '1–4 weeks': return [7, 28];
    default: return [7, 21];
  }
}

async function createLiveObservation(db: ReturnType<typeof getDb>, origin: string, destinationMode: 'airport' | 'country', destination: string, tripType: 'round-trip' | 'one-way', cabin: string, maxStopsValue: string, passengersValue: string, airlineMode: string, tripLength: string) {
  const departure = new Date();
  departure.setUTCDate(departure.getUTCDate() + 30);
  const departureStart = departure.toISOString().slice(0, 10);
  const [minTripDays, maxTripDays] = tripDays(tripLength);
  const maxStops = maxStopsValue === 'any' || !maxStopsValue ? null : Number(maxStopsValue);
  const passengers = Math.min(9, Math.max(1, Number(passengersValue) || 1));
  const allAirlines = !airlineMode || airlineMode.toLowerCase() === 'all';
  const criteria: FlightSearchCriteria = {
    origin,
    destination: destinationMode === 'airport' ? { type: 'airport', value: destination } : { type: 'country', value: destination },
    tripType,
    maxPrice: 25000,
    cabin: ['economy', 'premium_economy', 'business', 'first'].includes(cabin) ? cabin as FlightSearchCriteria['cabin'] : 'premium_economy',
    airlines: allAirlines ? [] : [airlineMode.toUpperCase()],
    maxStops,
    minTripDays,
    maxTripDays,
    departureStart,
    departureEnd: departureStart,
    passengers,
  };
  const offers = await getFlightProvider().search(criteria);
  const lowest = offers.filter((offer) => Number.isFinite(offer.price) && offer.price > 0).sort((a, b) => a.price - b.price)[0];
  if (!lowest) return null;
  await db.query(
    `insert into fare_observations (alert_id, observed_at, price, offer, origin, destination_mode, destination, trip_type, cabin)
     values (null, now(), $1, $2::jsonb, $3, $4, $5, $6, $7)`,
    [lowest.price, JSON.stringify(lowest), origin, destinationMode, destination, tripType, criteria.cabin],
  );
  return { price: String(lowest.price), observed_at: new Date().toISOString(), offer: lowest } satisfies FareRow;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
}

function routeIntelligence(rows: FareRow[]) {
  if (rows.length < 5) return null;
  const stopCounts = new Map<number, number>();
  for (const row of rows) {
    const stops = Number(row.offer?.stops);
    if (!Number.isFinite(stops) || stops < 0) continue;
    stopCounts.set(stops, (stopCounts.get(stops) ?? 0) + 1);
  }
  const common = [...stopCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return common ? { commonStops: common[0], commonStopsShare: Math.round((common[1] / rows.length) * 100) } : null;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const origin = clean(params.get('origin'));
    const destination = clean(params.get('destination'));
    const destinationMode = params.get('destinationMode') === 'country' ? 'country' : 'airport';
    const tripType = params.get('tripType') === 'one-way' ? 'one-way' : 'round-trip';
    const cabin = clean(params.get('cabin')) || 'PREMIUM_ECONOMY';
    const maxStops = params.get('maxStops') || 'any';
    const passengers = params.get('passengers') || '1';
    const airlineMode = params.get('airlineMode') || 'all';
    const tripLength = params.get('tripLength') || '1–3 weeks';
    const target = Number(params.get('target'));

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'country' && !/^[A-Z]{2}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });

    await ensureSchema();
    const db = getDb();
    let { rows, matchLevel } = await getObservations(db, origin, destinationMode, destination, tripType, cabin);

    if (!rows.length) {
      const live = await createLiveObservation(db, origin, destinationMode, destination, tripType, cabin.toLowerCase(), maxStops, passengers, airlineMode, tripLength);
      if (live) { rows = [live]; matchLevel = 'matching'; }
    }

    const prices = rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return NextResponse.json({ available: false, observations: 0 });

    const lowest = Math.min(...prices);
    const typical = median(prices);
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent = rows.filter((row) => new Date(row.observed_at).getTime() >= cutoff).map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
    const recentLowest = recent.length ? Math.min(...recent) : lowest;
    const targetDelta = Number.isFinite(target) && target > 0 ? target - typical : null;
    const targetPercent = Number.isFinite(target) && target > 0 && typical > 0 ? Math.round((target - typical) / typical * 100) : null;
    const intelligence = routeIntelligence(rows);

    return NextResponse.json({
      available: true,
      lowest,
      recentLowest,
      highest: Math.max(...prices),
      median: typical,
      observations: prices.length,
      lastObservedAt: rows[0].observed_at,
      matchLevel,
      target: Number.isFinite(target) && target > 0 ? target : null,
      targetDelta,
      targetPercent,
      intelligence,
      currency: 'USD',
    });
  } catch (error) {
    console.error('TripSignal fare preview error:', error);
    return NextResponse.json({ available: false, observations: 0 }, { status: 500 });
  }
}
