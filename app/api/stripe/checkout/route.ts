import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import { getStripe, getStripePriceId } from '@/lib/stripe';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Sign in before subscribing.' }, { status: 401 });

    await ensureSchema();
    const db = getDb();
    const result = await db.query<{ stripe_customer_id: string | null; subscription_status: string }>(
      'select stripe_customer_id, subscription_status from users where id = $1 limit 1',
      [user.id],
    );
    const billing = result.rows[0];
    if (billing?.subscription_status === 'active' || billing?.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'Your TripSignal subscription is already active.' }, { status: 409 });
    }

    const stripe = getStripe();
    const customerId = billing?.stripe_customer_id || undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://tripsignal.travel';

    const sessionParams = {
      mode: 'subscription' as const,
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${appUrl}/profile?checkout=success`,
      cancel_url: `${appUrl}/profile?checkout=cancelled`,
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
    );

    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start checkout.';
    console.error('TripSignal Stripe checkout error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
