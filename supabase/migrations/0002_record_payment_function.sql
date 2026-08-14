-- Atomically records a payment against a debt and updates its remaining
-- amount/status, enforcing ownership and the "never negative" rule from
-- CLAUDE.md section 14. Row-locked via SELECT ... FOR UPDATE so concurrent
-- payments on the same debt can't push remaining_amount below zero.

create or replace function record_payment(
  p_debt_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_note text default null
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

  insert into payments (debt_id, amount, note)
  values (p_debt_id, p_amount, p_note)
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
