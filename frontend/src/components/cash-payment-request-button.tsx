"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { requestCashPaymentAction } from "@/app/(app)/subscribe-actions";

// Replaces what used to be a passive "contact support" text hint with an
// actual action: flags the request so it shows as a persistent badge in
// /admin/users and notifies every admin immediately (in-app + Telegram) —
// see backend SubscriptionPaymentsService.requestCashPayment.
export function CashPaymentRequestButton({
  alreadyRequested,
}: {
  alreadyRequested: boolean;
}) {
  const { dict } = useTranslations();
  const [requested, setRequested] = useState(alreadyRequested);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (requested) {
    return (
      <p className="max-w-sm text-xs text-success">
        {dict.subscriptionGate.cashRequestSent}
      </p>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await requestCashPaymentAction();
      if (result.ok) {
        setRequested(true);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="w-full max-w-sm rounded-full border border-black/10 py-2.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        {isPending
          ? dict.common.saving
          : dict.subscriptionGate.cashRequestButton}
      </button>
      <p className="max-w-sm text-xs text-muted-foreground">
        {dict.subscriptionGate.manualPaymentHint}
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
