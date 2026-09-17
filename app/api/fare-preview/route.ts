import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { getFlightProvider } from '@/lib/flights/provider';
import type { FlightSearchCriteria } from '@/lib/flights/types';

export const dynamic = 'force-dynamic';

function clean(value: string | null) {
  return String(value ?? '').trim().toUpperCase();
}

type FareRow = { price: string; observed_at: string };

async function getObservations(db: ReturnType<typeof getDb>, origin: string, destinationMode: string, destination: string, tripType: string, cabin: string) {
  const result = await db.query<FareRow>(
    `select fo.price::text, fo.observed_at::text
     from fare_observations fo
     left join alerts a on a.id = fo.alert_id
     where upper(coalesce(fo.origin, a.criteria->>'origin', '')) = $1
       and lower(coalesce(fo.destination_mode, a.criteria->>'destinationMode', 'airport')) = $2
       and upper(coalesce(fo.destination, a.criteria->>'destination', '')) = $3
       and lower(coalesce(fo.trip_type, a.criteria->>'tripType', 'round-trip')) = $4
       and lower(coalesce(fo.cabin, a.criteria->>'cabin', 'premium_economy')) = lower($5)
     order by fo.observed_at desc
     limit 1000`,
    [origin, destinationMode, destination, tripType, cabin],
  );

  if (result.rows.length) return { rows: result.rows, matchLevel: 'matching' as const };

  const route = await db.query<FareRow>(
    `select fo.price::text, fo.observed_at::text
     from fare_observations fo
     left join alerts a on a.id = fo.alert_id
     where upper(coalesce(fo.origin, a.criteria->>'origin', '')) = $1
       and lower(coalesce(fo.destination_mode, a.criteria->>'destinationMode', 'airport')) = $2
       and upper(coalesce(fo.destination, a.criteria->>'destination', '')) = $3
     order by fo.observed_at desc
     limit 1000`,
    [origin, destinationMode, destination],
  );

  return { rows: route.rows, matchLevel: route.rows.length ? ('route' as const) : null };
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

  return { price: String(lowest.price), observed_at: new Date().toISOString() } satisfies FareRow;
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

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'country' && !/^[A-Z]{2}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });

    await ensureSchema();
    const db = getDb();
    let { rows, matchLevel } = await getObservations(db, origin, destinationMode, destination, tripType, cabin);

    if (!rows.length) {
      const live = await createLiveObservation(db, origin, destinationMode, destination, tripType, cabin.toLowerCase(), maxStops, passengers, airlineMode, tripLength);
      if (live) {
        rows = [live];
        matchLevel = 'matching';
      }
    }

    const prices = rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return NextResponse.json({ available: false, observations: 0 });

    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent = rows.filter((row) => new Date(row.observed_at).getTime() >= cutoff).map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);

    return NextResponse.json({ available: true, lowest: sorted[0], median, recentLowest: recent.length ? Math.min(...recent) : sorted[0], observations: prices.length, lastObservedAt: rows[0].observed_at, matchLevel, currency: 'USD' });
  } catch (error) {
    console.error('TripSignal fare preview error:', error);
    return NextResponse.json({ available: false, observations: 0 }, { status: 500 });
  }
}
