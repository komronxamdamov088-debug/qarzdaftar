-- Self-serve shop registration + subscription purchase. The Mini App is now
-- gated to business accounts with an active subscription (see
-- backend/src/common/guards/subscription-gate.guard.ts) -- a personal
-- account without access_override can no longer use the app at all. This
-- migration adds the two pieces that gate needs:
--   - access_override: an admin-controlled manual exemption, used to keep
--     pre-existing real personal accounts (friends/family already using the
--     app before this change) working without forcing them to become a shop.
--   - subscription_plan_months + subscription_transactions: the self-serve
--     "register as a shop, pick 1 or 2 months, pay via Click/Payme/Yagona
--     Pay" flow. Mirrors payment_transactions (migration 0008) exactly, but
--     for subscribing to the platform itself rather than paying off a debt --
--     kept as a separate table because the terminal webhook action is
--     completely different (activate a subscription vs. record a debt
--     payment), not because the provider integration differs.

alter table users
  add column access_override boolean not null default false,
  add column subscription_plan_months integer
    check (subscription_plan_months in (1, 2));

create table subscription_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('click', 'payme', 'yagona_pay')),
  provider_transaction_id text,
  plan_months integer not null check (plan_months in (1, 2)),
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'cancelled')),
  checkout_url text,
  raw_webhook_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscription_transactions_user_id_idx on subscription_transactions(user_id);
create index subscription_transactions_status_idx on subscription_transactions(status);

-- Same idempotency guarantee as payment_transactions_provider_txn_idx.
create unique index subscription_transactions_provider_txn_idx
  on subscription_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;

create trigger subscription_transactions_set_updated_at
  before update on subscription_transactions
  for each row execute function set_updated_at();

alter table subscription_transactions enable row level security;
