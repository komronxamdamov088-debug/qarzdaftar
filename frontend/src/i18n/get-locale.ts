import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locale";

// Cookie-only: fast, works for both anonymous (public confirm link) and
// authenticated visitors without an extra API round-trip on every page.
// The cookie is kept in sync with the account's saved `users.locale` at
// login time (see lib/telegram-auth.ts) and whenever the switcher is used.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
