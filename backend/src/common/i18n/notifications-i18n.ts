import { UserLocale } from '../../database/database.types';

// Static text for push/Telegram notification bodies, which never cross an
// HTTP response body (unlike controller errors) so they can't use the
// frontend's {code, message} + dict.apiErrors lookup pattern — the correct
// locale has to be resolved server-side, from the recipient's users.locale.

const INTL_LOCALE: Record<UserLocale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
};

const CURRENCY_LABEL: Record<UserLocale, string> = {
  uz: "so'm",
  ru: 'сум',
};

export function formatSom(
  amount: string | number,
  locale: UserLocale = 'uz',
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return `${Math.round(value)
    .toLocaleString(INTL_LOCALE[locale])
    .replace(/,/g, ' ')} ${CURRENCY_LABEL[locale]}`;
}

interface NotificationsDictionary {
  reminderTitle: string;
  reminderBody: (counterpartyName: string, amount: string) => string;
  paymentReceivedTitle: string;
  paymentReceivedBody: (payerName: string, amount: string) => string;
  debtorReminderTitle: string;
  debtorReminderBody: (lenderName: string, amount: string) => string;
}

const NOTIFICATIONS_I18N: Record<UserLocale, NotificationsDictionary> = {
  uz: {
    reminderTitle: 'Qarz eslatmasi',
    reminderBody: (counterpartyName, amount) =>
      `${counterpartyName} bilan bo'lgan ${amount} qarzingizning qaytarish sanasi yaqinlashmoqda.`,
    paymentReceivedTitle: "To'lov qabul qilindi",
    paymentReceivedBody: (payerName, amount) =>
      `${payerName} sizga ${amount} to'lov qildi.`,
    debtorReminderTitle: "To'lov eslatmasi",
    debtorReminderBody: (lenderName, amount) =>
      `Salom! ${lenderName} bilan bo'lgan ${amount} miqdoridagi qarzingizni to'lash muddati yaqinlashmoqda.`,
  },
  ru: {
    reminderTitle: 'Напоминание о долге',
    reminderBody: (counterpartyName, amount) =>
      `Приближается срок возврата долга с ${counterpartyName} на сумму ${amount}.`,
    paymentReceivedTitle: 'Платёж получен',
    paymentReceivedBody: (payerName, amount) =>
      `${payerName} оплатил(а) вам ${amount}.`,
    debtorReminderTitle: 'Напоминание об оплате',
    debtorReminderBody: (lenderName, amount) =>
      `Здравствуйте! Приближается срок оплаты долга перед ${lenderName} на сумму ${amount}.`,
  },
};

export function getNotificationsI18n(
  locale: UserLocale | null | undefined,
): NotificationsDictionary {
  return NOTIFICATIONS_I18N[locale === 'ru' ? 'ru' : 'uz'];
}
