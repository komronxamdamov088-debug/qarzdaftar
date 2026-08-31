"use client";

import { useState } from "react";
import type { PaymentProviderName } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";
import { PaymentMethodPicker } from "./payment-method-picker";

// Real merchant checkout (POST /subscription-payments/:provider/checkout)
// needs Click/Payme/Yagona Pay merchant credentials the owner has
// deliberately not registered for (see task.md Phase 14) — attempting it
// always failed with PROVIDER_NOT_CONFIGURED. Per the owner's request, this
// instead just hands the shop off to that provider's own app/site, where
// they transfer to the owner's personal Click/Payme number directly (the
// same number shown in ManualPaymentPanel's instructions) and then confirm
// with "Men to'ladim" — same manual-confirm mechanism, just reached via the
// provider's own app instead of typing/copying a number by hand.
const PROVIDER_APP_URL: Record<PaymentProviderName, string | undefined> = {
  click: process.env.NEXT_PUBLIC_CLICK_APP_URL || "https://my.click.uz",
  payme: process.env.NEXT_PUBLIC_PAYME_APP_URL || "https://payme.uz",
  // No well-known public app URL for Yagona Pay exists yet (see the
  // provider's own backend TODO) — left unconfigured rather than guessed;
  // the owner can set NEXT_PUBLIC_YAGONA_PAY_APP_URL once one is known.
  yagona_pay: process.env.NEXT_PUBLIC_YAGONA_PAY_APP_URL,
};

function openExternal(url: string) {
  const webApp = window.Telegram?.WebApp;
  if (webApp) {
    // Telegram's WebView can't reliably navigate to another app/site itself
    // — openLink hands the URL to the device's real browser (same pattern
    // as receipt-pdf-link.tsx).
    webApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function SubscriptionCheckoutPicker() {
  const { dict } = useTranslations();
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function select(provider: PaymentProviderName) {
    const url = PROVIDER_APP_URL[provider];
    if (!url) {
      setError(dict.apiErrors.PROVIDER_NOT_CONFIGURED);
      return;
    }
    setError(null);
    openExternal(url);
  }

  return (
    <PaymentMethodPicker
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setError(null);
      }}
      onSelect={select}
      pendingProvider={null}
      isPending={false}
      error={error}
    />
  );
}
