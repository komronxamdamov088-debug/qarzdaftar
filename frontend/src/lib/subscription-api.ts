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
