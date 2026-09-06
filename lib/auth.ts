import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { getDb, ensureSchema } from '@/lib/db';

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = 'tripsignal_session';
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

type MagicLinkResult = {
  userId: string;
  email: string;
  url: string;
};

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

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, keyHex] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createSession(userId: string, email: string) {
  const db = getDb();
  const sessionToken = randomBytes(32).toString('hex');
  await db.query(
    `insert into sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + ($3 * interval '1 day'))`,
    [userId, hashToken(sessionToken), SESSION_DAYS],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return { id: userId, email };
}

export async function signUp(email: string, password: string) {
  await ensureSchema();
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const result = await db.query<{ id: string; email: string }>(
    `insert into users (email, password_hash) values ($1, $2)
     on conflict (email) do update set password_hash = coalesce(users.password_hash, excluded.password_hash)
     returning id, email`,
    [normalizedEmail, passwordHash],
  );
  const user = result.rows[0];
  if (!user) throw new Error('Could not create account.');

  const existing = await db.query<{ password_hash: string | null }>('select password_hash from users where id = $1', [user.id]);
  if (!existing.rows[0]?.password_hash) throw new Error('Could not create account.');
  if (existing.rows[0].password_hash !== passwordHash) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  return createSession(user.id, user.email);
}

export async function setPasswordForCurrentUser(password: string) {
  await ensureSchema();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const db = getDb();
  const result = await db.query<{ id: string; email: string }>(
    `select users.id, users.email
     from sessions
     join users on users.id = sessions.user_id
     where sessions.token_hash = $1 and sessions.expires_at > now()
     limit 1`,
    [hashToken(sessionToken)],
  );
  const user = result.rows[0];
  if (!user) return null;

  const passwordHash = await hashPassword(password);
  await db.query('update users set password_hash = $1 where id = $2', [passwordHash, user.id]);
  return user;
}

export async function signIn(email: string, password: string) {
  await ensureSchema();
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.query<{ id: string; email: string; password_hash: string | null }>(
    'select id, email, password_hash from users where email = $1 limit 1',
    [normalizedEmail],
  );
  const user = result.rows[0];
  if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) return null;
  return createSession(user.id, user.email);
}

export async function createMagicLink(email: string, name?: string): Promise<MagicLinkResult> {
  await ensureSchema();
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim().replace(/\s+/g, ' ') || '';
  const userResult = await db.query<{ id: string }>(
    `insert into users (email, name) values ($1, nullif($2, ''))
     on conflict (email) do update set name = coalesce(users.name, excluded.name)
     returning id`,
    [normalizedEmail, normalizedName],
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
    userId,
    email: normalizedEmail,
    url: `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`,
  };
}

export async function consumeMagicLink(token: string) {
  await ensureSchema();
  const db = getDb();
  const tokenHash = hashToken(token);
  const result = await db.query<{ user_id: string; email: string; password_hash: string | null }>(
    `select auth_tokens.user_id, users.email, users.password_hash
     from auth_tokens
     join users on users.id = auth_tokens.user_id
     where auth_tokens.token_hash = $1 and auth_tokens.expires_at > now()
     limit 1`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;

  await db.query('delete from auth_tokens where token_hash = $1', [tokenHash]);
  const user = await createSession(row.user_id, row.email);
  return { ...user, hasPassword: Boolean(row.password_hash) };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; email: string; name: string | null }>(
    `select users.id, users.email, users.name
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
