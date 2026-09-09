import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

async function getOwnedAlert(id: string, userId: string) {
  await ensureSchema();
  const db = getDb();
  return db.query<{ id: string; active: boolean; criteria: Record<string, unknown>; frequency: string; email: string }>(
    `select id, active, criteria, frequency, email from alerts where id = $1 and user_id = $2`,
    [id, userId],
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  const result = await getOwnedAlert(id, user.id);
  if (!result.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
  return NextResponse.json({ alert: result.rows[0] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const existing = await getOwnedAlert(id, user.id);
  if (!existing.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });

  if (typeof body.active === 'boolean') {
    const db = getDb();
    await db.query(`update alerts set active = $1 where id = $2 and user_id = $3`, [body.active, id, user.id]);
    return NextResponse.json({ ok: true, active: body.active });
  }

  const origin = String(body.origin ?? '').trim().toUpperCase();
  const destinationMode = body.destinationMode === 'airport' ? 'airport' : 'region';
  const destination = String(body.destination ?? '').trim();
  const maxPrice = Number(body.maxPrice);
  const passengers = Number(body.passengers ?? 1);
  const email = String(body.email ?? existing.rows[0].email ?? user.email).trim().toLowerCase();
  const frequency = body.frequency === 'Monthly' ? 'Monthly' : body.frequency === 'Weekly' ? 'Weekly' : '';
  const cabin = String(body.cabin ?? 'premium_economy');
  const dateRange = String(body.dateRange ?? 'Next 12 months').trim();
  const dateStart = body.dateStart ? String(body.dateStart).trim() : undefined;
  const dateEnd = body.dateEnd ? String(body.dateEnd).trim() : undefined;

  if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
  if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination.toUpperCase())) return NextResponse.json({ error: 'Destination airport must be a three-letter airport code.' }, { status: 400 });
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) return NextResponse.json({ error: 'Enter a valid maximum price.' }, { status: 400 });
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) return NextResponse.json({ error: 'Choose between 1 and 9 passengers.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!frequency) return NextResponse.json({ error: 'Choose a valid search frequency.' }, { status: 400 });
  if (!['economy', 'premium_economy', 'business', 'first'].includes(cabin)) return NextResponse.json({ error: 'Choose a valid cabin.' }, { status: 400 });
  if (dateRange === 'Custom dates') {
    if (!dateStart || !dateEnd || !/^\d{4}-\d{2}-\d{2}$/.test(dateStart) || !/^\d{4}-\d{2}-\d{2}$/.test(dateEnd)) return NextResponse.json({ error: 'Choose valid custom dates.' }, { status: 400 });
    if (dateEnd < dateStart) return NextResponse.json({ error: 'The end date must be on or after the start date.' }, { status: 400 });
    if (dateStart < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: 'The start date cannot be in the past.' }, { status: 400 });
  }

  const criteria = {
    origin,
    destinationMode,
    destination: destinationMode === 'airport' ? destination.toUpperCase() : destination,
    maxPrice,
    airlineMode: String(body.airlineMode ?? 'all').toUpperCase() === 'ALL' ? 'all' : String(body.airlineMode ?? 'all').toUpperCase(),
    maxStops: String(body.maxStops ?? '1'),
    tripLength: String(body.tripLength ?? '1–3 weeks'),
    dateRange,
    dateStart: dateRange === 'Custom dates' ? dateStart : undefined,
    dateEnd: dateRange === 'Custom dates' ? dateEnd : undefined,
    frequency,
    cabin,
    passengers,
  };

  const db = getDb();
  await db.query(
    `update alerts set email = $1, criteria = $2::jsonb, frequency = $3 where id = $4 and user_id = $5`,
    [email, JSON.stringify(criteria), frequency, id, user.id],
  );
  return NextResponse.json({ ok: true, alert: { id, email, criteria, frequency } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  await ensureSchema();
  const db = getDb();
  const result = await db.query(`delete from alerts where id = $1 and user_id = $2 returning id`, [id, user.id]);
  if (!result.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
