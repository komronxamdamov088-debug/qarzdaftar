-- Backs the shareable confirmation link from CLAUDE.md section 12. The token
-- is random and unguessable, so the unauthenticated recipient can view and
-- confirm/reject the debt without needing an account yet.

alter table debts
  add column confirmation_token uuid not null default gen_random_uuid();

create unique index debts_confirmation_token_idx on debts(confirmation_token);
