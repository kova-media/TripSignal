'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, recordAdminAction } from '@/lib/admin';
import { ensureSchema } from '@/lib/db';
import { runDueAlerts } from '@/lib/alerts';

export type RunAlertsNowSummary = { checked: number; signals: number; emails: number; errors: number; digests: number };
export type RunAlertsNowResult = { ok: true; summary: RunAlertsNowSummary } | { ok: false; error: string };

export async function runAlertsNow(): Promise<RunAlertsNowResult> {
  const admin = await requireAdmin();
  await ensureSchema();
  try {
    const summary = await runDueAlerts();
    try {
      await recordAdminAction(admin.email, 'run_alerts_now', 'alert_run', undefined, { ...summary });
    } catch (auditError) {
      console.error('TripSignal manual alert run audit failed:', auditError);
    }
    revalidatePath('/admin/health');
    revalidatePath('/admin');
    return { ok: true, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert run failed.';
    console.error('TripSignal manual alert run failed:', error);
    revalidatePath('/admin/health');
    revalidatePath('/admin');
    return { ok: false, error: message };
  }
}
