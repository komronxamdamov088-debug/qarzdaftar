"use client";

import { useState, useTransition } from "react";
import { extractApiErrorMessage } from "@/lib/api";
import { initiatePublicCheckout } from "@/lib/payments-api";
import type { PaymentProviderName } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";

const PROVIDERS: PaymentProviderName[] = ["click", "payme", "qulay_pay"];

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-xs rounded-full border border-black/10 py-2.5 text-sm font-medium"
      >
        {dict.paymentButtons.toggle}
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{dict.paymentButtons.title}</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-muted-foreground"
        >
          {dict.common.close}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={isPending}
            onClick={() => checkout(provider)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {pendingProvider === provider
              ? dict.paymentButtons.redirecting
              : dict.paymentButtons.providers[provider]}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
