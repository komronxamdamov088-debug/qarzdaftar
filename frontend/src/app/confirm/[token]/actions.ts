"use server";

import { extractApiErrorMessage } from "@/lib/api";
import { confirmPublicDebt } from "@/lib/debts-api";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

// Runs server-side (Vercel -> Render) instead of the browser calling the
// backend directly. The previous client-side fetch needed a CORS preflight
// (OPTIONS) before every POST, since it sent Content-Type: application/json
// cross-origin — a Server Action isn't a browser cross-origin request at
// all, so it skips that extra round trip entirely. Public/unauthenticated,
// same trust boundary as the token-based confirm/reject endpoint itself.
export async function confirmPublicDebtAction(
  token: string,
  action: "confirm" | "reject",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dict = getDictionary(await getLocale());
  try {
    await confirmPublicDebt(token, action);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }
  return { ok: true };
}
