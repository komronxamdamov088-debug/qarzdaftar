import { UserLocale } from '../database/database.types';

// Static labels for the receipt PDF/API response — rendered entirely
// server-side (unlike the frontend's dict.xxx pattern), so this lives
// alongside the notification i18n rather than in the frontend dictionary.

interface ReceiptsDictionary {
  title: string;
  receiptNumber: string;
  date: string;
  payer: string;
  recipient: string;
  paymentAmount: string;
  method: string;
  methodLabels: Record<string, string>;
  debtOriginalAmount: string;
  debtPaidAmount: string;
  debtRemainingAmount: string;
  debtStatus: string;
  debtStatusLabels: Record<string, string>;
  disclaimer: string;
}

const RECEIPTS_I18N: Record<UserLocale, ReceiptsDictionary> = {
  uz: {
    title: 'QarzDaftar cheki',
    receiptNumber: 'Chek raqami',
    date: 'Sana',
    payer: "To'lovchi",
    recipient: 'Qabul qiluvchi',
    paymentAmount: "To'lov summasi",
    method: "To'lov usuli",
    methodLabels: {
      cash: 'Naqd',
      click: 'Click',
      payme: 'Payme',
      qulay_pay: 'Qulay Pay',
    },
    debtOriginalAmount: 'Qarz summasi',
    debtPaidAmount: "Jami to'langan",
    debtRemainingAmount: 'Qolgan summa',
    debtStatus: 'Holat',
    debtStatusLabels: {
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlangan',
      partially_paid: "Qisman to'langan",
      paid: "To'langan",
      overdue: "Muddati o'tgan",
      cancelled: 'Bekor qilingan',
    },
    disclaimer:
      "Bu ikki tomon o'rtasidagi raqamli yozuv. QarzDaftar buni avtomatik yuridik hujjat deb hisoblamaydi.",
  },
  ru: {
    title: 'Чек QarzDaftar',
    receiptNumber: 'Номер чека',
    date: 'Дата',
    payer: 'Плательщик',
    recipient: 'Получатель',
    paymentAmount: 'Сумма платежа',
    method: 'Способ оплаты',
    methodLabels: {
      cash: 'Наличные',
      click: 'Click',
      payme: 'Payme',
      qulay_pay: 'Qulay Pay',
    },
    debtOriginalAmount: 'Сумма долга',
    debtPaidAmount: 'Всего оплачено',
    debtRemainingAmount: 'Остаток',
    debtStatus: 'Статус',
    debtStatusLabels: {
      pending: 'Ожидается',
      confirmed: 'Подтверждён',
      partially_paid: 'Частично оплачен',
      paid: 'Оплачен',
      overdue: 'Просрочен',
      cancelled: 'Отменён',
    },
    disclaimer:
      'Это цифровая запись между двумя сторонами. QarzDaftar не считает её автоматическим юридическим документом.',
  },
};

export function getReceiptsI18n(
  locale: UserLocale | null | undefined,
): ReceiptsDictionary {
  return RECEIPTS_I18N[locale === 'ru' ? 'ru' : 'uz'];
}
