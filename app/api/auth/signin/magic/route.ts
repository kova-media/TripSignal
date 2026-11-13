import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { getDb, ensureSchema } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // 5 sign-in links/hour per email and per IP.
  const ip = getClientIp(request);
  if (
    !checkRateLimit(`magic:email:${email}`, 5, 60 * 60 * 1000) ||
    !checkRateLimit(`magic:ip:${ip}`, 5, 60 * 60 * 1000)
  ) {
    return NextResponse.json({ error: 'Too many sign-in attempts. Try again in an hour.' }, { status: 429 });
  }

  await ensureSchema();
  const existing = await getDb().query('select id from users where email = $1 limit 1', [email]);

  // Always respond the same way so we don't reveal which emails have
  // accounts. Unknown emails get no link (and no account is created for
  // them — createMagicLink would otherwise upsert a user row).
  if (existing.rows.length > 0) {
    try {
      const link = await createMagicLink(email);
      await sendMagicLinkEmail(email, link.url);
    } catch (error) {
      console.error('TripSignal magic sign-in error:', error);
      return NextResponse.json({ error: 'Could not send the sign-in link. Try again in a moment.' }, { status: 500 });
    }
  }
  return NextResponse.json({ sent: true });
}
