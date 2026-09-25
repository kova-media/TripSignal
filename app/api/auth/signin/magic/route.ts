import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { getDb, ensureSchema } from '@/lib/db';

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

  await ensureSchema();
  const existing = await getDb().query('select id from users where email = $1 limit 1', [email]);
  if (!existing.rows.length) {
    return NextResponse.json({ error: 'No TripSignal account found for that email. Sign up first.' }, { status: 404 });
  }

  try {
    const link = await createMagicLink(email);
    await sendMagicLinkEmail(email, link.url);
  } catch (error) {
    console.error('TripSignal magic sign-in error:', error);
    return NextResponse.json({ error: 'Could not send the sign-in link. Try again in a moment.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
