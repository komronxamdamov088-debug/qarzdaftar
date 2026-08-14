"use client";

import { useState, useTransition } from "react";
import type { Reminder, ReminderType } from "@/lib/types";
import { createReminderAction } from "./actions";

const REMINDER_OPTIONS: { type: ReminderType; label: string }[] = [
  { type: "3_days_before", label: "3 kun oldin" },
  { type: "1_day_before", label: "1 kun oldin" },
  { type: "due_date", label: "Muddat kunida" },
  { type: "1_day_after", label: "1 kun keyin" },
  { type: "3_days_after", label: "3 kun keyin" },
];

export function ReminderPicker({
  debtId,
  hasDueDate,
  existingReminders,
}: {
  debtId: string;
  hasDueDate: boolean;
  existingReminders: Reminder[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scheduledTypes = new Set(existingReminders.map((r) => r.type));

  if (!hasDueDate) {
    return (
      <button
        type="button"
        disabled
        title="Avval qaytarish sanasini belgilang"
        className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-muted-foreground"
      >
        Eslatma
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium"
      >
        Eslatma
      </button>
    );
  }

  function schedule(type: ReminderType) {
    setError(null);
    startTransition(async () => {
      const result = await createReminderAction(debtId, { type });
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Eslatma qo&apos;shish</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground"
        >
          Yopish
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {REMINDER_OPTIONS.map((option) => {
          const scheduled = scheduledTypes.has(option.type);
          return (
            <button
              key={option.type}
              type="button"
              disabled={scheduled || isPending}
              onClick={() => schedule(option.type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                scheduled
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-black/10"
              }`}
            >
              {scheduled ? `${option.label} ✓` : option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
