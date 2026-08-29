import { BottomNav } from "@/components/bottom-nav";
import { SubscriptionInactive } from "@/components/subscription-inactive";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";

// A deactivated business account (see backend JwtStrategy) gets a 403 with
// code SUBSCRIPTION_INACTIVE on every authenticated request, including this
// one — checked once here, in the layout shared by every protected page,
// rather than in each page's own data-fetching branch.
async function isSubscriptionInactive(token: string): Promise<boolean> {
  try {
    await getCurrentUser(token);
    return false;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) {
      return false;
    }
    try {
      const parsed = JSON.parse(error.message) as { code?: string };
      return parsed.code === "SUBSCRIPTION_INACTIVE";
    } catch {
      return false;
    }
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getServerToken();
  if (token && (await isSubscriptionInactive(token))) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <div className="flex flex-1 flex-col pb-2">
          <SubscriptionInactive />
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
