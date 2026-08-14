"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import {
  subscribeToPush,
  unsubscribeFromPush,
  updateNotificationPreferences,
} from "@/lib/notifications-api";
import { getServerToken } from "@/lib/session";
import type {
  PushSubscriptionInput,
  UpdateNotificationPreferencesInput,
} from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function subscribeToPushAction(
  input: PushSubscriptionInput,
): Promise<ActionResult> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await subscribeToPush(token, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Obuna bo'lishda xatolik yuz berdi.",
      ),
    };
  }

  revalidatePath("/profile");
  return { ok: true };
}

export async function unsubscribeFromPushAction(
  endpoint: string,
): Promise<ActionResult> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await unsubscribeFromPush(token, endpoint);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Obunani bekor qilishda xatolik yuz berdi.",
      ),
    };
  }

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateNotificationPreferencesAction(
  input: UpdateNotificationPreferencesInput,
): Promise<ActionResult> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await updateNotificationPreferences(token, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(error, "Saqlashda xatolik yuz berdi."),
    };
  }

  revalidatePath("/profile");
  return { ok: true };
}
