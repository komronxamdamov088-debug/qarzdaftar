-- Adds provider metadata to `payments` and rewrites `record_payment` to
-- optionally persist it. Existing call sites (the manual/cash flow in
-- PaymentsService.create) keep working unmodified — the new params default
-- to the previous cash behavior, and every existing ownership/status/amount
-- check (DEBT_NOT_FOUND/FORBIDDEN/DEBT_NOT_PAYABLE/INVALID_AMOUNT/
-- AMOUNT_EXCEEDS_REMAINING) from 0002 is preserved byte-for-byte.

alter table payments
  add column user_id uuid references users(id) on delete set null,
  add column method text not null default 'cash'
    check (method in ('cash', 'click', 'payme', 'qulay_pay')),
  add column provider_transaction_id text,
  add column payment_transaction_id uuid
    references payment_transactions(id) on delete set null;

create or replace function record_payment(
  p_debt_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_note text default null,
  p_method text default 'cash',
  p_provider_transaction_id text default null,
  p_payment_transaction_id uuid default null
)
returns payments
language plpgsql
as $$
declare
  v_debt debts%rowtype;
  v_payment payments%rowtype;
begin
  select * into v_debt from debts where id = p_debt_id for update;

  if not found then
    raise exception 'DEBT_NOT_FOUND';
  end if;

  if v_debt.lender_id <> p_user_id and v_debt.borrower_id <> p_user_id then
    raise exception 'FORBIDDEN';
  end if;

  if v_debt.status in ('paid', 'cancelled') then
    raise exception 'DEBT_NOT_PAYABLE';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_amount > v_debt.remaining_amount then
    raise exception 'AMOUNT_EXCEEDS_REMAINING';
  end if;

  insert into payments (
    debt_id, amount, note, user_id, method,
    provider_transaction_id, payment_transaction_id
  )
  values (
    p_debt_id, p_amount, p_note, p_user_id, p_method,
    p_provider_transaction_id, p_payment_transaction_id
  )
  returning * into v_payment;

  update debts
  set
    remaining_amount = v_debt.remaining_amount - p_amount,
    status = case
      when v_debt.remaining_amount - p_amount <= 0 then 'paid'
      else 'partially_paid'
    end
  where id = p_debt_id;

  return v_payment;
end;
$$;
