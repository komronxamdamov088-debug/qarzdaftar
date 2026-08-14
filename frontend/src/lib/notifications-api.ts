import { apiFetch } from "./api";
import type {
  AppNotification,
  CurrentUser,
  PushSubscriptionInput,
  UpdateNotificationPreferencesInput,
} from "./types";

export function subscribeToPush(token: string, input: PushSubscriptionInput) {
  return apiFetch<void>("/push/subscribe", {
    method: "POST",
    body: input,
    token,
  });
}

export function unsubscribeFromPush(token: string, endpoint: string) {
  return apiFetch<void>("/push/subscribe", {
    method: "DELETE",
    body: { endpoint },
    token,
  });
}

export function updateNotificationPreferences(
  token: string,
  input: UpdateNotificationPreferencesInput,
) {
  return apiFetch<CurrentUser>("/users/me/notifications", {
    method: "PATCH",
    body: input,
    token,
  });
}

export function listNotifications(token: string) {
  return apiFetch<AppNotification[]>("/notifications", { token });
}

export function markNotificationRead(token: string, id: string) {
  return apiFetch<AppNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}
