import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin`);

  const sessionId = new URL(request.url).searchParams.get('session_id');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!sessionId || !secretKey) return NextResponse.redirect(`${origin}/account?billing=error`);

  let response: Response;
  try {
    response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}` },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('TripSignal billing success error:', error);
    return NextResponse.redirect(`${origin}/account?billing=error`);
  }
  const session = await response.json();

  const sessionUserId = session?.metadata?.user_id || session?.metadata?.userId || session?.client_reference_id;
  if (response.ok && sessionUserId === user.id && session.mode === 'subscription' && session.payment_status === 'paid') {
    try {
      await ensureSchema();
      // Record the full subscription state from the verified session —
      // not just plan='pro' — so profile/account and the checkout guard
      // agree on whether this user is Pro.
      await getDb().query(
        `update users
         set plan = 'pro',
             subscription_status = 'active',
             stripe_customer_id = coalesce($2, stripe_customer_id),
             stripe_subscription_id = coalesce($3, stripe_subscription_id)
         where id = $1`,
        [
          user.id,
          typeof session.customer === 'string' ? session.customer : null,
          typeof session.subscription === 'string' ? session.subscription : null,
        ],
      );
    } catch (error) {
      console.error('TripSignal billing success error:', error);
      return NextResponse.redirect(`${origin}/account?billing=error`);
    }
    return NextResponse.redirect(`${origin}/account`);
  }

  return NextResponse.redirect(`${origin}/account?billing=error`);
}
