"use client";

import { useState, useTransition } from "react";
import { extractApiErrorMessage } from "@/lib/api";
import { initiatePublicCheckout } from "@/lib/payments-api";
import type { PaymentProviderName } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { PaymentMethodPicker } from "@/components/payment-method-picker";

export function PaymentButtons({ token }: { token: string }) {
  const { dict } = useTranslations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] =
    useState<PaymentProviderName | null>(null);

  function checkout(provider: PaymentProviderName) {
    setError(null);
    setPendingProvider(provider);
    startTransition(async () => {
      try {
        const result = await initiatePublicCheckout(token, provider);
        window.location.href = result.checkoutUrl;
      } catch (err) {
        setError(
          extractApiErrorMessage(err, dict.apiErrors.GENERIC, dict.apiErrors),
        );
        setPendingProvider(null);
      }
    });
  }

  return (
    <div className="w-full max-w-xs">
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
    </div>
  );
}
