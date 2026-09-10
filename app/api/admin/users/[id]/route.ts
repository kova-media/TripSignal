import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError, recordAdminAction } from '@/lib/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };

    if (body.action !== 'demote_to_free') {
      return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [id]);

      const userResult = await client.query<{ id: string; plan: string; subscription_status: string }>(
        'select id, plan, subscription_status from users where id = $1 limit 1',
        [id],
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      if (user.plan === 'free') {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Account is already Free.' }, { status: 400 });
      }

      if (['active', 'trialing'].includes(user.subscription_status)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'This account has an active or trialing subscription and cannot be demoted by this action.' }, { status: 400 });
      }

      const alertsResult = await client.query<{ id: string }>(
        'select id from alerts where user_id = $1 order by created_at asc, id asc',
        [id],
      );

      if (alertsResult.rows.length <= 1) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'This account does not have multiple alerts.' }, { status: 400 });
      }

      await client.query(
        `update users
         set plan = 'free', subscription_status = 'canceled', stripe_subscription_id = null,
             subscription_current_period_end = null, updated_at = now()
         where id = $1`,
        [id],
      );

      const extraAlertIds = alertsResult.rows.slice(1).map((row) => row.id);
      await client.query(
        'update alerts set active = false where id = any($1::uuid[])',
        [extraAlertIds],
      );

      await client.query('COMMIT');
      await recordAdminAction(admin.email, 'demote_user_to_free', 'user', id, {
        previousPlan: user.plan,
        previousSubscriptionStatus: user.subscription_status,
        pausedAlerts: extraAlertIds.length,
      });

      return NextResponse.json({ ok: true, pausedAlerts: extraAlertIds.length });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (isAdminError(error)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const message = error instanceof Error ? error.message : 'Admin action failed.';
    console.error('TripSignal admin user action error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
