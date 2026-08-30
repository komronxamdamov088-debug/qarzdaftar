"use client";

import { useState, useTransition } from "react";
import type { PaymentProviderName } from "@/lib/types";
import { PaymentMethodPicker } from "./payment-method-picker";
import { initiateSubscriptionCheckoutAction } from "@/app/(app)/subscribe-actions";

// Always rendered already-open (no collapsed toggle state) — unlike the debt
// payment buttons, this is the only thing on the whole blocked-user screen,
// so there's no reason to make the user click twice to see it.
export function SubscriptionCheckoutPicker() {
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
      open
      onOpen={() => {}}
      onClose={() => {}}
      onSelect={checkout}
      pendingProvider={pendingProvider}
      isPending={isPending}
      error={error}
    />
  );
}
