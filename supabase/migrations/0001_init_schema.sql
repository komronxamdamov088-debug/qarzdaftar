-- QarzDaftar initial schema
-- Run against Supabase PostgreSQL (see CLAUDE.md section 28)

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- users
-- =========================
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- =========================
-- debts
-- =========================
create table debts (
  id uuid primary key default gen_random_uuid(),
  lender_id uuid not null references users(id) on delete cascade,
  borrower_id uuid not null references users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  remaining_amount numeric(14, 2) not null check (remaining_amount >= 0),
  currency text not null default 'UZS',
  note text,
  due_date date,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_parties_differ check (lender_id <> borrower_id)
);

create index debts_lender_id_idx on debts(lender_id);
create index debts_borrower_id_idx on debts(borrower_id);
create index debts_status_idx on debts(status);
create index debts_due_date_idx on debts(due_date);

create trigger debts_set_updated_at
  before update on debts
  for each row execute function set_updated_at();

-- =========================
-- payments
-- =========================
create table payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index payments_debt_id_idx on payments(debt_id);

-- =========================
-- reminders
-- =========================
create table reminders (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null
    check (type in ('3_days_before', '1_day_before', 'due_date', '1_day_after', '3_days_after')),
  scheduled_at timestamptz not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (debt_id, type)
);

create index reminders_debt_id_idx on reminders(debt_id);
create index reminders_pending_scheduled_at_idx on reminders(scheduled_at) where status = 'pending';

-- =========================
-- push_subscriptions
-- =========================
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- =========================
-- telegram_connections
-- =========================
create table telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  telegram_id bigint not null unique,
  username text,
  created_at timestamptz not null default now()
);

create index telegram_connections_user_id_idx on telegram_connections(user_id);

-- =========================
-- notifications
-- =========================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_read_idx on notifications(user_id, read);
