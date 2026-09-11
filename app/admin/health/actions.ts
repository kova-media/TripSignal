'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';
import { ensureSchema } from '@/lib/db';
import { runDueAlerts } from '@/lib/alerts';

export async function runAlertsNow() {
  await requireAdmin();
  await ensureSchema();
  await runDueAlerts();
  revalidatePath('/admin/health');
}
