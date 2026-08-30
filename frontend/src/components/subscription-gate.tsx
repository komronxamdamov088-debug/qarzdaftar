import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { formatSom } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";
import { BusinessRegisterForm } from "./business-register-form";
import { SubscriptionCheckoutPicker } from "./subscription-checkout-picker";

// The screen every non-admin, non-access_override user sees on every
// protected page until they're a business account with an active
// subscription — see app/(app)/layout.tsx, which renders this instead of
// `children` based purely on fields already present on CurrentUser (no
// separate "am I blocked" fetch needed). Two states:
//  - not yet a business account: register (name + plan) first.
//  - a business account, but not yet paid/activated: show the chosen plan
//    and let them pay in-app, or wait for support to activate it manually
//    after a cash/outside-app payment (see AdminService.updateSubscription
//    Status / convertToBusiness — the same manual controls already used for
//    every business account before this feature existed).
export async function SubscriptionGate({ user }: { user: CurrentUser }) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  if (user.account_type !== "business") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">
            {dict.subscriptionGate.blockedTitle}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {dict.subscriptionGate.blockedDescription}
          </p>
        </div>
        <BusinessRegisterForm />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">
          {dict.subscriptionGate.pendingTitle}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {dict.subscriptionGate.pendingDescription}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-1 rounded-2xl bg-card px-5 py-4 text-sm shadow-sm">
        <span className="font-medium">{user.business_name}</span>
        <span className="text-muted-foreground">
          {user.subscription_plan_months === 2
            ? dict.subscriptionGate.plan2Months
            : dict.subscriptionGate.plan1Month}
          {" — "}
          {formatSom(user.subscription_price, locale)}
        </span>
      </div>

      <div className="w-full max-w-sm">
        <SubscriptionCheckoutPicker />
      </div>

      <p className="max-w-sm text-xs text-muted-foreground">
        {dict.subscriptionGate.supportHint}
      </p>
    </div>
  );
}
