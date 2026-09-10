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
        name text,
        password_hash text,
        plan text not null default 'free',
        stripe_customer_id text unique,
        stripe_subscription_id text unique,
        subscription_status text not null default 'inactive',
        subscription_current_period_end timestamptz,
        created_at timestamptz not null default now()
      );

      alter table users add column if not exists name text;
      alter table users add column if not exists password_hash text;
      alter table users add column if not exists plan text not null default 'free';
      alter table users add column if not exists stripe_customer_id text;
      alter table users add column if not exists stripe_subscription_id text;
      alter table users add column if not exists subscription_status text not null default 'inactive';
      alter table users add column if not exists subscription_current_period_end timestamptz;
      create unique index if not exists users_stripe_customer_idx on users (stripe_customer_id) where stripe_customer_id is not null;
      create unique index if not exists users_stripe_subscription_idx on users (stripe_subscription_id) where stripe_subscription_id is not null;

      create table if not exists auth_tokens (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );

      alter table auth_tokens add column if not exists token_type text not null default 'magic';
      create index if not exists auth_tokens_expiry_idx on auth_tokens (expires_at);
      create index if not exists auth_tokens_user_type_idx on auth_tokens (user_id, token_type);

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

      create table if not exists alert_runs (
        id uuid primary key default gen_random_uuid(),
        alert_id uuid not null references alerts(id) on delete cascade,
        status text not null check (status in ('running', 'success', 'error')),
        started_at timestamptz not null default now(),
        finished_at timestamptz,
        offers_found integer not null default 0,
        email_sent boolean not null default false,
        error_message text
      );

      create index if not exists alert_runs_alert_idx on alert_runs (alert_id, started_at desc);
      create index if not exists alert_runs_status_idx on alert_runs (status, started_at desc);

      create table if not exists admin_audit_log (
        id uuid primary key default gen_random_uuid(),
        admin_email text not null,
        action text not null,
        target_type text,
        target_id text,
        details jsonb,
        created_at timestamptz not null default now()
      );

      create index if not exists admin_audit_log_created_idx on admin_audit_log (created_at desc);
    `).then(() => undefined);
  }

  await globalForDb.tripsignalSchemaReady;
}
