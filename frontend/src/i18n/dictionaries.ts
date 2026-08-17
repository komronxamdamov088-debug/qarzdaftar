import type { Dictionary } from "./dictionaries/uz";
import uzDictionary from "./dictionaries/uz";
import ruDictionary from "./dictionaries/ru";
import type { Locale } from "./locale";

const dictionaries: Record<Locale, Dictionary> = {
  uz: uzDictionary,
  ru: ruDictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
