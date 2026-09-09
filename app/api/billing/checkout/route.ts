import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/signin?next=%2Fapi%2Fbilling%2Fcheckout`);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe billing is not configured.' }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][product_data][name]', 'TripSignal Pro');
  params.set('line_items[0][price_data][unit_amount]', '1999');
  params.set('line_items[0][price_data][recurring][interval]', 'year');
  params.set('line_items[0][quantity]', '1');
  params.set('customer_email', user.email);
  params.set('client_reference_id', user.id);
  params.set('metadata[user_id]', user.id);
  params.set('success_url', `${origin}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/account`);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok || !data.url) {
    console.error('TripSignal Stripe checkout error:', data);
    return NextResponse.json({ error: 'Could not start the Pro checkout.' }, { status: 502 });
  }

  return NextResponse.redirect(data.url);
}
