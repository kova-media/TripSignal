import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

// Unambiguous alphabet: no 0/O, no 1/I.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function codeFromSeed(seed: string): string {
  const hash = createHash('sha256').update(`tripsignal-referral:${seed}`).digest();
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[hash[i] % CODE_ALPHABET.length];
  return code;
}

async function ensureReferralCode(userId: string, current: string | null): Promise<string> {
  if (current) return current;
  const sql = getDb();
  let seed = userId;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = codeFromSeed(seed);
    try {
      const result = await sql.query<{ referral_code: string }>(
        'update users set referral_code = $1 where id = $2 and referral_code is null returning referral_code',
        [code, userId],
      );
      if (result.rows[0]?.referral_code) return result.rows[0].referral_code;
    } catch {
      // Unique collision with another user's code — retry with a salted variant.
    }
    const fresh = await sql.query<{ referral_code: string | null }>(
      'select referral_code from users where id = $1 limit 1',
      [userId],
    );
    if (fresh.rows[0]?.referral_code) return fresh.rows[0].referral_code;
    seed = `${userId}:${randomBytes(4).toString('hex')}`;
  }
  throw new Error('Could not generate a referral code.');
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  await ensureSchema();
  const sql = getDb();
  const result = await sql.query<{ referral_code: string | null; bonus_watches: number | null; referred_by: string | null }>(
    'select referral_code, bonus_watches, referred_by from users where id = $1 limit 1',
    [user.id],
  );
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const code = await ensureReferralCode(user.id, row.referral_code);
  return NextResponse.json({
    code,
    bonusWatches: Number(row.bonus_watches ?? 0),
    referredBy: Boolean(row.referred_by),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let raw = '';
  try {
    raw = String((await request.json())?.code ?? '');
  } catch {
    return NextResponse.json({ error: 'Enter a referral code.' }, { status: 400 });
  }
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: 'Enter a valid 8-character referral code.' }, { status: 400 });
  }

  await ensureSchema();
  const sql = getDb();
  const owner = await sql.query<{ id: string }>(
    'select id from users where referral_code = $1 limit 1',
    [code],
  );
  if (!owner.rows.length) {
    return NextResponse.json({ error: 'That referral code was not found.' }, { status: 404 });
  }
  const referrerId = owner.rows[0].id;
  if (referrerId === user.id) {
    return NextResponse.json({ error: 'You can’t redeem your own referral code.' }, { status: 400 });
  }

  const client = await sql.connect();
  try {
    await client.query('BEGIN');
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [user.id]);
    const me = await client.query<{ referred_by: string | null }>(
      'select referred_by from users where id = $1 limit 1',
      [user.id],
    );
    if (!me.rows.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    if (me.rows[0].referred_by) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'You’ve already redeemed a referral code.' }, { status: 409 });
    }
    await client.query('update users set referred_by = $2 where id = $1', [user.id, referrerId]);
    await client.query('update users set bonus_watches = coalesce(bonus_watches, 0) + 1 where id = $1', [referrerId]);
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}
