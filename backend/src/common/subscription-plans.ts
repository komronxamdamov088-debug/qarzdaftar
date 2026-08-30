import { SubscriptionPlanMonths } from '../database/database.types';

// Shared between UsersService (self-serve registration, which sets the
// price/discount a shop sees) and SubscriptionPaymentsService (checkout,
// which reads the price back off the user's own row rather than trusting a
// client-supplied amount — see initiateCheckout). Fixed constants rather
// than an admin-editable settings table: no such table is specified anywhere
// in CLAUDE.md, and building one with nothing else behind it yet would be
// exactly the kind of "fake settings screen" CLAUDE.md section 43 warns
// against building ahead of a real need.
export const SUBSCRIPTION_PLAN_MONTHS: SubscriptionPlanMonths[] = [1, 2];

export const SUBSCRIPTION_PLAN_PRICES: Record<SubscriptionPlanMonths, number> =
  {
    1: 50000,
    2: 85000,
  };

// The discount shown to a shop for a multi-month plan, purely for display
// (subscription_discount_percent) — e.g. 2 months at 85 000 vs. 2x the
// 1-month price (100 000) is a 15% discount.
export function subscriptionPlanDiscountPercent(
  months: SubscriptionPlanMonths,
): number {
  const fullPrice = SUBSCRIPTION_PLAN_PRICES[1] * months;
  const planPrice = SUBSCRIPTION_PLAN_PRICES[months];
  if (fullPrice <= planPrice) {
    return 0;
  }
  return Math.round(((fullPrice - planPrice) / fullPrice) * 100);
}
