import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";

const INTL_LOCALE: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
};

const CURRENCY_LABEL: Record<Locale, string> = {
  uz: "so'm",
  ru: "сум",
};

export function formatSom(
  amount: number | string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${Math.round(value)
    .toLocaleString(INTL_LOCALE[locale])
    .replace(/,/g, " ")} ${CURRENCY_LABEL[locale]}`;
}

export function formatDate(
  value: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return new Date(value).toLocaleDateString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return value.toLocaleString(INTL_LOCALE[locale]);
}

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  uz: {
    pending: "Kutilmoqda",
    confirmed: "Tasdiqlangan",
    partially_paid: "Qisman to'langan",
    paid: "To'langan",
    overdue: "Muddati o'tgan",
    cancelled: "Bekor qilingan",
  },
  ru: {
    pending: "Ожидается",
    confirmed: "Подтверждено",
    partially_paid: "Частично оплачено",
    paid: "Оплачено",
    overdue: "Просрочено",
    cancelled: "Отменено",
  },
};

export function statusLabel(
  status: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return STATUS_LABELS[locale][status] ?? status;
}

const CONFIRMATION_LABELS: Record<Locale, Record<string, string>> = {
  uz: {
    pending: "Tasdiqlanmagan",
    confirmed: "Ikki tomon tasdiqlagan",
    rejected: "Rad etilgan",
  },
  ru: {
    pending: "Не подтверждено",
    confirmed: "Подтверждено обеими сторонами",
    rejected: "Отклонено",
  },
};

export function confirmationStatusLabel(
  status: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return CONFIRMATION_LABELS[locale][status] ?? status;
}

const REMINDER_STATUS_LABELS: Record<Locale, Record<string, string>> = {
  uz: {
    pending: "Kutilmoqda",
    sent: "Yuborilgan",
    failed: "Xatolik",
    cancelled: "Bekor qilingan",
  },
  ru: {
    pending: "Ожидается",
    sent: "Отправлено",
    failed: "Ошибка",
    cancelled: "Отменено",
  },
};

export function reminderStatusLabel(
  status: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return REMINDER_STATUS_LABELS[locale][status] ?? status;
}
