import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

function clean(value: string | null) {
  return String(value ?? '').trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const origin = clean(params.get('origin'));
    const destination = clean(params.get('destination'));
    const destinationMode = params.get('destinationMode') === 'country' ? 'country' : 'airport';
    const tripType = params.get('tripType') === 'one-way' ? 'one-way' : 'round-trip';
    const cabin = clean(params.get('cabin')) || 'PREMIUM_ECONOMY';
    const maxStops = params.get('maxStops') ?? '1';
    const passengers = Number(params.get('passengers') ?? '1');
    const airlineMode = clean(params.get('airlineMode')) || 'ALL';
    const tripLength = params.get('tripLength') ?? '1–3 weeks';

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ available: false });
    if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination)) return NextResponse.json({ available: false });
    if (destinationMode === 'country' && !/^[A-Z]{2}$/.test(destination)) return NextResponse.json({ available: false });
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) return NextResponse.json({ available: false });

    await ensureSchema();
    const db = getDb();

    const result = await db.query<{ price: string; observed_at: string }>(
      `select fo.price::text, fo.observed_at::text
       from fare_observations fo
       join alerts a on a.id = fo.alert_id
       where upper(coalesce(a.criteria->>'origin', '')) = $1
         and upper(coalesce(a.criteria->>'destinationMode', 'airport')) = $2
         and upper(coalesce(a.criteria->>'destination', '')) = $3
         and lower(coalesce(a.criteria->>'tripType', 'round-trip')) = $4
         and lower(coalesce(a.criteria->>'cabin', 'premium_economy')) = lower($5)
         and coalesce(a.criteria->>'maxStops', '1') = $6
         and coalesce((a.criteria->>'passengers')::integer, 1) = $7
         and upper(coalesce(a.criteria->>'airlineMode', 'ALL')) = $8
         and coalesce(a.criteria->>'tripLength', '1–3 weeks') = $9
       order by fo.observed_at desc
       limit 500`,
      [origin, destinationMode, destination, tripType, cabin, maxStops, passengers, airlineMode, tripLength],
    );

    if (!result.rowCount) return NextResponse.json({ available: false, observations: 0 });

    const prices = result.rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return NextResponse.json({ available: false, observations: 0 });

    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const recent = result.rows.filter((row) => Date.now() - new Date(row.observed_at).getTime() <= 90 * 24 * 60 * 60 * 1000).map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);

    return NextResponse.json({
      available: true,
      lowest: sorted[0],
      median,
      recentLowest: recent.length ? Math.min(...recent) : sorted[0],
      observations: prices.length,
      lastObservedAt: result.rows[0].observed_at,
      currency: 'USD',
    });
  } catch (error) {
    console.error('TripSignal fare preview error:', error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
