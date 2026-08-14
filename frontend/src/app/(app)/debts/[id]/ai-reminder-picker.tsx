"use client";

import { useState, useTransition } from "react";
import type { AiReminderTone } from "@/lib/types";
import { generateAiReminderAction } from "./actions";

const TONE_OPTIONS: { tone: AiReminderTone; label: string }[] = [
  { tone: "dostona", label: "Do'stona" },
  { tone: "hurmatli", label: "Hurmatli" },
  { tone: "qisqa", label: "Qisqa" },
  { tone: "rasmiy", label: "Rasmiy" },
  { tone: "hazilomuz", label: "Hazilomuz" },
];

export function AiReminderPicker({ debtId }: { debtId: string }) {
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
        AI eslatma yaratish
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">AI eslatma</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage(null);
            setError(null);
          }}
          className="text-xs text-muted-foreground"
        >
          Yopish
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.tone}
            type="button"
            disabled={isPending}
            onClick={() => generate(option.tone)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground">Yaratilmoqda...</p>
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
            Xabarni tahrirlashingiz mumkin. Yuborish uchun nusxalab, Telegram
            yoki SMS orqali o&apos;zingiz yuboring.
          </p>
          <button
            type="button"
            onClick={copy}
            className="self-start rounded-full bg-primary px-4 py-2 text-xs font-medium text-white"
          >
            {copied ? "Nusxalandi" : "Nusxalash"}
          </button>
        </div>
      )}
    </div>
  );
}
