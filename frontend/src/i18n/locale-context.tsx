"use client";

import { createContext, useContext, useMemo } from "react";
import { getDictionary, type Dictionary } from "./dictionaries";
import type { Locale } from "./locale";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Only `locale` (a plain string) crosses the Server->Client boundary as a
// prop — dictionaries contain function values (e.g. dashboard.greeting),
// and React Server Components cannot pass functions to Client Components as
// props. `getDictionary()` is a pure, side-effect-free lookup, so calling it
// here (client-side) is safe and keeps the dictionary itself out of the
// server->client prop payload entirely.
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = useMemo(() => getDictionary(locale), [locale]);
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Named useTranslations for readability at call sites (`const { dict } = useTranslations()`),
// even though it returns the whole {locale, dict} pair rather than a single translate function —
// dict is a plain nested object, so component code just indexes into it directly (dict.debtsPage.title).
export function useTranslations(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useTranslations must be used within a LocaleProvider");
  }
  return value;
}
