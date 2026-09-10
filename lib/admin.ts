import { getCurrentUser } from '@/lib/auth';
import { ensureSchema, getDb } from '@/lib/db';

function configuredAdminEmails() {
  const value = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  return value.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !configuredAdminEmails().includes(user.email.toLowerCase())) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
  return user;
}

export async function recordAdminAction(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>,
) {
  await ensureSchema();
  await getDb().query(
    `insert into admin_audit_log (admin_email, action, target_type, target_id, details)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [adminEmail, action, targetType ?? null, targetId ?? null, details ? JSON.stringify(details) : null],
  );
}

export function isAdminError(error: unknown) {
  return error instanceof Error && error.message === 'ADMIN_UNAUTHORIZED';
}
