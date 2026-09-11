import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { createMagicLink, getCurrentUser } from '@/lib/auth';
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
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  passengers?: number;
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
    const passengers = Number(body.passengers ?? 1);
    const email = String(body.email ?? '').trim().toLowerCase();
    const dateRange = String(body.dateRange ?? 'Next 12 months').trim();
    const dateStart = body.dateStart ? String(body.dateStart).trim() : undefined;
    const dateEnd = body.dateEnd ? String(body.dateEnd).trim() : undefined;
    const rawAirlineMode = String(body.airlineMode ?? 'all').trim();
    const airlineMode = rawAirlineMode.toLowerCase() === 'all' ? 'all' : rawAirlineMode.toUpperCase();
    const cabin = body.cabin ?? 'premium_economy';

    if (!/^[A-Z]{3}$/.test(origin)) return NextResponse.json({ error: 'Origin must be a three-letter airport code.' }, { status: 400 });
    if (destinationMode === 'airport' && !/^[A-Za-z]{3}$/.test(destination)) return NextResponse.json({ error: 'Destination airport must be a three-letter airport code.' }, { status: 400 });
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) return NextResponse.json({ error: 'Enter a valid maximum price.' }, { status: 400 });
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) return NextResponse.json({ error: 'Choose between 1 and 9 passengers.' }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!['Daily', 'Weekly', 'Monthly'].includes(body.frequency)) return NextResponse.json({ error: 'Choose a valid search frequency.' }, { status: 400 });
    if (!['economy', 'premium_economy', 'business', 'first'].includes(cabin)) return NextResponse.json({ error: 'Choose a valid cabin.' }, { status: 400 });
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
      cabin,
      passengers,
    } as const;

    await ensureSchema();

    const currentUser = await getCurrentUser();
    let userId = currentUser?.id;
    let signInEmailSent = false;

    if (!userId) {
      const account = await createMagicLink(email);
      await sendMagicLinkEmail(email, account.url);
      userId = account.userId;
      signInEmailSent = true;
    }

    const db = getDb();
    const client = await db.connect();
    let alertId = '';

    try {
      await client.query('BEGIN');
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [userId]);

      const accountResult = await client.query<{ plan: string }>(
        'select plan from users where id = $1 limit 1',
        [userId],
      );
      const plan = accountResult.rows[0]?.plan ?? 'free';

      if (plan !== 'pro') {
        const alertCountResult = await client.query<{ count: string }>(
          'select count(*)::text as count from alerts where user_id = $1',
          [userId],
        );
        const alertCount = Number(alertCountResult.rows[0]?.count ?? 0);

        if (alertCount >= 1) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            {
              error: 'Free accounts can have one alert. Upgrade to TripSignal Pro to create unlimited alerts.',
              code: 'FREE_ALERT_LIMIT',
              limit: 1,
            },
            { status: 403 },
          );
        }
      }

      const inserted = await client.query<{ id: string }>(
        `insert into alerts (email, user_id, criteria, frequency)
         values ($1, $2, $3::jsonb, $4)
         returning id`,
        [email, userId, JSON.stringify(criteria), criteria.frequency],
      );
      alertId = inserted.rows[0]?.id ?? '';
      if (!alertId) throw new Error('Could not create alert.');

      await client.query('COMMIT');
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }

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
      accountCreated: !currentUser,
      signInEmailSent,
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
