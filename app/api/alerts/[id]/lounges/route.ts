import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import { extractAirportContexts, loungeDirectoryLinks, normalizeAirportCode } from '@/lib/lounges';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid alert id.' }, { status: 400 });

  await ensureSchema();
  const db = getDb();
  const alert = await db.query<{ id: string; criteria: any }>('select id, criteria from alerts where id = $1 and user_id = $2 limit 1', [id, user.id]);
  if (!alert.rows[0]) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });

  const observation = await db.query<{ offer: any; observed_at: string }>(
    'select offer, observed_at from fare_observations where alert_id = $1 order by observed_at desc limit 1',
    [id],
  );

  const latest = observation.rows[0];
  const contexts = latest ? extractAirportContexts(latest.offer) : [];
  const airportCodes = [...new Set(contexts.map((item) => normalizeAirportCode(item.airport)).filter(Boolean))];

  const lounges = airportCodes.length
    ? await db.query<{
        id: string; airport: string; name: string; terminal: string | null; location: string | null;
        airside: boolean | null; access_methods: string[]; membership_required: boolean | null;
        day_pass_price: string | null; hourly_price: string | null; max_stay: string | null;
        amenities: string[]; guest_policy: string | null; hours: string | null; source_name: string | null;
        source_url: string | null; last_verified_at: string | null;
      }>(
        `select id, airport, name, terminal, location, airside, access_methods, membership_required,
                day_pass_price, hourly_price, max_stay, amenities, guest_policy, hours,
                source_name, source_url, last_verified_at
         from airport_lounges
         where airport = any($1::text[])
         order by airport, name`,
        [airportCodes],
      )
    : { rows: [] };

  const loungeRows = lounges.rows.map((lounge) => ({
    id: lounge.id,
    airport: lounge.airport,
    name: lounge.name,
    terminal: lounge.terminal,
    location: lounge.location,
    airside: lounge.airside,
    accessMethods: Array.isArray(lounge.access_methods) ? lounge.access_methods : [],
    membershipRequired: lounge.membership_required,
    dayPassPrice: lounge.day_pass_price,
    hourlyPrice: lounge.hourly_price,
    maxStay: lounge.max_stay,
    amenities: Array.isArray(lounge.amenities) ? lounge.amenities : [],
    guestPolicy: lounge.guest_policy,
    hours: lounge.hours,
    sourceName: lounge.source_name,
    sourceUrl: lounge.source_url,
    lastVerifiedAt: lounge.last_verified_at,
  }));

  return NextResponse.json({
    route: {
      origin: alert.rows[0].criteria?.origin ?? null,
      destination: alert.rows[0].criteria?.destination ?? null,
    },
    observedAt: latest?.observed_at ?? null,
    itineraryFound: Boolean(latest),
    airports: contexts.map((item) => ({
      ...item,
      directories: loungeDirectoryLinks(item.airport),
    })),
    lounges: loungeRows,
  });
}
