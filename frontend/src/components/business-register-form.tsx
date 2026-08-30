"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/locale-context";
import { formatSom } from "@/lib/format";
import type { SubscriptionPlanMonths } from "@/lib/types";
import { registerBusinessAction } from "@/app/(app)/subscribe-actions";

// Fixed plan prices, mirrored from backend/src/common/subscription-plans.ts
// purely for display before the user submits — the server always recomputes
// price/discount itself from planMonths, so a stale/tampered value here
// can't actually change what gets charged.
const PLAN_PRICES: Record<SubscriptionPlanMonths, number> = {
  1: 50000,
  2: 85000,
};
const PLAN_DISCOUNT_PERCENT: Record<SubscriptionPlanMonths, number> = {
  1: 0,
  2: 15,
};

export function BusinessRegisterForm() {
  const { dict, locale } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [planMonths, setPlanMonths] = useState<SubscriptionPlanMonths>(1);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(dict.subscriptionGate.businessNameRequired);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await registerBusinessAction(
        trimmed,
        planMonths,
        phone.trim() || undefined,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-card px-5 py-6 shadow-sm">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold">
          {dict.subscriptionGate.registerTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dict.subscriptionGate.registerDescription}
        </p>
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={dict.subscriptionGate.businessNamePlaceholder}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
      />

      <input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder={dict.subscriptionGate.phonePlaceholder}
        type="tel"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
      />

      <div className="flex flex-col gap-2">
        {([1, 2] as SubscriptionPlanMonths[]).map((months) => {
          const selected = planMonths === months;
          const discount = PLAN_DISCOUNT_PERCENT[months];
          return (
            <button
              key={months}
              type="button"
              onClick={() => setPlanMonths(months)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-black/10 hover:border-primary/40"
              }`}
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  {months === 1
                    ? dict.subscriptionGate.plan1Month
                    : dict.subscriptionGate.plan2Months}
                </span>
                {discount > 0 && (
                  <span className="text-xs text-success">
                    -{discount}% {dict.subscriptionGate.discountLabel}
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold">
                {formatSom(PLAN_PRICES[months], locale)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? dict.common.saving : dict.subscriptionGate.registerButton}
      </button>

      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
