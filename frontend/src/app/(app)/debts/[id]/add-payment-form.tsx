"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { createPaymentAction } from "./actions";

export function AddPaymentForm({
  debtId,
  maxAmount,
}: {
  debtId: string;
  maxAmount: number;
}) {
  const { dict } = useTranslations();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 rounded-full border border-primary/40 py-2.5 text-sm font-medium text-primary"
      >
        {dict.addPayment.toggle}
      </button>
    );
  }

  function submit() {
    setError(null);
    const value = Number(amount);
    if (!amount || value <= 0) {
      setError(dict.addPayment.errorInvalidAmount);
      return;
    }
    if (value > maxAmount) {
      setError(dict.addPayment.errorExceedsRemaining);
      return;
    }
    startTransition(async () => {
      const result = await createPaymentAction(debtId, {
        amount: value,
        note: note.trim() || undefined,
      });
      if (result && !result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setAmount("");
      setNote("");
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card px-4 py-4 shadow-sm">
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder={dict.addPayment.amountPlaceholder}
        className="rounded-lg border border-black/10 px-3 py-2.5 text-sm"
      />
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={dict.addPayment.notePlaceholder}
        className="rounded-lg border border-black/10 px-3 py-2.5 text-sm"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-full border border-black/10 py-2 text-xs font-medium"
        >
          {dict.addPayment.cancel}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? dict.addPayment.saving : dict.addPayment.save}
        </button>
      </div>
    </div>
  );
}
