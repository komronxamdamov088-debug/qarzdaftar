-- Notification preferences (CLAUDE.md section 20 & 27). Telegram defaults to
-- off so a newly linked account doesn't start double-sending alongside Web
-- Push until the user explicitly opts in.

alter table users
  add column push_enabled boolean not null default true,
  add column telegram_enabled boolean not null default false;
