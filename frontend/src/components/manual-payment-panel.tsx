"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { CashPaymentRequestButton } from "./cash-payment-request-button";

// Replaces the old Click/Payme/Yagona Pay checkout picker on the
// subscription-pending screen — the owner deliberately never registered a
// real merchant account with any of those providers (see task.md Phase 14),
// so those buttons only ever produced a "not configured" error. Selecting
// "Onlayn to'lov" now opens the owner's real transfer details directly
// instead of a broken redirect.
export function ManualPaymentPanel({
  instructions,
  alreadyRequested,
}: {
  instructions: string | null;
  alreadyRequested: boolean;
}) {
  const { dict } = useTranslations();
  const [open, setOpen] = useState(alreadyRequested);

  if (!instructions) {
    // Never fake payment details that don't exist — fall back to the plain
    // "I've paid" action alone when the owner hasn't configured any.
    return <CashPaymentRequestButton alreadyRequested={alreadyRequested} />;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-sm rounded-full border border-black/10 py-2.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
      >
        {dict.subscriptionGate.onlinePaymentToggle}
      </button>
    );
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
