-- Bilingual UI (UZ/RU): persists the account-wide language preference so it
-- follows the user across devices. The `qd_locale` cookie is the per-device
-- override; this column is the fallback/sync target (see frontend/src/i18n).

alter table users
  add column locale text not null default 'uz' check (locale in ('uz', 'ru'));
