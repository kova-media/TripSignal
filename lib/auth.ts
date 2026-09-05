import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb, ensureSchema } from '@/lib/db';

const SESSION_COOKIE = 'tripsignal_session';
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function appUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export function getAppUrl() {
  return appUrl();
}

export async function createMagicLink(email: string) {
  await ensureSchema();
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const userResult = await db.query<{ id: string }>(
    `insert into users (email) values ($1)
     on conflict (email) do update set email = excluded.email
     returning id`,
    [normalizedEmail],
  );
  const userId = userResult.rows[0]?.id;
  if (!userId) throw new Error('Could not create account.');

  await db.query('delete from auth_tokens where user_id = $1 or expires_at < now()', [userId]);
  const token = randomBytes(32).toString('hex');
  await db.query(
    `insert into auth_tokens (user_id, token_hash, expires_at)
     values ($1, $2, now() + ($3 * interval '1 minute'))`,
    [userId, hashToken(token), MAGIC_LINK_MINUTES],
  );

  return {
    email: normalizedEmail,
    url: `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`,
  };
}

export async function consumeMagicLink(token: string) {
  await ensureSchema();
  const db = getDb();
  const tokenHash = hashToken(token);
  const result = await db.query<{ user_id: string; email: string }>(
    `select auth_tokens.user_id, users.email
     from auth_tokens
     join users on users.id = auth_tokens.user_id
     where auth_tokens.token_hash = $1 and auth_tokens.expires_at > now()
     limit 1`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;

  await db.query('delete from auth_tokens where token_hash = $1', [tokenHash]);
  const sessionToken = randomBytes(32).toString('hex');
  await db.query(
    `insert into sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + ($3 * interval '1 day'))`,
    [row.user_id, hashToken(sessionToken), SESSION_DAYS],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return { id: row.user_id, email: row.email };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; email: string }>(
    `select users.id, users.email
     from sessions
     join users on users.id = sessions.user_id
     where sessions.token_hash = $1 and sessions.expires_at > now()
     limit 1`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureSchema();
    await getDb().query('delete from sessions where token_hash = $1', [hashToken(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}
