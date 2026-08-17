"use server";

import { cookies } from "next/headers";
import { apiFetch, extractApiErrorMessage } from "./api";
import { SESSION_COOKIE } from "./session";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locale";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

interface TelegramAuthResult {
  accessToken: string;
  user: { id: string; name: string; role: string; locale?: string };
}

type ActionResult = { ok: true } | { ok: false; message: string };

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function loginWithTelegramAction(
  initData: string,
): Promise<ActionResult> {
  try {
    const result = await apiFetch<TelegramAuthResult>("/auth/telegram", {
      method: "POST",
      body: { initData },
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // Only seed from the account's saved locale on a device that has no
    // local override yet — an existing cookie (e.g. switched before login,
    // on the public confirm page) always wins.
    if (!store.get(LOCALE_COOKIE) && isLocale(result.user.locale)) {
      store.set(LOCALE_COOKIE, result.user.locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    return { ok: true };
  } catch (error) {
    const dict = getDictionary(await getLocale());
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.home.telegramLoginError,
        dict.apiErrors,
      ),
    };
  }
}
