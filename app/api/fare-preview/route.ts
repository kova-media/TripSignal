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

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });
    if (destinationMode === 'country' && !/^[A-Z]{2}$/.test(destination)) return NextResponse.json({ available: false, observations: 0 });

    await ensureSchema();
    const db = getDb();

    const result = await db.query<{ price: string; observed_at: string }>(
      `select fo.price::text, fo.observed_at::text
       from fare_observations fo
       join alerts a on a.id = fo.alert_id
       where upper(coalesce(a.criteria->>'origin', '')) = $1
         and lower(coalesce(a.criteria->>'destinationMode', 'airport')) = $2
         and upper(coalesce(a.criteria->>'destination', '')) = $3
         and lower(coalesce(a.criteria->>'tripType', 'round-trip')) = $4
         and lower(coalesce(a.criteria->>'cabin', 'premium_economy')) = lower($5)
       order by fo.observed_at desc
       limit 1000`,
      [origin, destinationMode, destination, tripType, cabin],
    );

    const prices = result.rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return NextResponse.json({ available: false, observations: 0 });

    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent = result.rows
      .filter((row) => new Date(row.observed_at).getTime() >= cutoff)
      .map((row) => Number(row.price))
      .filter((price) => Number.isFinite(price) && price > 0);

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
    return NextResponse.json({ available: false, observations: 0 }, { status: 500 });
  }
}
