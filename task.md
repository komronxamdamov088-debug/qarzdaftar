# QarzDaftar — Implementation Progress

Tracks progress against the MVP phases defined in `CLAUDE.md` section 44. Update this file as phases/tasks complete so progress survives across sessions.

## Phase 1 — Foundation ✅ DONE

- Next.js frontend scaffolded (TypeScript, Tailwind, App Router)
- NestJS backend scaffolded with full module layout (auth, users, debts, payments, reminders, notifications, push, telegram, ai, admin, database, common)
- Supabase client provider + hand-written `Database` types (`backend/src/database/database.types.ts`)
- DB schema migration `supabase/migrations/0001_init_schema.sql` (users, debts, payments, reminders, push_subscriptions, telegram_connections, notifications)
- Auth foundation: JWT strategy, global `JwtAuthGuard`/`RolesGuard`, `@Public()`/`@Roles()`/`@CurrentUser()` decorators, `/auth/*` stubs
- Basic app shell: root layout, Inter font, brand colors/Tailwind theme, `.env.example` for both apps

## Phase 2 — Core Debt ✅ DONE

- Backend: `UsersService` (find-or-create counterparty), `DebtsService`/`Controller` full CRUD with ownership checks, filters, sort, FK-embedded lender/borrower names
- Frontend: `/dashboard`, `/debts` (search/filter/sort), `/debts/new` (7-step add flow), `/debts/[id]` (detail/edit/delete), bottom nav

## Phase 3 — Payments ✅ DONE

- DB: `record_payment` Postgres function (migration `0002`) — atomic, row-locked, enforces ownership + non-negative remaining amount
- Backend: `GET/POST /debts/:debtId/payments`
- Frontend: payment history with progress bar, working "To'lov qo'shish" form

## Phase 4 — Confirmation ✅ DONE

- DB: `confirmation_token` column (migration `0003`)
- Backend: unauthenticated `GET/POST /debts/confirm/:token` (view + confirm/reject)
- Frontend: public `/confirm/[token]` page, "copy link" UI on debt detail

## Phase 5 — Notifications ✅ DONE

- DB: `push_enabled`/`telegram_enabled` prefs on `users` (migration `0004`, Telegram defaults OFF to avoid duplicate sends)
- Backend: Web Push (`web-push` + VAPID) subscribe/unsubscribe, Telegram bot `sendMessage`, `GET/PATCH /notifications`, `GET/POST /debts/:id/reminders`, `@nestjs/schedule` cron every 5 min processing due reminders
- Frontend: PWA manifest + `public/sw.js` (push, click, shell-only cache — never caches private pages), `/profile` (push + preference toggles), reminder picker on debt detail, `/activity` notifications list

**Known limitation:** none of Phases 2–5 could be tested live in a browser — login was still a stub, so every protected page only got build/lint verification.

## Phase 6 — Telegram Mini App 🔶 CODE-COMPLETE (live verification pending)

This phase delivers the **first real, working login** (previously `POST /auth/telegram` threw `NotImplementedException`). Once done, Phases 2–5 become testable end-to-end for real.

- [x] **Task 31** — Telegram `initData` verification (`backend/src/telegram/telegram-init-data.ts`): official HMAC-SHA256 algorithm, constant-time hash comparison, `auth_date` freshness check (max 24h). Builds clean.
- [x] **Task 32** — Real Telegram auth flow. DONE:
  - `TelegramService.findOrCreateUserByTelegramId(telegramId, name, username)` in `backend/src/telegram/telegram.service.ts` — looks up `telegram_connections` by `telegram_id`; if found, returns the linked user; otherwise creates a new `users` row + `telegram_connections` row.
  - `backend/src/auth/auth.service.ts`: `loginWithTelegram(initData)` → `verifyTelegramInitData` → find-or-create user → sign JWT (`{ sub, role }`) via `JwtService` → returns `{ accessToken, user }`.
  - `backend/src/auth/dto/telegram-auth.dto.ts`: `{ initData: string }` with `class-validator`.
  - `backend/src/auth/auth.controller.ts` `telegramLogin` now calls `AuthService.loginWithTelegram`.
  - `backend/src/auth/auth.module.ts`: imports `TelegramModule`, provides `AuthService`.
  - `npm run build` + `npm run lint` both clean in `backend/`.
- [x] **Task 33** — Frontend Mini App bootstrap. DONE:
  - `frontend/src/types/telegram.d.ts` — `window.Telegram.WebApp` global type (`initData`, `initDataUnsafe`, `themeParams`, `ready`/`expand`/`onEvent`/`offEvent`).
  - `frontend/src/lib/telegram-auth.ts` — `loginWithTelegramAction` Server Action, POSTs `initData` to `/auth/telegram` via `apiFetch`, sets the httpOnly `qd_session` cookie (`secure` gated on `NODE_ENV === "production"` so it still works when hitting a local dev backend over http).
  - `frontend/src/components/telegram-theme-sync.tsx` — client component mounted globally in root layout: calls `WebApp.ready()/expand()`, maps `themeParams` (`bg_color`/`text_color`/`secondary_bg_color`/`hint_color`/`button_color`) onto the app's existing CSS vars (`--background`/`--foreground`/`--card`/`--muted-foreground`/`--primary`), re-applies on `themeChanged`.
  - `frontend/src/components/telegram-bootstrap.tsx` — mounted on `/` only: detects `window.Telegram.WebApp.initData`, calls the login action once (`useRef` guard), `router.replace('/dashboard')` on success; no-ops silently outside Telegram (no `initData`).
  - `frontend/src/app/layout.tsx` — added `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive">` + `<TelegramThemeSync />`.
  - `frontend/src/app/page.tsx` — added `<TelegramBootstrap />`.
  - `npm run build` + `npm run lint` both clean in `frontend/`.

**Phase 6 is now code-complete** but still statically verified only (build/type-check/lint) — no live Supabase project or real Telegram bot token has been used to click through the flow in an actual Telegram client. That live verification is still owed before Phase 6 can be marked fully DONE.

**Deliberately out of scope for Phase 6** (per CLAUDE.md section 25 account linking needs an already-working phone/OTP login, which isn't built — no SMS provider chosen yet): merging a Telegram identity with an existing phone-created placeholder user by phone number. Telegram login always find-or-creates by `telegram_id` only.

## Phase 7 — AI Reminder ✅ DONE

Provider decision: **Google Gemini** (`gemini-2.5-flash`, called via raw REST `fetch` to `generativelanguage.googleapis.com` — no SDK dependency added), configured through the already-documented `AI_API_KEY` env var (no new env var name introduced).

- Backend (`backend/src/ai/`):
  - `entities/ai-reminder-tone.ts` — `AiReminderTone` union (`dostona`/`hurmatli`/`qisqa`/`rasmiy`/`hazilomuz`) + per-tone Uzbek prompt instructions.
  - `dto/generate-ai-reminder.dto.ts` — `{ debtId: UUID, tone }`.
  - `ai.service.ts` — `AiService.generateReminder(debt, currentUserId, tone)`: builds a prompt with lender/borrower names, remaining amount, due date, tone instruction, and an explicit hard rule ("never threaten/shame/insult/harass/pressure — always warm and respectful"); calls Gemini `generateContent`; throws `ServiceUnavailableException` if `AI_API_KEY` is unset, `InternalServerErrorException` on API/parse failure (Uzbek messages, never a raw error).
  - `ai.controller.ts` — `POST /ai/reminder` (matches the documented endpoint in CLAUDE.md §30 exactly): ownership-checked via `DebtsService.findOneForUser` before generation, so a user can only generate reminders for their own debts.
  - `ai.module.ts` — imports `DebtsModule`, wires `AiController`/`AiService`.
  - `npm run build` + `npm run lint` both clean in `backend/`.
- Frontend (debt detail page, `frontend/src/app/(app)/debts/[id]/`):
  - `ai-reminder-picker.tsx` — new client component: 5 tone buttons → generates via server action → shows the AI text in an **editable** `<textarea>` → "Nusxalash" (copy to clipboard) button.
  - No auto-send exists anywhere — this is intentional per CLAUDE.md §19 ("never automatically send an AI-generated message without explicit user confirmation"). QarzDaftar has no guaranteed channel to reach an arbitrary counterparty (no SMS provider, counterparty may not have linked Telegram), so the honest, non-fake MVP delivery mechanism is: user reviews/edits the AI text, then copies it and sends it themselves via whatever channel they choose (Telegram, SMS, WhatsApp). A real automatic in-app delivery channel (e.g. auto-send over the bot when the counterparty has Telegram linked) is a reasonable future enhancement, not built now.
  - `actions.ts` — added `generateAiReminderAction(debtId, tone)` server action (auth-gated like the file's other actions, returns `{ ok, message }`).
  - `lib/ai-api.ts` — new file, `generateAiReminder(token, { debtId, tone })` → `POST /ai/reminder`.
  - `lib/types.ts` — added `AiReminderTone`, `GenerateAiReminderInput`, `GenerateAiReminderResult`.
  - `page.tsx` — mounted `<AiReminderPicker debtId={debt.id} />` below the payment/reminder action row.
  - `npm run build` + `npm run lint` both clean in `frontend/`.
- `backend/.env.example` — annotated `AI_API_KEY` with a comment noting it's a Google Gemini key (https://ai.google.dev).

**Update (Phase 10 session)**: now tested live against a real `AI_API_KEY` — see Phase 10's manual checklist item 4. This surfaced and fixed real bugs (dead model name, insufficient token budget, markdown/quote leakage) that static verification alone had missed. `GEMINI_MODEL` is `gemini-flash-latest` and `maxOutputTokens` is `1024`, not `gemini-2.5-flash`/`200` as originally written above — this section is left as historical record of the original Phase 7 implementation; Phase 10 has the current state.

## Phase 8 — Statistics ✅ DONE (static verification only)

- Backend: new `backend/src/stats/` module (`stats.entity.ts` → `UserStats`, `stats.service.ts`, `stats.controller.ts`, `stats.module.ts`, registered in `app.module.ts`). `GET /stats` (JWT-protected like every other route, scoped to `@CurrentUser()`): fetches all debts where the user is lender or borrower (same `.or(lender_id.eq,borrower_id.eq)` pattern as `DebtsService.findAllForUser`), then computes in JS:
  - `totalGiven` — sum of `amount` where `lender_id === userId`
  - `totalTaken` — sum of `amount` where `borrower_id === userId`
  - `totalRepaid` — sum of `(amount - remaining_amount)` across all of the user's debts (both directions)
  - `totalRemaining` — sum of `remaining_amount` across all of the user's debts
  - `totalOverdue` — sum of `remaining_amount` for debts past `due_date` and not `paid`/`cancelled` (same overdue rule as the frontend's `isOverdue()` in `lib/summary.ts`)

  Note: `totalGiven + totalTaken === totalRepaid + totalRemaining` always holds (each debt's `amount` splits into its own repaid+remaining), matching the CLAUDE.md §18 worked example exactly.
- Frontend:
  - `lib/types.ts` — added `UserStats`; `lib/debts-api.ts` — added `getStats(token)` → `GET /stats`.
  - `components/summary-card.tsx` — widened `tone` from `"success" | "danger"` to also accept `"warning" | "primary"` (map-based lookup) so it could be reused for the statistics tiles instead of writing a new card component.
  - `components/stats-progress-bar.tsx` — new: a single simple stacked horizontal bar (repaid = success/green, remaining = warning/amber segments, rounded, `dataviz`-skill mark spec) with a text legend underneath (colored dot + label + `formatSom` amount). No hover/tooltip JS — all values are already shown as plain text in the stat tiles above, so a static bar was the appropriate "simple chart" per CLAUDE.md §18 ("do not overwhelm users") rather than an interactive analytics chart.
  - `app/(app)/statistics/page.tsx` — new page: server component following the exact same `getServerToken` → fetch → `SignInRequired`/`ErrorState` pattern as `dashboard`/`profile`. Renders the 5 CLAUDE.md §18 numbers as `SummaryCard`s (Jami bergan=success, Jami olgan=danger, Qaytarilgan=primary, Qolgan=warning, Muddati o'tgan=danger — reusing the same given=success/taken=danger color convention already established by `DebtCard`/dashboard) plus the `StatsProgressBar`. Empty state (`totalGiven + totalTaken === 0`) shows a short Uzbek message instead of a zeroed-out chart.
  - `app/(app)/profile/page.tsx` — added a "Statistika →" link card (statistics isn't one of the 5 fixed bottom-nav items per CLAUDE.md §38, so it's linked from profile instead).
- `npm run build` + `npm run lint` both clean in `backend/` and `frontend/`.

**Not tested live**: no live Supabase project is connected, so `GET /stats` has only been verified by reading the code and static build/lint — nobody has loaded `/statistics` in a real browser against real debt data yet.

**Do not repeat:** Phases 1–9 are done and verified per their sections above — do not re-implement or re-verify auth, debts CRUD, payments, confirmation, notifications/PWA, Telegram Mini App, AI reminders, statistics, or admin; only Phase 10 (Production) remains.

## Phase 9 — Admin ✅ DONE (static verification only)

- **Bootstrap note:** there is still no self-serve way to become an admin (correctly — a self-promotion endpoint would be a security hole). The *first* admin must be created by hand, e.g. `update users set role = 'admin' where id = '...'` directly in Supabase. From then on, existing admins can promote/demote other users from the `/admin/users` panel.
- Migration `0005_ai_reminder_logs.sql` — new `ai_reminder_logs` table (id, user_id, tone, created_at) so the "AI reminder usage" metric (CLAUDE.md §39) reflects real usage instead of being faked. `backend/src/ai/ai.service.ts` now injects `SUPABASE_CLIENT` and writes a best-effort log row after each successful Gemini generation (wrapped in try/catch — a logging failure never breaks the user-facing AI reminder feature). `ai.module.ts` now imports `DatabaseModule`.
- Backend: new `backend/src/admin/` module, registered in `app.module.ts`. `@Roles('admin')` on the controller class — combined with the already-global `RolesGuard`, this is real server-side authorization, not a frontend check (CLAUDE.md §8/32).
  - `GET /admin/stats` → `AdminStats` (totalUsers, newUsers [7d], activeUsers [proxy: distinct lender/borrower on a debt updated in the last 30 days — there's no login/last-seen tracking in the schema, documented in a code comment], totalDebts, paidDebts, overdueDebts, aiReminderUsage, pushSubscriptions, telegramConnectedUsers).
  - `GET /admin/users` → `AdminUserSummary[]` (id, name, phone, role, telegramConnected, createdAt) — **deliberately excludes all debt/financial data**, per CLAUDE.md §8 ("Admin private debt details'ni default holatda ko'rmasligi kerak").
  - `PATCH /admin/users/:id/role` → promote/demote a user; blocks an admin from changing their own role (`BadRequestException`). Note: because JWTs are stateless with no revocation mechanism (inherited from Phase 6), a role change only takes effect on the target's *next* login, not on their current session.
  - `GET /admin/reports` → `{ debtsByStatus, remindersByStatus }` — pure aggregate counts (all 6 debt statuses / 4 reminder statuses, zero-filled), never individual debts, amounts, or names — same privacy rule as `/admin/users`.
  - `npm run build` + `npm run lint` clean in `backend/`.
- Frontend: new top-level `frontend/src/app/admin/` route group (sibling to `(app)`, so it does **not** get the mobile `BottomNav` — desktop-first per CLAUDE.md §37/39). `admin/layout.tsx` gates on `getCurrentUser().role === 'admin'` (UX-only convenience; the real enforcement is the backend `RolesGuard` above) and renders a simple top nav (Boshqaruv paneli / Foydalanuvchilar / Hisobotlar / Profil).
  - `admin/page.tsx` — 9 `AdminStatTile` cards (new component — plain `toLocaleString` counts, not `formatSom` currency, since these are counts not money).
  - `admin/users/page.tsx` + `users/actions.ts` + `users/role-toggle-button.tsx` — responsive table (`overflow-x-auto`) of all users with a promote/demote button per row; disabled on the signed-in admin's own row (mirrors the backend's self-demotion guard).
  - `admin/reports/page.tsx` — two aggregate count tables (debts-by-status, reminders-by-status), reusing `statusLabel` and a new `reminderStatusLabel` in `lib/format.ts`.
  - `lib/admin-api.ts` (new) + `AdminStats`/`AdminUserSummary`/`AdminReports` types added to `lib/types.ts`.
  - `app/(app)/profile/page.tsx` — added an "Admin panel →" link, shown only when `user.role === 'admin'` (mirrors the existing Statistics link).
  - `public/sw.js` was checked: it only ever caches `/` (the shell) — `/admin/*` is never cached, consistent with CLAUDE.md §21.
  - `npm run build` + `npm run lint` clean in `frontend/`.

**Deliberate scope decisions** (documented rather than faked, matching the pattern set in Phases 6–7):
- **No "System Settings" screen.** CLAUDE.md §28's schema has no settings table and no concrete settings are specified anywhere else in the doc. Building toggles with nothing real behind them would be "fake functionality," which CLAUDE.md explicitly forbids. Skipped until real settings are specified.
- **No standalone "Analytics" screen.** Folded into the Dashboard's stat tiles — CLAUDE.md §39 doesn't distinguish what would be on a separate Analytics screen that isn't already one of the listed metrics.
- **No standalone "Notifications" (admin) screen.** Reminder delivery health is already covered by the Reports screen's `remindersByStatus` breakdown; a separate screen would just duplicate it.
- **"Admin Profile" reuses the existing `/profile` page** rather than a new page — an admin is a normal `users` row too, and `/profile` already shows name/phone/notification prefs. Only a link back into `/admin` was added.
- **"Reports" stays aggregate-only** (status counts, zero individual debts/amounts/names) — CLAUDE.md has no "user-submitted report/flag" data model, and building individual-debt drill-downs would violate the explicit privacy-first admin rule.

**Not tested live**: no live Supabase project is connected and no admin account exists yet (see bootstrap note above), so none of `/admin/*` has been loaded in a real browser — only static build/lint verification.

## Phase 10 — Production 🔶 IN PROGRESS (code-level hardening done; live deployment is a manual, user-driven step)

### Done this session — security audit + error handling (backend)

- **Fixed a real information-disclosure bug**: nearly every service (`debts`, `payments`, `users`, `telegram`, `notifications`, `stats`, `admin`, `reminders`, `push` — ~35 call sites) threw `InternalServerErrorException(error.message)`, which put the *raw* Supabase/Postgres error text straight into the HTTP response body — a direct violation of CLAUDE.md §41 ("Never show raw technical errors") and a minor info-disclosure risk (could leak table/column names to any caller). Rather than touching all ~35 call sites, added one central `backend/src/common/filters/all-exceptions.filter.ts` (`@Catch()`, wired via `app.useGlobalFilters()` in `main.ts`): it rewrites the message of any `InternalServerErrorException` specifically to a generic Uzbek string, logs the real error server-side via `Logger`, and leaves every other deliberately-authored `HttpException` (400/401/403/404/503/501, all already using safe Uzbek text) untouched. **Verified live**, not just statically: booted the compiled server with dummy env vars and confirmed via `curl` that a forced Supabase failure returns `{"statusCode":500,"message":"Serverda xatolik yuz berdi..."}"` to the client while the real `TypeError: fetch failed` shows up only in the server log.
- **Rate limiting was silently a no-op**: `ThrottlerModule.forRoot(...)` was imported in `app.module.ts` but `ThrottlerGuard` was never registered — so CLAUDE.md §32's "rate limiting where appropriate" wasn't actually enforced anywhere. Added `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. Verified live via `curl` response headers (`X-RateLimit-Limit/Remaining/Reset` now present on every response).
- **CORS was fully open** (`app.enableCors()` with no options reflects any origin). Restricted to a configurable allow-list via new `CORS_ORIGINS` env var (comma-separated), defaulting to open only when unset (local dev convenience). Kept working for the one browser→backend call that actually needs cross-origin access: the public `/confirm/[token]` page's `confirm-actions.tsx` is a client component that calls the API directly from the browser (everything else goes through Next.js Server Actions, which aren't subject to CORS at all). Verified live: requests from an unlisted origin get no `Access-Control-Allow-Origin` header; the configured origin does.
- **Added `helmet`** (new dependency) via `app.use(helmet())` for standard security headers (CSP, HSTS, X-Frame-Options, etc.) — verified present in live response headers.
- **Health-check route was accidentally behind auth**: `GET /` (`AppController.getHello`) had no `@Public()`, so the global `JwtAuthGuard` returned 401 on it — found via live smoke-testing, not by reading the code. Render (or any PaaS) needs an unauthenticated 200 to confirm the service is up, so this would have broken deployment health checks. Fixed with `@Public()`; verified `GET /` now returns 200 live.
- **Uzbekified the last English user-facing strings**: `auth.controller.ts`'s three `NotImplementedException` messages (phone/OTP register/login/OTP stubs) were in English; translated to Uzbek per CLAUDE.md's Uzbek-only text rule.
- **Migration `0006_enable_rls.sql`**: enables row-level security (no policies = deny-all) on every table, as defense-in-depth. Changes nothing functionally today — the backend always connects with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS regardless of whether it's enabled — but closes the door on an *accidental future* mistake (e.g. if an anon key were ever exposed to the frontend, which it currently never is).
- **`render.yaml`** (repo root): a Render Blueprint for the backend service (`rootDir: backend`, build/start commands, health check path `/`, every required env var listed with `sync: false` so Render prompts for the real secret values in its dashboard rather than storing them in the repo; `JWT_SECRET` uses `generateValue: true` so Render mints a strong random one automatically).
- Backend `npm run build`, `npm run lint`, and `npm test` all clean. Confirmed by running `node dist/main.js` (compiled build, not `nest start --watch`) against dummy env vars — the closest thing to a live smoke test possible without a real Supabase project.
- **Minor observation, not fixed**: `DATABASE_URL` is documented in CLAUDE.md §33 and `.env.example` but is never actually read anywhere in `backend/src` — the app only uses `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` via the `supabase-js` client. Left `.env.example` as-is (matches the spec doc) but didn't add it to `render.yaml` since setting it would do nothing.

### Done together with the user — Supabase production project (step 1 of the checklist below)

- Project created at supabase.com, ref `whjhdmxzehonhootuabp`. Migrations applied via the Supabase CLI run through `npx supabase` (no global install needed — `npx -y supabase --version` just works): `supabase login` (browser OAuth — had to be run in the user's own real Terminal, since this sandboxed shell has no TTY/browser and can't do the OAuth flow), `supabase link --project-ref whjhdmxzehonhootuabp`, `supabase db push`.
- **Caught a real mistake mid-setup**: the user's first `link`/`db push` attempt was run from their home directory (`~`) instead of the repo root, so the CLI found zero local migrations and reported "Remote database is up to date" — which sounded like success but actually meant nothing had been pushed. Caught by noticing the prompt showed `~` instead of the project path, confirmed by finding a stray `~/supabase/.temp` with no `migrations/` folder. Re-ran from the correct directory and all 6 migrations applied for real.
- Verified with `npx supabase migration list` (local/remote columns match for 0001–0006) and independently by connecting directly with `@supabase/supabase-js` using the real `service_role` key (read-only `count` query on `users` → 0 rows, as expected for a fresh DB).
- `backend/.env` (gitignored, never committed) now has real `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. To avoid the service-role key or JWT secret ever appearing in this conversation: `SUPABASE_URL` was filled in directly (not secret — it's derived from the project ref the user already shared), `JWT_SECRET` was generated with `openssl rand -base64 48` and written straight to the file from a script without ever being printed, and the user pasted only `SUPABASE_SERVICE_ROLE_KEY` in themselves via `open -e .env` (TextEdit) after `nano` proved awkward for them.
- **Full live verification**: booted the actual compiled backend (`node dist/main.js`) against the real production Supabase. `GET /` → 200. `GET /debts/confirm/<valid-uuid>` (nonexistent) → correct `404 Havola yaroqsiz yoki muddati o'tgan`, a real database round-trip. Bonus finding: hitting that same route with a non-UUID-shaped token surfaces a raw Postgres `invalid input syntax for type uuid` error internally — and confirmed live that the Phase 10 exception filter correctly masks it to the generic Uzbek message rather than leaking it, exactly as designed.

### What's still needed — and why it wasn't done autonomously

Everything below needs a real Render/hosting account and real secrets that only the project owner has. These are irreversible-ish, credentialed, external-service actions (creating accounts, spending on paid tiers if free tier is exceeded, deploying something publicly reachable) — not something to do without the user directly in the loop. This is the manual checklist for whoever runs deployment:

1. ~~**Supabase production project**~~ — done, see above.
2. ~~**Telegram bot**~~ — done: created via @BotFather, `@QarzDaftar_uzBot` (first_name "qarzdaftar", id `8984296001`). Token verified live via `GET https://api.telegram.org/bot<token>/getMe` (without ever printing the token in this conversation — same pattern as the Supabase key). `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` set in `backend/.env` (username normalized to omit the leading `@`, since the bot's Mini App URL / auth flow will construct `@`-prefixed mentions or `t.me/` links itself where needed). **Still pending**: registering the Mini App URL with BotFather — can't be done until the frontend has a real deployed URL (step 7).
3. ~~**VAPID keys**~~ — done: generated via the `web-push` library already installed in `backend/node_modules` (no `npx` fetch needed), written directly into `backend/.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — private key never printed anywhere) and `frontend/.env` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, same public key value, confirmed to match). `VAPID_SUBJECT=mailto:komronfrx@gmail.com` (the project owner's email — the `mailto:` scheme is the standard VAPID subject when there's no deployed domain yet; can be switched to `https://<production-domain>` once the frontend has a real URL, step 7). Verified live: booted the compiled backend and confirmed `PushService`'s "VAPID keys not configured" warning (seen during earlier Phase 10 smoke tests) no longer fires.
4. ~~**`AI_API_KEY`**~~ — done: key generated at aistudio.google.com by the user, set in `backend/.env` (never shown in this conversation). **Found and fixed a real, previously-undiscovered production bug while verifying it** — Phase 7's AI reminder feature had never been tested against a real key before now:
   - `GEMINI_MODEL = 'gemini-2.5-flash'` (the model `ai.service.ts` was hardcoded to) is no longer available to new API keys at all — confirmed live via a direct API call, which returned `"This model ... is no longer available to new users."` Switched to `gemini-flash-latest`, Google's maintained alias for their current default flash model (chosen over hardcoding another dated model name, so this doesn't silently break again next time Google retires one).
   - That model runs an internal "thinking" step before producing visible text — confirmed live it burns anywhere from ~150 to ~700+ tokens on reasoning alone depending on prompt complexity. The old `maxOutputTokens: 200` budget left little to nothing for the actual reminder text (reproduced empty and garbled responses live). Raised to `1024` (verified live: comfortably covers thinking + a real Uzbek reminder message).
   - The model also doesn't reliably honor "no markdown / no quotes" as a plain instruction alone (reproduced live: got `**bold**` markers and wrapping quote marks despite the prompt explicitly forbidding both). Reinforced the prompt wording and added a `sanitizeAiText()` post-processing step (strips markdown `**` and wrapping quote characters) as a defensive backstop rather than relying on prompt compliance alone.
   - All three fixes verified together by calling the actual compiled `AiService.generateReminder()` (not just raw `curl` — the real production code path, prompt-building included) with a fake debt object: returned a clean, well-formatted, properly-toned Uzbek reminder with no markdown or stray quotes. Also confirmed the best-effort `ai_reminder_logs` insert correctly no-ops (FK violation on the fake user id, silently swallowed as designed) rather than polluting the production table with test data.
   - `backend/src/ai/ai.service.ts` changed; `npm run build` + `npm run lint` clean.
5. ~~**`JWT_SECRET`**~~ — done (generated with `openssl rand -base64 48`, written straight to `backend/.env`, never printed). Render's blueprint will auto-generate a separate one for the deployed instance (`generateValue: true`) — the local dev one won't be reused there.
6. **Deploy the backend to Render**: connect the repo, Render should pick up `render.yaml` automatically (or configure manually: root dir `backend`, build `npm install && npm run build`, start `npm run start:prod`, health check `/`). Fill in the `sync: false` env vars in the Render dashboard.
7. **Deploy the frontend**: any Next.js-compatible host (Vercel is the natural fit, matching CLAUDE.md §3's "Next.js bilan mos free hosting platform"). Set `NEXT_PUBLIC_API_URL` to the deployed backend's URL, `NEXT_PUBLIC_APP_URL` to the frontend's own URL, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` from step 3.
8. **Close the loop on CORS**: once the frontend's real URL is known, set the backend's `CORS_ORIGINS` to it (and set `NODE_ENV=production` — the session cookie's `secure` flag is gated on this per Phase 6 notes).
9. **Live testing** (only possible once 1–8 are done): the full CLAUDE.md §45 checklist — click through auth (Telegram login), debts CRUD, payments, confirmation link, push notification permission + a real push, Telegram bot notification delivery, AI reminder generation against a real `AI_API_KEY`, admin bootstrap (`update users set role='admin'` in Supabase, per Phase 9's bootstrap note) and the full admin panel, PWA install prompt, responsive breakpoints on a real device, and the Mini App inside an actual Telegram client.
10. **Monitoring**: Render has basic built-in logs/metrics on the free tier; nothing beyond that has been set up (no Sentry/error-tracking service — would need its own account + DSN, another user-driven step).

**Not tested live**: none of the above 10 items can be done without the user's own accounts and secrets. Everything in the "Done this session" list was verified either statically (build/lint/test) or via a live-but-local smoke test (a real compiled server process, real HTTP requests, dummy env vars, no real Supabase/Render).

---

## Standing constraints (don't forget)

- Every backend change must pass `npm run build` + `npm run lint` (zero errors) in `backend/` before moving on.
- Every frontend change must pass `npm run build` + `npm run lint` (zero errors) in `frontend/` before moving on.
- No live Supabase project is connected — nothing has been tested against a real database or in a browser; only static verification (build/type-check/lint), plus one local live-smoke-test of the compiled backend (Phase 10), has been done so far.
- Deployment is prepared (`render.yaml` for the backend) but not executed — actually deploying requires the user's own Supabase/Render/Telegram/Gemini accounts and secrets (see Phase 10's manual checklist). Don't attempt to create accounts or deploy without the user directly driving that step.
- Never create a separate Client Panel, never expose secrets via `NEXT_PUBLIC_*`, never fake functionality (disabled buttons with "Tez orada" instead of fake success).
