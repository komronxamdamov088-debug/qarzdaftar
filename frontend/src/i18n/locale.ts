export type Locale = "uz" | "ru";

export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "qd_locale";
export const LOCALES: Locale[] = ["uz", "ru"];

export function isLocale(value: unknown): value is Locale {
  return value === "uz" || value === "ru";
}
