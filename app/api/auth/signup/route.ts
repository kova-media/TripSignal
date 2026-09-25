import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { getDb, ensureSchema } from '@/lib/db';

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function applySignupReferral(userId: string, code: string) {
  await ensureSchema();
  const db = getDb();
  const owner = await db.query<{ id: string }>('select id from users where referral_code = $1 limit 1', [code]);
  const referrerId = owner.rows[0]?.id;
  if (!referrerId || referrerId === userId) return;
  const updated = await db.query('update users set referred_by = $2 where id = $1 and referred_by is null', [userId, referrerId]);
  if (updated.rowCount === 1) {
    await db.query('update users set bonus_watches = coalesce(bonus_watches, 0) + 1 where id = $1', [referrerId]);
  }
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

    const { url, userId } = await createMagicLink(email, name);
    const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : '';
    if (/^[A-Z0-9]{8}$/.test(referralCode)) {
      try {
        await applySignupReferral(userId, referralCode);
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
