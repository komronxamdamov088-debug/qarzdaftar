"use client";

import { useState, useTransition } from "react";
import { formatSom } from "@/lib/format";
import type { CreateDebtInput, DebtDirection } from "@/lib/types";
import { createDebtAction } from "./actions";

const STEPS = [
  "person",
  "amount",
  "type",
  "due",
  "structure",
  "note",
  "review",
] as const;

const STEP_TITLES: Record<(typeof STEPS)[number], string> = {
  person: "Kimga yoki kimdan?",
  amount: "Summa",
  type: "Turi",
  due: "Qaytarish sanasi",
  structure: "To'lov turi",
  note: "Izoh",
  review: "Tekshirish",
};

export function AddDebtWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<DebtDirection>("given");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const isLastStep = step === "review";

  function goNext() {
    setError(null);
    if (step === "person" && name.trim().length === 0) {
      setError("Ism kiritilishi shart.");
      return;
    }
    if (step === "amount" && (!amount || Number(amount) <= 0)) {
      setError("Summani to'g'ri kiriting.");
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function submit() {
    const input: CreateDebtInput = {
      person: { name: name.trim(), phone: phone.trim() || undefined },
      amount: Number(amount),
      type,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
    };
    startTransition(async () => {
      const result = await createDebtAction(input);
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, index) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              index <= stepIndex ? "bg-primary" : "bg-black/10"
            }`}
          />
        ))}
      </div>

      <h1 className="text-lg font-semibold">{STEP_TITLES[step]}</h1>

      {step === "person" && (
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ism familiya"
            className="rounded-lg border border-black/10 bg-card px-3 py-2.5 text-sm"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefon raqami (ixtiyoriy)"
            className="rounded-lg border border-black/10 bg-card px-3 py-2.5 text-sm"
          />
        </div>
      )}

      {step === "amount" && (
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0"
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5 text-lg"
        />
      )}

      {step === "type" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType("given")}
            className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium ${
              type === "given"
                ? "border-primary bg-primary/10 text-primary"
                : "border-black/10 bg-card"
            }`}
          >
            Men berdim
          </button>
          <button
            type="button"
            onClick={() => setType("taken")}
            className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium ${
              type === "taken"
                ? "border-primary bg-primary/10 text-primary"
                : "border-black/10 bg-card"
            }`}
          >
            Men oldim
          </button>
        </div>
      )}

      {step === "due" && (
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5 text-sm"
        />
      )}

      {step === "structure" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-primary bg-primary/10 px-3 py-3 text-sm font-medium text-primary">
            Bir martada
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black/10 bg-card px-3 py-3 text-sm text-muted-foreground">
            Bo&apos;lib-bo&apos;lib to&apos;lash
            <span className="text-xs">Tez orada</span>
          </div>
        </div>
      )}

      {step === "note" && (
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Izoh (ixtiyoriy)"
          rows={4}
          className="rounded-lg border border-black/10 bg-card px-3 py-2.5 text-sm"
        />
      )}

      {step === "review" && (
        <dl className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 text-sm shadow-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Kim</dt>
            <dd className="font-medium">{name || "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Summa</dt>
            <dd className="font-medium">
              {amount ? formatSom(Number(amount)) : "-"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Turi</dt>
            <dd className="font-medium">
              {type === "given" ? "Men berdim" : "Men oldim"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Sana</dt>
            <dd className="font-medium">{dueDate || "Belgilanmagan"}</dd>
          </div>
          {note && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Izoh</dt>
              <dd className="text-right font-medium">{note}</dd>
            </div>
          )}
        </dl>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="mt-auto flex gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="flex-1 rounded-full border border-black/10 py-3 text-sm font-medium"
          >
            Orqaga
          </button>
        )}
        {!isLastStep ? (
          <button
            type="button"
            onClick={goNext}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-white"
          >
            Davom etish
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Saqlanmoqda..." : "Yaratish"}
          </button>
        )}
      </div>
    </div>
  );
}
