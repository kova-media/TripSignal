import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError, recordAdminAction } from '@/lib/admin';
import { runAlertSearch } from '@/lib/alerts';

type RouteContext = { params: Promise<{ id: string }> };

type AlertRow = {
  id: string;
  email: string;
  criteria: Parameters<typeof runAlertSearch>[2];
  active: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = body.action;
    if (!['toggle', 'retry'].includes(action || '')) return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });

    const db = getDb();
    const result = await db.query<AlertRow>('select id, email, criteria, active from alerts where id = $1 limit 1', [id]);
    const alert = result.rows[0];
    if (!alert) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });

    if (action === 'toggle') {
      const nextActive = !alert.active;
      await db.query('update alerts set active = $1 where id = $2', [nextActive, id]);
      await recordAdminAction(admin.email, nextActive ? 'resume_alert' : 'pause_alert', 'alert', id);
      return NextResponse.json({ ok: true, active: nextActive });
    }

    const run = await runAlertSearch(alert.id, alert.email, alert.criteria);
    await recordAdminAction(admin.email, 'retry_alert_search', 'alert', id, { offers: run.offers.length, emailed: run.emailed });
    return NextResponse.json({ ok: true, offers: run.offers.length, emailed: run.emailed });
  } catch (error) {
    if (isAdminError(error)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const message = error instanceof Error ? error.message : 'Admin action failed.';
    console.error('TripSignal admin alert action error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
