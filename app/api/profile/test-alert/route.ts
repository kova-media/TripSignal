import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import { sendFareSignalEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import type { FlightOffer } from '@/lib/flights/types';

type TestCriteria = {
  maxPrice: number;
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  airlineMode: string;
  maxStops: string;
  tripLength: string;
};

function sampleOffer(): FlightOffer {
  const departure = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const returned = new Date(Date.now() + 37 * 86_400_000).toISOString().slice(0, 10);
  return {
    id: 'test-alert',
    price: 486,
    currency: 'USD',
    origin: 'MCI',
    destination: 'LHR',
    departureDate: departure,
    returnDate: returned,
    stops: 1,
    totalDurationMinutes: 620,
    segments: [{
      marketingCarrier: 'TripSignal test',
      operatingCarrier: 'TripSignal test',
      origin: 'MCI',
      destination: 'LHR',
      departure: `${departure}T15:00:00Z`,
      arrival: `${departure}T23:20:00Z`,
    }],
    source: 'test',
  };
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  // One test alert per user every 5 minutes — it sends a real email.
  if (!checkRateLimit(`test-alert:${user.id}`, 1, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Test alerts are limited to one every 5 minutes. Please try again shortly.' }, { status: 429 });
  }
  await ensureSchema();
  const db = getDb();
  const observed = await db.query<{ offer: FlightOffer; criteria: Record<string, unknown> }>(
    `select o.offer, a.criteria from fare_observations o
     join alerts a on a.id = o.alert_id
     where a.user_id = $1 order by o.observed_at desc limit 1`,
    [user.id],
  );
  let offer: FlightOffer;
  let criteria: TestCriteria;
  const row = observed.rows[0];
  if (row) {
    offer = row.offer;
    const saved = row.criteria ?? {};
    const cabin = String(saved.cabin ?? 'economy');
    criteria = {
      maxPrice: Number(saved.maxPrice ?? offer.price + 100),
      cabin: (['economy', 'premium_economy', 'business', 'first'].includes(cabin) ? cabin : 'economy') as TestCriteria['cabin'],
      airlineMode: String(saved.airlineMode ?? 'all'),
      maxStops: String(saved.maxStops ?? 'any'),
      tripLength: String(saved.tripLength ?? '1–2 weeks'),
    };
  } else {
    offer = sampleOffer();
    criteria = { maxPrice: 650, cabin: 'economy', airlineMode: 'all', maxStops: 'any', tripLength: '1–2 weeks' };
  }
  try {
    await sendFareSignalEmail(user.email, [offer], criteria, { test: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send the test alert.';
    console.error('TripSignal test alert error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
