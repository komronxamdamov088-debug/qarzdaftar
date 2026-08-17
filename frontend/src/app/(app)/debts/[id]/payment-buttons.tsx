"use client";

import { useState, useTransition } from "react";
import type { PaymentProviderName } from "@/lib/types";
import { PaymentMethodPicker } from "@/components/payment-method-picker";
import { initiateCheckoutAction } from "./actions";

export function PaymentButtons({ debtId }: { debtId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] =
    useState<PaymentProviderName | null>(null);

  function checkout(provider: PaymentProviderName) {
    setError(null);
    setPendingProvider(provider);
    startTransition(async () => {
      const result = await initiateCheckoutAction(debtId, provider);
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
