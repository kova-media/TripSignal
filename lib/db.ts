import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { tripsignalPool?: Pool; tripsignalSchemaReady?: Promise<void> };

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!globalForDb.tripsignalPool) {
    globalForDb.tripsignalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
    });
  }

  return globalForDb.tripsignalPool;
}

export async function ensureSchema() {
  if (!globalForDb.tripsignalSchemaReady) {
    const db = getDb();
    globalForDb.tripsignalSchemaReady = db.query(`
      create extension if not exists pgcrypto;

      create table if not exists users (
        id uuid primary key default gen_random_uuid(),
        email text not null unique,
        created_at timestamptz not null default now()
      );

      create table if not exists auth_tokens (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );

      create index if not exists auth_tokens_expiry_idx on auth_tokens (expires_at);

      create table if not exists sessions (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );

      create index if not exists sessions_expiry_idx on sessions (expires_at);

      create table if not exists alerts (
        id uuid primary key default gen_random_uuid(),
        email text not null,
        user_id uuid references users(id) on delete set null,
        criteria jsonb not null,
        frequency text not null check (frequency in ('Weekly', 'Monthly')),
        active boolean not null default true,
        last_checked_at timestamptz,
        created_at timestamptz not null default now()
      );

      alter table alerts add column if not exists user_id uuid references users(id) on delete set null;

      create index if not exists alerts_user_idx on alerts (user_id, created_at desc);
      create index if not exists alerts_due_idx on alerts (active, last_checked_at, frequency);

      create table if not exists signals (
        id uuid primary key default gen_random_uuid(),
        alert_id uuid not null references alerts(id) on delete cascade,
        offer_id text not null,
        offer jsonb not null,
        sent_at timestamptz not null default now(),
        unique (alert_id, offer_id)
      );

      create index if not exists signals_alert_idx on signals (alert_id, sent_at desc);
    `).then(() => undefined);
  }

  await globalForDb.tripsignalSchemaReady;
}
