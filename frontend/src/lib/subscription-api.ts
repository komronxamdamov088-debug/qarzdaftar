import { apiFetch } from "./api";
import type {
  CheckoutResult,
  CurrentUser,
  PaymentProviderName,
  SubscriptionPlanMonths,
} from "./types";

// Self-serve shop registration — the Mini App is shop-only, so this is how a
// blocked personal account becomes a business and picks a plan (see backend
// UsersService.registerBusiness). Reachable even while blocked: the backend
// route is @SkipSubscriptionGate()'d.
export function registerBusiness(
  token: string,
  input: {
    businessName: string;
    planMonths: SubscriptionPlanMonths;
    phone?: string;
  },
) {
  return apiFetch<CurrentUser>("/users/me/business", {
    method: "PATCH",
    body: input,
    token,
  });
}

export function initiateSubscriptionCheckout(
  token: string,
  provider: PaymentProviderName,
) {
  return apiFetch<CheckoutResult>(
    `/subscription-payments/${provider}/checkout`,
    { method: "POST", token },
  );
}

// Flags "I'll pay cash / outside the app" — notifies every admin (in-app +
// Telegram) and leaves a persistent badge in /admin/users, instead of the
// old passive "contact support" text with no actual action behind it.
export function requestCashPayment(token: string) {
  return apiFetch<{ ok: true }>("/subscription-payments/cash-request", {
    method: "POST",
    token,
  });
}
