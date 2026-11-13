import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { storePendingReferral } from '@/lib/referrals';
import { sendMagicLinkEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Enter your name.' }, { status: 400 });
    }

    if (!validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    // 5 signups/hour per email and per IP.
    const ip = getClientIp(request);
    if (
      !checkRateLimit(`signup:email:${email}`, 5, 60 * 60 * 1000) ||
      !checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60 * 1000)
    ) {
      return NextResponse.json({ error: 'Too many sign-up attempts. Try again in an hour.' }, { status: 429 });
    }

    const { url, userId, isNewUser } = await createMagicLink(email, name);
    // Referral is NOT granted here: the code is only stored, and only
    // for a newly-created user. The grant happens after the magic link
    // is clicked (grantPendingReferral, wired into the verify route),
    // so unverified signups cannot farm referrer bonuses. Re-signup of
    // an existing account never stores (or grants) a code.
    const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : '';
    if (isNewUser && /^[A-Z0-9]{8}$/.test(referralCode)) {
      try {
        await storePendingReferral(userId, referralCode);
      } catch (error) {
        console.error('TripSignal signup referral error:', error);
      }
    }
    await sendMagicLinkEmail(email, url);
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('TripSignal sign-up email error:', error);
    return NextResponse.json({ error: 'We could not send the verification link. Please try again.' }, { status: 500 });
  }
}
