import { NextResponse } from 'next/server';
import { getFlightProvider } from '@/lib/flights/provider';
import type { CabinClass, DestinationScope, FlightSearchCriteria } from '@/lib/flights/types';

function tripDays(value: string): [number, number] {
  switch (value) {
    case '3–7 days': return [3, 7];
    case '1–2 weeks': return [7, 14];
    case '1–4 weeks': return [7, 28];
    default: return [7, 21];
  }
}

function windowStart(value: string): string {
  const days = value === 'Next 3 months' ? 14 : value === 'Next 6 months' ? 30 : value === 'Next 12 months' ? 60 : 30;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function destinationScope(mode: string, value: string): DestinationScope {
  if (mode === 'airport') return { type: 'airport', value };
  return { type: 'region', value };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = String(body.origin ?? '').trim().toUpperCase();
    const destinationMode = String(body.destinationMode ?? 'region');
    const destination = String(body.destination ?? 'Europe').trim();
    const destinationAirport = destination.toUpperCase();
    const maxPrice = Number(body.maxPrice);
    const maxStopsValue = String(body.maxStops ?? '1');
    const [minTripDays, maxTripDays] = tripDays(String(body.tripLength ?? '1–3 weeks'));

    if (!/^[A-Z]{3}$/.test(origin)) {
      return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
    }
    if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destinationAirport)) {
      return NextResponse.json({ error: 'Destination airport must be a three-letter airport code.' }, { status: 400 });
    }
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
      return NextResponse.json({ error: 'Enter a valid maximum price.' }, { status: 400 });
    }

    const airlineMode = String(body.airlineMode ?? 'all');
    const criteria: FlightSearchCriteria = {
      origin,
      destination: destinationScope(destinationMode, destinationMode === 'airport' ? destinationAirport : destination),
      maxPrice,
      cabin: (body.cabin ?? 'economy') as CabinClass,
      airlines: airlineMode === 'all' ? [] : [airlineMode.toUpperCase()],
      maxStops: maxStopsValue === 'any' ? null : Number(maxStopsValue),
      minTripDays,
      maxTripDays,
      departureStart: windowStart(String(body.dateRange ?? 'Next 12 months')),
      departureEnd: windowStart(String(body.dateRange ?? 'Next 12 months')),
      passengers: 1,
    };

    const provider = getFlightProvider();
    const offers = await provider.search(criteria);

    return NextResponse.json({
      provider: provider.name,
      searched: {
        origin: criteria.origin,
        destination: destinationMode === 'airport' ? destinationAirport : destination,
        destinationMode,
        departureDate: criteria.departureStart,
        tripDays: minTripDays,
        airline: airlineMode === 'all' ? 'all' : airlineMode.toUpperCase(),
      },
      offers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Flight search failed.';
    console.error('TripSignal flight search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
