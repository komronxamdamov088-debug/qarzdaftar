"use client";

import { useState, useTransition } from "react";
import type { AiReminderTone } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { generateAiReminderAction } from "./actions";

const TONES: AiReminderTone[] = [
  "dostona",
  "hurmatli",
  "qisqa",
  "rasmiy",
  "hazilomuz",
];

export function AiReminderPicker({ debtId }: { debtId: string }) {
  const { dict } = useTranslations();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate(tone: AiReminderTone) {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generateAiReminderAction(debtId, tone);
      if (result.ok) {
        setMessage(result.message);
      } else {
        setMessage(null);
        setError(result.message);
      }
    });
  }

  async function copy() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the text is still selectable.
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-black/10 py-2.5 text-sm font-medium"
      >
        {dict.aiReminder.toggle}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{dict.aiReminder.title}</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage(null);
            setError(null);
          }}
          className="text-xs text-muted-foreground"
        >
          {dict.aiReminder.close}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            disabled={isPending}
            onClick={() => generate(tone)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {dict.aiReminder.tones[tone]}
          </button>
        ))}
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground">
          {dict.aiReminder.generating}
        </p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}

      {message && (
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {dict.aiReminder.editHint}
          </p>
          <button
            type="button"
            onClick={copy}
            className="self-start rounded-full bg-primary px-4 py-2 text-xs font-medium text-white"
          >
            {copied ? dict.aiReminder.copied : dict.aiReminder.copy}
          </button>
        </div>
      )}
    </div>
  );
}
