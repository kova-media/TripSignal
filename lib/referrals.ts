import { getDb, ensureSchema } from '@/lib/db';

// Referral grants. The bonus is granted exactly once per referred user:
// applySignupReferral only fires when the referred user's referred_by is
// still NULL, and the signup flow no longer grants at signup time — it
// only stores the code (see storePendingReferral) so the grant happens
// after the magic link is verified (see grantPendingReferral, wired into
// the verify route by the coordinator).

async function ensurePendingColumn() {
  // Slice B also adds this column in lib/db.ts ensureSchema; the
  // IF NOT EXISTS guard keeps this a harmless no-op once it lands.
  await getDb().query('alter table users add column if not exists pending_referral_code text');
}

function validCode(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(normalized) ? normalized : null;
}

/** Grant a referral bonus once. Returns true only when a grant happened. */
export async function applySignupReferral(userId: string, code: string): Promise<boolean> {
  const normalized = validCode(code);
  if (!normalized) return false;
  await ensureSchema();
  const db = getDb();
  const owner = await db.query<{ id: string }>('select id from users where referral_code = $1 limit 1', [normalized]);
  const referrerId = owner.rows[0]?.id;
  if (!referrerId || referrerId === userId) return false;
  // Atomic once-only guard: only a user who has never been referred
  // (referred_by IS NULL) can be granted, so replays and double
  // submissions cannot farm a second bonus for the referrer.
  const updated = await db.query('update users set referred_by = $2 where id = $1 and referred_by is null', [userId, referrerId]);
  if (updated.rowCount === 1) {
    await db.query('update users set bonus_watches = coalesce(bonus_watches, 0) + 1 where id = $1', [referrerId]);
    return true;
  }
  return false;
}

/** Store a referral code on a newly-created user, to be granted on verification. */
export async function storePendingReferral(userId: string, code: string): Promise<void> {
  const normalized = validCode(code);
  if (!normalized) return;
  await ensureSchema();
  await ensurePendingColumn();
  await getDb().query('update users set pending_referral_code = $2 where id = $1', [userId, normalized]);
}

/**
 * Grant the stored pending referral (if any) for a user whose email was
 * just verified, then clear the stored code either way so it can never
 * be granted twice. Returns true only when a grant happened.
 * Called from the magic-link verify route (coordinator wiring).
 */
export async function grantPendingReferral(userId: string): Promise<boolean> {
  await ensureSchema();
  await ensurePendingColumn();
  const db = getDb();
  const result = await db.query<{ pending_referral_code: string | null }>(
    'select pending_referral_code from users where id = $1 limit 1',
    [userId],
  );
  const code = result.rows[0]?.pending_referral_code ?? '';
  if (!code) return false;
  let granted = false;
  try {
    granted = await applySignupReferral(userId, code);
  } catch (error) {
    console.error('TripSignal pending referral error:', error);
  }
  await db.query('update users set pending_referral_code = null where id = $1', [userId]);
  return granted;
}
