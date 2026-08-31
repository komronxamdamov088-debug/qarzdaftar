"use client";

import { useTranslations } from "@/i18n/locale-context";
import { CashPaymentRequestButton } from "./cash-payment-request-button";

// Manual/transfer payment path on the subscription-pending screen, shown
// alongside SubscriptionCheckoutPicker (the real Click/Payme/Yagona Pay
// buttons) — the owner hasn't registered merchant accounts with those
// providers yet (see task.md Phase 14), so this gives a shop a way to pay
// by direct transfer and self-confirm ("Men to'ladim") in the meantime.
// Always shown expanded (no toggle) — this is the primary/only working
// payment path today, so it must never be hidden behind an extra tap.
export function ManualPaymentPanel({
  instructions,
  alreadyRequested,
}: {
  instructions: string | null;
  alreadyRequested: boolean;
}) {
  const { dict } = useTranslations();

  if (!instructions) {
    // Never fake payment details that don't exist — fall back to the plain
    // "I've paid" action alone when the owner hasn't configured any.
    return <CashPaymentRequestButton alreadyRequested={alreadyRequested} />;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-left text-sm">
      <span className="font-medium">
        {dict.subscriptionGate.manualPaymentTitle}
      </span>
      <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
        {instructions}
      </pre>
      <CashPaymentRequestButton alreadyRequested={alreadyRequested} />
    </div>
  );
}
