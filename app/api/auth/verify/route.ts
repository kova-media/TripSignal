import { NextResponse } from 'next/server';
import { consumeMagicLink } from '@/lib/auth';
import { grantPendingReferral } from '@/lib/referrals';
import { activatePendingAlerts } from '@/lib/alerts';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get('token');
  if (!token) return NextResponse.redirect(new URL('/signin?error=missing', request.url));

  try {
    const user = await consumeMagicLink(token);
    if (!user) return NextResponse.redirect(new URL('/signin?error=expired', request.url));

    // First successful verification: grant any referral bonus the user signed
    // up with, and activate alerts created while signed out (they were
    // pending until the email was proven). Best-effort: a failure here must
    // not block sign-in.
    try {
      await grantPendingReferral(user.id);
    } catch (error) {
      console.error('TripSignal referral grant error:', error);
    }
    try {
      await activatePendingAlerts(user.id);
    } catch (error) {
      console.error('TripSignal pending-alert activation error:', error);
    }

    const next = params.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    const destination = safeNext ?? (user.hasPassword ? '/account' : '/account/setup');
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('TripSignal sign-in verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=failed', request.url));
  }
}
