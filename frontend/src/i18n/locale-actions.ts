"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateUserLocale } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { LOCALE_COOKIE, type Locale } from "./locale";

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Always sets the per-device cookie immediately (works for anonymous/public
// visitors too), and additionally persists to the account when signed in so
// the preference follows the user across devices (frontend/CLAUDE.md §33's
// "no secrets in NEXT_PUBLIC_*" doesn't apply here — this is just a UI pref).
export async function setLocaleAction(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });

  const token = await getServerToken();
  if (token) {
    try {
      await updateUserLocale(token, locale);
    } catch {
      // Cookie is already set — account-wide sync is best-effort.
    }
  }

  revalidatePath("/", "layout");
}
