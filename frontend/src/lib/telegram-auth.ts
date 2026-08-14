"use server";

import { cookies } from "next/headers";
import { apiFetch, extractApiErrorMessage } from "./api";
import { SESSION_COOKIE } from "./session";

interface TelegramAuthResult {
  accessToken: string;
  user: { id: string; name: string; role: string };
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

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Telegram orqali kirishda xatolik yuz berdi.",
      ),
    };
  }
}
