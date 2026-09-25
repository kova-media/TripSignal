import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

const E164 = /^\+[1-9]\d{7,14}$/;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { phone?: string; smsOptIn?: boolean } | null;
  const phone = String(body?.phone ?? '').trim();
  const smsOptIn = body?.smsOptIn === true;
  if (smsOptIn && !E164.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid phone number in international format, e.g. +17852171106.' }, { status: 400 });
  }
  await ensureSchema();
  const db = getDb();
  await db.query('update users set phone = $1, sms_opt_in = $2 where id = $3', [phone || null, smsOptIn && phone !== '', user.id]);
  return NextResponse.json({ ok: true });
}
