-- One receipt per successful payment (cash or provider) — generated for
-- EVERY successful payment per the user's own spec wording ("har bir
-- muvaffaqiyatli to'lovdan keyin"), not just provider ones. Stores a
-- point-in-time snapshot (names/amounts as they were at the moment of
-- payment) rather than joining users/debts live, so a later profile rename
-- or debt edit never retroactively changes a receipt that was already
-- issued.

create sequence receipt_number_seq;

create table receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references payments(id) on delete cascade,
  debt_id uuid not null references debts(id) on delete cascade,
  receipt_number text not null unique default (
    'QD-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('receipt_number_seq')::text, 6, '0')
  ),
  payer_name text not null,
  recipient_name text not null,
  payment_amount numeric(14, 2) not null,
  debt_original_amount numeric(14, 2) not null,
  debt_paid_amount numeric(14, 2) not null,
  debt_remaining_amount numeric(14, 2) not null,
  method text not null,
  debt_status text not null,
  locale text not null default 'uz' check (locale in ('uz', 'ru')),
  created_at timestamptz not null default now()
);

create index receipts_debt_id_idx on receipts(debt_id);

alter table receipts enable row level security;
