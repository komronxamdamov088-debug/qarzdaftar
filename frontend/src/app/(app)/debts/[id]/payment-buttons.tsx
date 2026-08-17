"use client";

import { useState, useTransition } from "react";
import type { PaymentProviderName } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { initiateCheckoutAction } from "./actions";

const PROVIDERS: PaymentProviderName[] = ["click", "payme", "qulay_pay"];

export function PaymentButtons({ debtId }: { debtId: string }) {
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
      const result = await initiateCheckoutAction(debtId, provider);
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.message);
        setPendingProvider(null);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-black/10 py-2.5 text-sm font-medium"
      >
        {dict.paymentButtons.toggle}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
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

      <div className="flex flex-wrap gap-2">
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
