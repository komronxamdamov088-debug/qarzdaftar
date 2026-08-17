-- Payment-provider checkout/webhook tracking (Click/Payme/Qulay Pay).
-- Architecture only — no real provider credentials exist yet; every
-- PaymentProvider method throws a clear "not configured" error until real
-- env vars are set (see backend/src/payment-providers/), mirroring how
-- AiService behaves when AI_API_KEY is unset. record_payment (rewritten in
-- 0009) is only ever called from a verified webhook — never a fake success.

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('click', 'payme', 'qulay_pay')),
  provider_transaction_id text,
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'cancelled')),
  checkout_url text,
  raw_webhook_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_transactions_debt_id_idx on payment_transactions(debt_id);
create index payment_transactions_user_id_idx on payment_transactions(user_id);
create index payment_transactions_status_idx on payment_transactions(status);

-- Idempotency: a given provider can only ever be linked to one of our
-- transaction rows for a given provider-side id, so a webhook retry/replay
-- can't be applied twice (CLAUDE.md section 32 duplicate-prevention, same
-- template as the reminders module's `unique (debt_id, type)`).
create unique index payment_transactions_provider_txn_idx
  on payment_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;

create trigger payment_transactions_set_updated_at
  before update on payment_transactions
  for each row execute function set_updated_at();

alter table payment_transactions enable row level security;
