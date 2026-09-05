create extension if not exists pgcrypto;

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  criteria jsonb not null,
  frequency text not null check (frequency in ('Weekly', 'Monthly')),
  active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

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
