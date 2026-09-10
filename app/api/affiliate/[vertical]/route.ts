import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { buildAffiliateUrl, isAffiliateVertical } from '@/lib/affiliates';

export async function GET(request: NextRequest, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;

  if (!isAffiliateVertical(vertical)) {
    return NextResponse.json({ error: 'Unknown affiliate category.' }, { status: 404 });
  }

  const destination = request.nextUrl.searchParams.get('destination')?.trim() || undefined;
  const origin = request.nextUrl.searchParams.get('origin')?.trim() || undefined;
  const departureDate = request.nextUrl.searchParams.get('departureDate')?.trim() || undefined;
  const returnDate = request.nextUrl.searchParams.get('returnDate')?.trim() || undefined;
  const alertId = request.nextUrl.searchParams.get('alertId')?.trim() || undefined;
  const signalId = request.nextUrl.searchParams.get('signalId')?.trim() || undefined;

  const targetUrl = buildAffiliateUrl(vertical, {
    destination,
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

  return NextResponse.redirect(targetUrl, 302);
}

function getProviderKey(vertical: string) {
  switch (vertical) {
    case 'cars': return 'discovercars';
    case 'parking': return 'awin-parking';
    default: return 'travelpayouts';
  }
}
