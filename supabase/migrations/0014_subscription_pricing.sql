-- Adds per-shop subscription pricing/discount/bonus tracking on top of the
-- existing subscription_active on/off flag (migration 0013). No billing
-- engine: the admin manually records the monthly price, an optional current
-- discount, and can extend "paid through" by adding bonus days. None of this
-- automatically flips subscription_active — that stays a manual admin action.
alter table users
  add column subscription_price numeric not null default 0,
  add column subscription_discount_percent numeric not null default 0
    check (subscription_discount_percent >= 0 and subscription_discount_percent <= 100),
  add column subscription_valid_until date;
