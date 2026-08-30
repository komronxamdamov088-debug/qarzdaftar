import { BottomNav } from "@/components/bottom-nav";
import { SubscriptionGate } from "@/components/subscription-gate";
import { ErrorState } from "@/components/error-state";
import { ApiError } from "@/lib/api";
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

type LoadResult =
  | { status: "ok"; user: CurrentUser }
  // Token is missing/expired/invalid (401) — treated the same as "no
  // token": fall through and let the individual page's own fetch show its
  // usual SignInRequired state, exactly like before this gate existed.
  | { status: "unauthenticated" }
  // Any other failure (network hiccup, backend 5xx, a Render cold start —
  // anything that isn't a clean 401). Fail closed, not open: this must
  // never fall through to full app access for a still-signed-in user. A
  // real bug found live: the previous version's blanket `catch { return
  // null }` treated *every* GET /users/me failure this way, which silently
  // rendered `children` as if the user were an unblocked, paying business —
  // skipping the shop-only gate entirely on nothing more than a transient
  // network blip.
  | { status: "error" };

async function loadCurrentUser(token: string): Promise<LoadResult> {
  try {
    return { status: "ok", user: await getCurrentUser(token) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: "unauthenticated" };
    }
    return { status: "error" };
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getServerToken();

  if (token) {
    const result = await loadCurrentUser(token);

    if (result.status === "error") {
      return (
        <div className="flex min-h-full flex-1 flex-col">
          <div className="flex flex-1 flex-col pb-2">
            <ErrorState />
          </div>
        </div>
      );
    }

    if (result.status === "ok" && isBlocked(result.user)) {
      return (
        <div className="flex min-h-full flex-1 flex-col">
          <div className="flex flex-1 flex-col pb-2">
            <SubscriptionGate user={result.user} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col pb-2">{children}</div>
      <BottomNav />
    </div>
  );
}
