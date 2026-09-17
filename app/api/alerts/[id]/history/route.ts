import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });

  const daysValue = Number(new URL(request.url).searchParams.get('days') ?? 90);
  const days = Math.min(Math.max(Number.isFinite(daysValue) ? Math.round(daysValue) : 90, 7), 365);
  await ensureSchema();
  const db = getDb();

  const alert = await db.query<{ max_price: number; active: boolean }>(
    'select (criteria->>\'maxPrice\')::numeric as max_price, active from alerts where id = $1 and user_id = $2',
    [id, user.id],
  );
  if (!alert.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });

  const result = await db.query<{ observed_at: string; price: number }>(
    `select observed_at, price
     from fare_observations
     where alert_id = $1
       and observed_at >= now() - ($2::text || ' days')::interval
     order by observed_at asc`,
    [id, days],
  );

  return NextResponse.json({
    points: result.rows.map((row) => ({ observedAt: row.observed_at, price: Number(row.price) })),
    target: Number(alert.rows[0].max_price),
    currency: 'USD',
  });
}
