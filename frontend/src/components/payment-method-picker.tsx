"use client";

import type { PaymentProviderName } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { PaymentProviderIcon } from "./payment-provider-icon";

const PROVIDERS: PaymentProviderName[] = ["click", "payme", "yagona_pay"];

// Shared presentational picker used by both payment-buttons.tsx variants
// (authenticated debt page + public confirmation link) — the two callers
// differ only in how `onSelect` initiates checkout (a server action vs a
// direct client call to the public backend route), everything about the
// UI itself lives here once.
export function PaymentMethodPicker({
  open,
  onOpen,
  onClose,
  onSelect,
  pendingProvider,
  isPending,
  error,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (provider: PaymentProviderName) => void;
  pendingProvider: PaymentProviderName | null;
  isPending: boolean;
  error: string | null;
}) {
  const { dict } = useTranslations();

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-full border border-black/10 py-2.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
      >
        {dict.paymentButtons.toggle}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{dict.paymentButtons.title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground"
        >
          {dict.common.close}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {PROVIDERS.map((provider) => {
          const isThisPending = pendingProvider === provider;
          return (
            <button
              key={provider}
              type="button"
              disabled={isPending}
              onClick={() => onSelect(provider)}
              className="group flex items-center gap-3 rounded-xl border border-black/10 bg-background px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              <PaymentProviderIcon provider={provider} size={40} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {dict.paymentButtons.providers[provider]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {dict.paymentButtons.descriptions[provider]}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition group-hover:bg-primary/90">
                {isThisPending ? dict.paymentButtons.redirecting : dict.paymentButtons.pay}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
