-- Business/shop accounts: a shop owner uses QarzDaftar the same way a
-- personal user does (tracking who owes them money), but pays the app owner
-- a manually-managed monthly subscription outside the app (no self-serve
-- signup as a business). An admin flags an existing account as a business
-- and can flip subscription_active off immediately to cut off access if the
-- shop stops paying — see backend/src/auth/strategies/jwt.strategy.ts, which
-- enforces this on every authenticated request for role='user' accounts.
alter table users
  add column account_type text not null default 'personal'
    check (account_type in ('personal', 'business')),
  add column business_name text,
  add column subscription_active boolean not null default true;
