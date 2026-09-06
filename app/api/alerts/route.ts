import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { createMagicLink } from '@/lib/auth';
import { runAlertSearch, summarizeAlert } from '@/lib/alerts';
import { sendAlertCreatedEmail, sendMagicLinkEmail } from '@/lib/email';

type AlertInput = {
  origin: string;
  destinationMode: 'region' | 'airport';
  destination: string;
  maxPrice: number;
  airlineMode: string;
  maxStops: string;
  tripLength: string;
  dateRange: string;
  dateStart?: string;
  dateEnd?: string;
  frequency: 'Weekly' | 'Monthly';
  cabin: 'economy' | 'premium_economy' | 'business';
  email: string;
};

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AlertInput;
    const origin = String(body.origin ?? '').trim().toUpperCase();
    const destinationMode = body.destinationMode === 'airport' ? 'airport' : 'region';
    const destination = String(body.destination ?? '').trim();
    const maxPrice = Number(body.maxPrice);
    const email = String(body.email ?? '').trim().toLowerCase();
    const dateRange = String(body.dateRange ?? 'Next 12 months').trim();
    const dateStart = body.dateStart ? String(body.dateStart).trim() : undefined;
    const dateEnd = body.dateEnd ? String(body.dateEnd).trim() : undefined;
    const rawAirlineMode = String(body.airlineMode ?? 'all').trim();
    const airlineMode = rawAirlineMode.toLowerCase() === 'all' ? 'all' : rawAirlineMode.toUpperCase();

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
    if (destinationMode === 'airport' && !/^[A-Za-z]{3}$/.test(destination)) return NextResponse.json({ error: 'Destination airport must be a three-letter airport code.' }, { status: 400 });
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) return NextResponse.json({ error: 'Enter a valid maximum price.' }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!['Weekly', 'Monthly'].includes(body.frequency)) return NextResponse.json({ error: 'Choose a valid search frequency.' }, { status: 400 });
    if (dateRange === 'Custom dates') {
      if (!dateStart || !dateEnd || !validDate(dateStart) || !validDate(dateEnd)) return NextResponse.json({ error: 'Choose a valid custom start and end date.' }, { status: 400 });
      if (dateEnd < dateStart) return NextResponse.json({ error: 'The end date must be on or after the start date.' }, { status: 400 });
      const today = new Date().toISOString().slice(0, 10);
      if (dateStart < today) return NextResponse.json({ error: 'The custom start date cannot be in the past.' }, { status: 400 });
    }

    const criteria = {
      origin,
      destinationMode,
      destination: destinationMode === 'airport' ? destination.toUpperCase() : destination,
      maxPrice,
      airlineMode,
      maxStops: String(body.maxStops ?? '1'),
      tripLength: String(body.tripLength ?? '1–3 weeks'),
      dateRange,
      dateStart,
      dateEnd,
      frequency: body.frequency,
      cabin: body.cabin ?? 'premium_economy',
    } as const;

    await ensureSchema();

    const account = await createMagicLink(email);
    await sendMagicLinkEmail(email, account.url);

    const db = getDb();
    const inserted = await db.query<{ id: string }>(
      `insert into alerts (email, user_id, criteria, frequency)
       values ($1, $2, $3::jsonb, $4)
       returning id`,
      [email, account.userId, JSON.stringify(criteria), criteria.frequency],
    );
    const alertId = inserted.rows[0]?.id;
    if (!alertId) throw new Error('Could not create alert.');

    let confirmationError = '';
    try {
      await sendAlertCreatedEmail(email, summarizeAlert(criteria));
    } catch (error) {
      confirmationError = error instanceof Error ? error.message : 'Confirmation email failed.';
      console.error('TripSignal confirmation email error:', error);
    }

    let searchError = '';
    let offers: Awaited<ReturnType<typeof runAlertSearch>>['offers'] = [];
    try {
      const result = await runAlertSearch(alertId, email, criteria);
      offers = result.offers;
    } catch (error) {
      searchError = error instanceof Error ? error.message : 'Initial fare search failed.';
      console.error('TripSignal initial alert search error:', error);
    }

    return NextResponse.json({
      alertId,
      active: true,
      accountCreated: true,
      signInEmailSent: true,
      offers,
      confirmationSent: !confirmationError,
      warning: confirmationError || searchError || undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create alert.';
    console.error('TripSignal alert creation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
