"use client";

import { useState, useTransition } from "react";
import type { PaymentProviderName } from "@/lib/types";
import { PaymentMethodPicker } from "./payment-method-picker";
import { initiateSubscriptionCheckoutAction } from "@/app/(app)/subscribe-actions";

// The real Click/Payme/Yagona Pay provider picker for subscription
// checkout, reusing the exact same UI as debt-payment checkout
// (payment-method-picker.tsx). Shown expanded by default (no toggle) — on
// the subscription-pending screen this *is* the primary action, unlike on
// the debt detail page where payment is one of several secondary actions.
// No real merchant credentials exist yet, so every selection currently
// fails with PROVIDER_NOT_CONFIGURED — kept visible anyway per the owner's
// request, alongside ManualPaymentPanel's transfer-and-confirm path.
export function SubscriptionCheckoutPicker() {
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] =
    useState<PaymentProviderName | null>(null);

  function checkout(provider: PaymentProviderName) {
    setError(null);
    setPendingProvider(provider);
    startTransition(async () => {
      const result = await initiateSubscriptionCheckoutAction(provider);
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.message);
        setPendingProvider(null);
      }
    });
  }

  return (
    <PaymentMethodPicker
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setError(null);
      }}
      onSelect={checkout}
      pendingProvider={pendingProvider}
      isPending={isPending}
      error={error}
    />
  );
}
