"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/locale-context";

export function ShareDebtLinkButton({
  url,
  text,
}: {
  url: string;
  text?: string;
}) {
  const { dict } = useTranslations();
  const [copied, setCopied] = useState(false);

  async function share() {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      const shareUrl = new URL("https://t.me/share/url");
      shareUrl.searchParams.set("url", url);
      if (text) {
        shareUrl.searchParams.set("text", text);
      }
      webApp.openTelegramLink(shareUrl.toString());
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ url, text });
        return;
      } catch {
        // User cancelled the native share sheet — fall through to nothing.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the link text is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium"
    >
      {copied ? dict.copyLink.copied : dict.share.button}
    </button>
  );
}
