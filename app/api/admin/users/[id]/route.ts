import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError, recordAdminAction } from '@/lib/admin';

type RouteContext = { params: Promise<{ id: string }> };
type AdminAction = 'demote_to_free' | 'grant_pro';

const ALERT_FROM_EMAIL = 'TripSignal Alerts <alerts@tripsignal.travel>';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));
}

async function sendLifetimeProEmail(email: string) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured.');

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: ALERT_FROM_EMAIL,
    to: [email],
    subject: 'You’ve been granted lifetime TripSignal Pro access',
    text: `You’ve been granted lifetime TripSignal Pro access.\n\nYour TripSignal account has been upgraded to Pro at no cost. You will have unlimited fare alerts and Pro access for life. No payment is required.\n\nYou can sign in and manage your alerts at https://tripsignal.travel.\n\nTripSignal`,
    html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lifetime TripSignal Pro access</title></head><body style="margin:0;background:#f6f5f1;color:#151817;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5f1"><tr><td align="center" style="padding:40px 18px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fffefa;border:1px solid #dedfda"><tr><td style="height:5px;background:#5b8def;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:34px 36px 12px"><div style="font-size:19px;line-height:24px;font-weight:800;letter-spacing:-.04em;color:#151817">TripSignal</div><div style="margin-top:9px;color:#5b8def;font-size:10px;line-height:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Pro access</div></td></tr><tr><td style="padding:16px 36px 36px"><h1 style="margin:0;color:#151817;font-size:38px;line-height:40px;letter-spacing:-.055em">You have lifetime Pro access.</h1><p style="margin:18px 0 0;color:#6f7471;font-size:16px;line-height:26px">Your TripSignal account has been upgraded to Pro at no cost.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;border:1px solid #dedfda;background:#f9f9f5"><tr><td style="padding:20px 22px"><div style="color:#151817;font-size:17px;line-height:26px;font-weight:700">Lifetime Pro access</div><div style="margin-top:7px;color:#6f7471;font-size:14px;line-height:23px">Unlimited fare alerts. No payment required. No expiration.</div></td></tr></table><p style="margin:24px 0 0;color:#6f7471;font-size:14px;line-height:23px">You can now use all Pro features for life. Sign in to manage your fare alerts.</p><p style="margin:26px 0 0"><a href="https://tripsignal.travel" style="display:inline-block;background:#5b8def;color:#fff;text-decoration:none;padding:13px 20px;border-radius:7px;font-size:14px;line-height:18px;font-weight:700">Open TripSignal</a></p></td></tr><tr><td style="padding:20px 36px;border-top:1px solid #dedfda;color:#969b98;font-size:11px;line-height:17px">TripSignal · automated fare monitoring<br>tripsignal.travel</td></tr></table></td></tr></table></body></html>`,
  });

  if (error) throw new Error(error.message);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: AdminAction };

    if (!['demote_to_free', 'grant_pro'].includes(body.action ?? '')) {
      return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [id]);

      const userResult = await client.query<{ id: string; email: string; plan: string; subscription_status: string }>(
        'select id, email, plan, subscription_status from users where id = $1 limit 1',
        [id],
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      if (body.action === 'grant_pro') {
        if (user.plan !== 'free') {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Account is already Pro.' }, { status: 400 });
        }

        await client.query(
          `update users
           set plan = 'pro', subscription_status = 'canceled', stripe_subscription_id = null,
               subscription_current_period_end = null, updated_at = now()
           where id = $1`,
          [id],
        );

        await client.query('COMMIT');
        await recordAdminAction(admin.email, 'grant_pro_free', 'user', id, {
          previousPlan: user.plan,
          previousSubscriptionStatus: user.subscription_status,
        });

        let emailSent = true;
        try {
          await sendLifetimeProEmail(user.email);
        } catch (emailError) {
          emailSent = false;
          console.error('TripSignal lifetime Pro email failed:', emailError);
        }

        return NextResponse.json({ ok: true, plan: 'pro', emailSent });
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
        `select id from alerts
         where user_id = $1 or lower(email) = lower($2)
         order by created_at asc, id asc`,
        [id, user.email],
      );

      await client.query(
        `update users
         set plan = 'free', subscription_status = 'canceled', stripe_subscription_id = null,
             subscription_current_period_end = null, updated_at = now()
         where id = $1`,
        [id],
      );

      const extraAlertIds = alertsResult.rows.slice(1).map((row) => row.id);
      if (extraAlertIds.length) {
        await client.query(
          'update alerts set active = false where id = any($1)',
          [extraAlertIds],
        );
      }

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
