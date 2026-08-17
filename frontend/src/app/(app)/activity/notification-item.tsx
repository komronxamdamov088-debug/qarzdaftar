"use client";

import { useTransition } from "react";
import { formatDate } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";
import type { AppNotification } from "@/lib/types";
import { markNotificationReadAction } from "./actions";

export function NotificationItem({
  notification,
  locale = DEFAULT_LOCALE,
}: {
  notification: AppNotification;
  locale?: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  function markRead() {
    if (notification.read || isPending) return;
    startTransition(async () => {
      await markNotificationReadAction(notification.id);
    });
  }

  return (
    <button
      type="button"
      onClick={markRead}
      className={`flex flex-col gap-1 rounded-xl px-4 py-3 text-left shadow-sm ${
        notification.read ? "bg-card" : "bg-primary/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{notification.title}</span>
        {!notification.read && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      {notification.body && (
        <span className="text-xs text-muted-foreground">
          {notification.body}
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {formatDate(notification.created_at, locale)}
      </span>
    </button>
  );
}
