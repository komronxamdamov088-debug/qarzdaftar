"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/locale-context";

export function CopyLinkButton({ url }: { url: string }) {
  const { dict } = useTranslations();
  const [copied, setCopied] = useState(false);

  async function copy() {
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
      onClick={copy}
      className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium"
    >
      {copied ? dict.copyLink.copied : dict.copyLink.copy}
    </button>
  );
}
