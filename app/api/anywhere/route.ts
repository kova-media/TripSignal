import { NextResponse } from 'next/server';
import { getFlightProvider } from '@/lib/flights/provider';
import type { FlightOffer, FlightSearchCriteria } from '@/lib/flights/types';

export const runtime = 'nodejs';

// Must stay in sync with REGION_AIRPORTS in lib/flights/provider.ts
// (that map is module-private, so the keys are mirrored here).
const VALID_REGIONS = [
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Middle East',
  'Oceania',
] as const;

const CABINS = ['economy', 'premium_economy', 'business', 'first'] as const;
type Cabin = (typeof CABINS)[number];

type AnywhereBody = {
  origin?: unknown;
  region?: unknown;
  maxPrice?: unknown;
  cabin?: unknown;
};

export async function POST(request: Request) {
  let body: AnywhereBody;
  try {
    body = (await request.json()) as AnywhereBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const origin = String(body.origin ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
  }

  const region = String(body.region ?? '').trim();
  if (!(VALID_REGIONS as readonly string[]).includes(region)) {
    return NextResponse.json({ error: `Region must be one of: ${VALID_REGIONS.join(', ')}.` }, { status: 400 });
  }

  const maxPrice = Number(body.maxPrice);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    return NextResponse.json({ error: 'Enter a valid maximum price.' }, { status: 400 });
  }

  const cabin: Cabin = (CABINS as readonly string[]).includes(String(body.cabin ?? ''))
    ? (body.cabin as Cabin)
    : 'economy';

  const departure = new Date();
  departure.setUTCDate(departure.getUTCDate() + 30);
  const departureStart = departure.toISOString().slice(0, 10);

  const criteria: FlightSearchCriteria = {
    origin,
    destination: { type: 'region', value: region },
    tripType: 'round-trip',
    maxPrice: 25000,
    cabin,
    airlines: [],
    maxStops: null,
    minTripDays: 7,
    maxTripDays: 14,
    departureStart,
    departureEnd: departureStart,
    passengers: 1,
  };

  let offers: FlightOffer[];
  try {
    offers = await getFlightProvider().search(criteria);
  } catch (error) {
    console.error('TripSignal anywhere search error:', error);
    return NextResponse.json(
      { error: 'Fare search is temporarily unavailable. Try again in a moment.' },
      { status: 502 },
    );
  }

  const cheapest = new Map<string, FlightOffer>();
  for (const offer of offers) {
    if (!offer || !Number.isFinite(offer.price) || offer.price <= 0 || offer.price > maxPrice) continue;
    const current = cheapest.get(offer.destination);
    if (!current || offer.price < current.price) cheapest.set(offer.destination, offer);
  }

  const results = [...cheapest.entries()]
    .map(([destination, offer]) => ({ destination, price: offer.price, offer }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 20);

  return NextResponse.json({ origin, region, departureStart, cabin, results });
}
