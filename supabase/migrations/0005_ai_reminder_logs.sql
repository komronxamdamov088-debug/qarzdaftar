-- AI reminder usage log (backs the admin "AI reminder usage" metric, CLAUDE.md
-- section 39). Written best-effort by AiService after a successful generation;
-- never blocks the user-facing reminder feature if the insert fails.

create table ai_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tone text not null
    check (tone in ('dostona', 'hurmatli', 'qisqa', 'rasmiy', 'hazilomuz')),
  created_at timestamptz not null default now()
);

create index ai_reminder_logs_user_id_idx on ai_reminder_logs(user_id);
