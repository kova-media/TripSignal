import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { buildAffiliateUrl, isAffiliateVertical } from '@/lib/affiliates';

const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';

type DestinationLookup = {
  type?: string;
  code?: string;
  city_name?: string;
  country_code?: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;

  if (!isAffiliateVertical(vertical)) {
    return NextResponse.json({ error: 'Unknown affiliate category.' }, { status: 404 });
  }

  const destination = request.nextUrl.searchParams.get('destination')?.trim() || undefined;
  const origin = request.nextUrl.searchParams.get('origin')?.trim() || undefined;
  const departureDate = request.nextUrl.searchParams.get('departureDate')?.trim() || undefined;
  const returnDate = request.nextUrl.searchParams.get('returnDate')?.trim() || undefined;
  // Unvalidated ids used to 500 the whole redirect on a bad UUID. Only
  // well-formed UUIDs are ever attributed.
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rawAlertId = request.nextUrl.searchParams.get('alertId')?.trim() || undefined;
  const rawSignalId = request.nextUrl.searchParams.get('signalId')?.trim() || undefined;
  let alertId = rawAlertId && uuidPattern.test(rawAlertId) ? rawAlertId : undefined;
  let signalId = rawSignalId && uuidPattern.test(rawSignalId) ? rawSignalId : undefined;

  const metadata = destination ? await resolveDestination(destination) : null;
  const targetUrl = buildAffiliateUrl(vertical, {
    destination,
    destinationCity: metadata?.city,
    destinationCountryCode: metadata?.countryCode,
    origin,
    departureDate,
    returnDate,
    alertId,
    signalId,
  });

  if (!targetUrl) {
    return NextResponse.json({ error: 'Affiliate partner is not configured yet.' }, { status: 503 });
  }

  await ensureSchema();
  const user = await getCurrentUser();
  const db = getDb();

  // Where a session exists, only attribute clicks on the visitor's own
  // alerts/signals. Someone else's ids are dropped from the attribution —
  // the redirect still happens.
  if (user && (alertId || signalId)) {
    try {
      if (alertId) {
        const owned = await db.query('select id from alerts where id = $1 and user_id = $2 and deleted_at is null limit 1', [alertId, user.id]);
        if (!owned.rowCount) alertId = undefined;
      }
      if (signalId) {
        const owned = await db.query('select s.id from signals s join alerts a on a.id = s.alert_id where s.id = $1 and a.user_id = $2 and a.deleted_at is null limit 1', [signalId, user.id]);
        if (!owned.rowCount) signalId = undefined;
      }
    } catch (error) {
      console.error('TripSignal affiliate ownership check failed:', error);
      alertId = undefined;
      signalId = undefined;
    }
  }

  // Attribution must never block the redirect: any insert failure is
  // logged and the user still reaches the partner.
  try {
    await db.query(
      `insert into affiliate_clicks
        (user_id, vertical, provider, destination, origin, departure_date, return_date, alert_id, signal_id, referrer, user_agent)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        user?.id ?? null,
        vertical,
        getProviderKey(vertical),
        destination ?? null,
        origin ?? null,
        departureDate ?? null,
        returnDate ?? null,
        alertId ?? null,
        signalId ?? null,
        request.headers.get('referer'),
        request.headers.get('user-agent'),
      ],
    );
  } catch (error) {
    console.error('TripSignal affiliate click insert failed:', error);
  }

  return NextResponse.redirect(targetUrl, 302);
}

async function resolveDestination(destination: string) {
  try {
    const url = new URL(AUTOCOMPLETE_URL);
    url.searchParams.set('term', destination);
    url.searchParams.set('locale', 'en');
    url.searchParams.append('types[]', 'airport');
    url.searchParams.append('types[]', 'city');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;

    const places = (await response.json()) as DestinationLookup[];
    const match = places.find((place) => place.type === 'airport' && place.code?.toUpperCase() === destination.toUpperCase());
    if (!match?.city_name || !match.country_code) return null;

    return { city: match.city_name, countryCode: match.country_code };
  } catch {
    return null;
  }
}

function getProviderKey(vertical: string) {
  switch (vertical) {
    case 'cars': return 'discovercars';
    case 'parking': return 'awin-parking';
    default: return 'travelpayouts';
  }
}
