-- Defense-in-depth (CLAUDE.md section 32/45 security audit). The NestJS
-- backend is the sole database client and always connects with the
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses row-level security regardless of
-- whether it's enabled — so this migration changes nothing about how the app
-- behaves today. What it does is close the door on an *accidental future*
-- mistake: if the Supabase anon/public key were ever exposed to the frontend
-- (it currently never is — see CLAUDE.md section 33), these tables would
-- otherwise be wide open to any client with that key. No policies are
-- defined, which means "deny all" for every role except service_role.

alter table users enable row level security;
alter table debts enable row level security;
alter table payments enable row level security;
alter table reminders enable row level security;
alter table push_subscriptions enable row level security;
alter table telegram_connections enable row level security;
alter table notifications enable row level security;
alter table ai_reminder_logs enable row level security;
