"use client";

import { useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { setLocaleAction } from "@/i18n/locale-actions";
import type { Locale } from "@/i18n/locale";

const LOCALES: Locale[] = ["uz", "ru"];

export function LanguageSwitcher() {
  const { locale, dict } = useTranslations();
  const [isPending, startTransition] = useTransition();

  function select(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span>{dict.language.label}</span>
      <div className="flex gap-1 rounded-full bg-black/5 p-1">
        {LOCALES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            disabled={isPending}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
              locale === value
                ? "bg-primary text-white"
                : "text-muted-foreground"
            }`}
          >
            {dict.language[value]}
          </button>
        ))}
      </div>
    </div>
  );
}
