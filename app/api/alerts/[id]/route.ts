import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import { REGION_NAMES } from '@/lib/flights/provider';

async function getOwnedAlert(id: string, userId: string) {
  await ensureSchema();
  const db = getDb();
  // Soft-deleted alerts read as not found.
  return db.query<{ id: string; active: boolean; criteria: Record<string, unknown>; frequency: string; email: string }>('select id, active, criteria, frequency, email from alerts where id = $1 and user_id = $2 and deleted_at is null', [id, userId]);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  const result = await getOwnedAlert(id, user.id);
  if (!result.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
  return NextResponse.json({ alert: result.rows[0] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    await db.query('update alerts set active = $1 where id = $2 and user_id = $3 and deleted_at is null', [body.active, id, user.id]);
    return NextResponse.json({ ok: true, active: body.active });
  }

  const origin = String(body.origin ?? '').trim().toUpperCase();
  const rawDestinationMode = String(body.destinationMode ?? 'airport');
  const destinationMode = rawDestinationMode === 'country' ? 'country' : rawDestinationMode === 'region' ? 'region' : 'airport';
  const destination = String(body.destination ?? '').trim();
  const tripType = body.tripType === 'one-way' ? 'one-way' : 'round-trip';
  const maxPrice = Number(body.maxPrice);
  const passengers = Number(body.passengers ?? 1);
  // Alerts may only send to the session user's own verified email. Any
  // other address is rejected — the worker sends to alerts.email, so
  // accepting an arbitrary address would redirect signals unverified.
  const requestedEmail = body.email == null ? null : String(body.email).trim().toLowerCase();
  if (requestedEmail !== null && requestedEmail !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Alerts can only send to your account email.' }, { status: 400 });
  }
  const email = user.email.toLowerCase();
  const frequency = body.frequency === 'Daily' ? 'Daily' : body.frequency === 'Monthly' ? 'Monthly' : body.frequency === 'Weekly' ? 'Weekly' : '';
  const cabin = String(body.cabin ?? 'premium_economy');
  const dateRange = String(body.dateRange ?? 'Next 12 months').trim();
  const dateStart = body.dateStart ? String(body.dateStart).trim() : undefined;
  const dateEnd = body.dateEnd ? String(body.dateEnd).trim() : undefined;

  if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
  if (destinationMode === 'airport' && !/^[A-Z]{3}$/.test(destination.toUpperCase())) return NextResponse.json({ error: 'Destination airport must be a three-letter airport code.' }, { status: 400 });
  if (destinationMode === 'country' && !/^[A-Z]{2}$/.test(destination.toUpperCase())) return NextResponse.json({ error: 'Destination country must be a two-letter country code.' }, { status: 400 });
  if (destinationMode === 'region' && !REGION_NAMES.includes(destination)) return NextResponse.json({ error: `Destination region must be one of: ${REGION_NAMES.join(', ')}.` }, { status: 400 });
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
    destination: destinationMode === 'airport' || destinationMode === 'country' ? destination.toUpperCase() : destination,
    tripType,
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
  // Reset last_checked_at so the next worker run re-checks promptly, and
  // stamp the edit time.
  await db.query('update alerts set email = $1, criteria = $2::jsonb, frequency = $3, last_checked_at = null, criteria_updated_at = now() where id = $4 and user_id = $5 and deleted_at is null', [email, JSON.stringify(criteria), frequency, id, user.id]);
  return NextResponse.json({ ok: true, alert: { id, email, criteria, frequency } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  await ensureSchema();
  const db = getDb();
  // Soft delete: the row stays so the monthly creation count (which must
  // include soft-deleted rows) is not reset by deleting.
  const result = await db.query('update alerts set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null returning id', [id, user.id]);
  if (!result.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
