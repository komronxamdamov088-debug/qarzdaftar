import { BottomNav } from "@/components/bottom-nav";
import { SubscriptionGate } from "@/components/subscription-gate";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";

// The Mini App is shop-only (see backend SubscriptionGateGuard) — every
// protected page shares this layout, so the "you're blocked" screen is
// rendered once here rather than in each page's own fetch/catch branch.
// GET /users/me is itself exempt from the gate (@SkipSubscriptionGate()), so
// this never throws for a blocked user — it always returns real data, and
// the blocking decision is made here purely by reading account_type/
// subscription_active/access_override off the response, the same fields the
// backend guard itself checks.
function isBlocked(user: CurrentUser): boolean {
  if (user.role === "admin" || user.access_override) {
    return false;
  }
  return !(user.account_type === "business" && user.subscription_active);
}

async function loadCurrentUser(token: string): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser(token);
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getServerToken();
  const user = token ? await loadCurrentUser(token) : null;

  if (user && isBlocked(user)) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <div className="flex flex-1 flex-col pb-2">
          <SubscriptionGate user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col pb-2">{children}</div>
      <BottomNav />
    </div>
  );
}
