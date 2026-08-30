import { apiFetch } from "./api";
import type { CurrentUser, SubscriptionPlanMonths } from "./types";

// Self-serve shop registration — the Mini App is shop-only, so this is how a
// blocked personal account becomes a business and picks a plan (see backend
// UsersService.registerBusiness). Reachable even while blocked: the backend
// route is @SkipSubscriptionGate()'d.
export function registerBusiness(
  token: string,
  input: {
    businessName: string;
    planMonths: SubscriptionPlanMonths;
    phone: string;
  },
) {
  return apiFetch<CurrentUser>("/users/me/business", {
    method: "PATCH",
    body: input,
    token,
  });
}

// Flags "I've paid, please confirm" — notifies every admin (in-app +
// Telegram) and leaves a persistent badge in /admin/users, instead of the
// old passive "contact support" text with no actual action behind it.
export function requestCashPayment(token: string) {
  return apiFetch<{ ok: true }>("/subscription-payments/cash-request", {
    method: "POST",
    token,
  });
}

// Public — the same instructions are shown to every blocked shop, no auth
// needed. Returns null when the owner hasn't configured any (hides the
// section entirely rather than showing a blank "pay here" box).
export function getOwnerPaymentInfo() {
  return apiFetch<{ instructions: string | null }>(
    "/subscription-payments/payment-info",
  );
}
