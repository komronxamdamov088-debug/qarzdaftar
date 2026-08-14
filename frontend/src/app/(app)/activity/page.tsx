import { ApiError } from "@/lib/api";
import { listNotifications } from "@/lib/notifications-api";
import { getServerToken } from "@/lib/session";
import type { AppNotification } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { NotificationItem } from "./notification-item";

async function loadNotifications(
  token: string,
): Promise<
  | { ok: true; notifications: AppNotification[] }
  | { ok: false; unauthorized: boolean }
> {
  try {
    const notifications = await listNotifications(token);
    return { ok: true, notifications };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function ActivityPage() {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadNotifications(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { notifications } = result;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Faoliyat</h1>
      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Hozircha bildirishnomalar yo&apos;q.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </main>
  );
}
