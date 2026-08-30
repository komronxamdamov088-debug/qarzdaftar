"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { updatePhoneAction } from "./actions";

export function PhoneEditor({ phone }: { phone: string | null }) {
  const { dict } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await updatePhoneAction(trimmed);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={dict.profile.phonePlaceholder}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          inputMode="tel"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending || !value.trim()}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {isPending ? dict.common.saving : dict.common.save}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(phone ?? "");
              setError(null);
            }}
            disabled={isPending}
            className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium"
          >
            {dict.common.cancel}
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-sm text-muted-foreground underline decoration-dotted"
    >
      {phone ?? dict.profile.addPhone}
    </button>
  );
}
