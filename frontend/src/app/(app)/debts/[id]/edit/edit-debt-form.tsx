"use client";

import { useState, useTransition } from "react";
import type { Debt, UpdateDebtInput } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { updateDebtAction } from "../actions";

export function EditDebtForm({ debt }: { debt: Debt }) {
  const { dict } = useTranslations();
  const [amount, setAmount] = useState(debt.amount);
  const [dueDate, setDueDate] = useState(debt.due_date ?? "");
  const [note, setNote] = useState(debt.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError(dict.editDebt.errorInvalidAmount);
      return;
    }
    const input: UpdateDebtInput = {
      amount: Number(amount),
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
    };
    startTransition(async () => {
      const result = await updateDebtAction(debt.id, input);
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-lg font-semibold">{dict.editDebt.title}</h1>

      <label className="flex flex-col gap-1 text-sm">
        {dict.editDebt.amountLabel}
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {dict.editDebt.dueDateLabel}
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {dict.editDebt.noteLabel}
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="mt-auto rounded-full bg-primary py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? dict.editDebt.saving : dict.editDebt.save}
      </button>
    </div>
  );
}
