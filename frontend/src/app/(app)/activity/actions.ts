"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import { markNotificationRead } from "@/lib/notifications-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await markNotificationRead(token, id);
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

  revalidatePath("/activity");
  return { ok: true };
}
