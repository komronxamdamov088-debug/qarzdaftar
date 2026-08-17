"use client";

import { useState, useTransition } from "react";
import type { Reminder, ReminderType } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { createReminderAction } from "./actions";

const REMINDER_TYPES: ReminderType[] = [
  "3_days_before",
  "1_day_before",
  "due_date",
  "1_day_after",
  "3_days_after",
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
  const { dict } = useTranslations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scheduledTypes = new Set(existingReminders.map((r) => r.type));

  if (!hasDueDate) {
    return (
      <button
        type="button"
        disabled
        title={dict.reminderPicker.disabledTitle}
        className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-muted-foreground"
      >
        {dict.reminderPicker.toggle}
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
        {dict.reminderPicker.toggle}
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
        <h3 className="text-sm font-medium">{dict.reminderPicker.title}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground"
        >
          {dict.reminderPicker.close}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {REMINDER_TYPES.map((type) => {
          const scheduled = scheduledTypes.has(type);
          const label = dict.reminderPicker.options[type];
          return (
            <button
              key={type}
              type="button"
              disabled={scheduled || isPending}
              onClick={() => schedule(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                scheduled
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-black/10"
              }`}
            >
              {scheduled ? `${label} ✓` : label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
