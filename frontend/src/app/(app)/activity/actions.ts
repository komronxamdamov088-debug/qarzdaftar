"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import { markNotificationRead } from "@/lib/notifications-api";
import { getServerToken } from "@/lib/session";

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await markNotificationRead(token, id);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Yangilashda xatolik yuz berdi.",
      ),
    };
  }

  revalidatePath("/activity");
  return { ok: true };
}
