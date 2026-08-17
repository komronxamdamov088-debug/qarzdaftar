"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import {
  subscribeToPush,
  unsubscribeFromPush,
  updateNotificationPreferences,
} from "@/lib/notifications-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type {
  PushSubscriptionInput,
  UpdateNotificationPreferencesInput,
} from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function subscribeToPushAction(
  input: PushSubscriptionInput,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await subscribeToPush(token, input);
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

  revalidatePath("/profile");
  return { ok: true };
}

export async function unsubscribeFromPushAction(
  endpoint: string,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await unsubscribeFromPush(token, endpoint);
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

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateNotificationPreferencesAction(
  input: UpdateNotificationPreferencesInput,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await updateNotificationPreferences(token, input);
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

  revalidatePath("/profile");
  return { ok: true };
}
