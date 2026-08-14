import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { NotificationSettings } from "./notification-settings";

async function loadUser(
  token: string,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; unauthorized: boolean }> {
  try {
    const user = await getCurrentUser(token);
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function ProfilePage() {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadUser(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { user } = result;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        {user.phone && (
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        )}
      </div>

      <Link
        href="/statistics"
        className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm font-medium shadow-sm"
      >
        Statistika
        <span className="text-muted-foreground">→</span>
      </Link>

      {user.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm font-medium shadow-sm"
        >
          Admin panel
          <span className="text-muted-foreground">→</span>
        </Link>
      )}

      <NotificationSettings
        pushEnabled={user.push_enabled}
        telegramEnabled={user.telegram_enabled}
      />
    </main>
  );
}
