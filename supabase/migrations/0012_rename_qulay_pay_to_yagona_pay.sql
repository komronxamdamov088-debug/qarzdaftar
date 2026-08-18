-- The third payment provider was documented and coded under the wrong
-- name ("Qulay Pay"). Its correct name is "Yagona Pay". Renames the
-- qulay_pay enum-like value to yagona_pay everywhere it's stored, and
-- rebuilds the two CHECK constraints that reference it.
--
-- No real Qulay Pay/Yagona Pay credentials or transactions have ever
-- existed — the provider has always thrown PROVIDER_NOT_CONFIGURED (see
-- backend/src/payment-providers/providers/yagona-pay.provider.ts) — so the
-- UPDATE statements below are defensive no-ops today. They're kept so this
-- migration stays correct if it's ever run against a database that already
-- has qulay_pay rows.
--
-- Constraint names are looked up dynamically (not hardcoded/guessed) so
-- this doesn't silently no-op or fail if Postgres named them differently
-- than the usual <table>_<column>_check convention.

update payment_transactions set provider = 'yagona_pay' where provider = 'qulay_pay';
update payments set method = 'yagona_pay' where method = 'qulay_pay';

do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'payment_transactions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%qulay_pay%';
  if v_conname is not null then
    execute format('alter table payment_transactions drop constraint %I', v_conname);
  end if;
end $$;

alter table payment_transactions
  add constraint payment_transactions_provider_check
  check (provider in ('click', 'payme', 'yagona_pay'));

do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'payments'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%qulay_pay%';
  if v_conname is not null then
    execute format('alter table payments drop constraint %I', v_conname);
  end if;
end $$;

alter table payments
  add constraint payments_method_check
  check (method in ('cash', 'click', 'payme', 'yagona_pay'));
