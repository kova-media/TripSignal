import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin`);

  const sessionId = new URL(request.url).searchParams.get('session_id');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!sessionId || !secretKey) return NextResponse.redirect(`${origin}/account`);

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}` },
    cache: 'no-store',
  });
  const session = await response.json();

  const sessionUserId = session?.metadata?.user_id || session?.client_reference_id;
  if (response.ok && sessionUserId === user.id && session.mode === 'subscription' && session.payment_status === 'paid') {
    await ensureSchema();
    await getDb().query(`update users set plan = 'pro' where id = $1`, [user.id]);
  }

  return NextResponse.redirect(`${origin}/account`);
}
