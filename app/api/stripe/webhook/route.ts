import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 400 });

    const payload = await request.text();
    const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    await ensureSchema();
    const db = getDb();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (userId) {
        await db.query(
          `update users
           set stripe_customer_id = coalesce($1, stripe_customer_id),
               stripe_subscription_id = coalesce($2, stripe_subscription_id),
               subscription_status = 'active'
           where id = $3`,
          [customerId || null, subscriptionId || null, userId],
        );
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      if (userId) {
        await db.query(
          `update users
           set stripe_customer_id = $1,
               stripe_subscription_id = $2,
               subscription_status = $3,
               subscription_current_period_end = to_timestamp($4)
           where id = $5`,
          [customerId, subscription.id, subscription.status, subscription.items.data[0]?.current_period_end ?? null, userId],
        );
      } else {
        await db.query(
          `update users
           set stripe_subscription_id = $1,
               subscription_status = $2,
               subscription_current_period_end = to_timestamp($3)
           where stripe_customer_id = $4`,
          [subscription.id, subscription.status, subscription.items.data[0]?.current_period_end ?? null, customerId],
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await db.query(
        `update users
         set subscription_status = 'canceled', subscription_current_period_end = to_timestamp($1)
         where stripe_subscription_id = $2`,
        [subscription.items.data[0]?.current_period_end ?? null, subscription.id],
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('TripSignal Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 400 });
  }
}
