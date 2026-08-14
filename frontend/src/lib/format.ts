export function formatSom(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${Math.round(value).toLocaleString("uz-UZ").replace(/,/g, " ")} so'm`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  partially_paid: "Qisman to'langan",
  paid: "To'langan",
  overdue: "Muddati o'tgan",
  cancelled: "Bekor qilingan",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const CONFIRMATION_LABELS: Record<string, string> = {
  pending: "Tasdiqlanmagan",
  confirmed: "Ikki tomon tasdiqlagan",
  rejected: "Rad etilgan",
};

export function confirmationStatusLabel(status: string): string {
  return CONFIRMATION_LABELS[status] ?? status;
}

const REMINDER_STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  sent: "Yuborilgan",
  failed: "Xatolik",
  cancelled: "Bekor qilingan",
};

export function reminderStatusLabel(status: string): string {
  return REMINDER_STATUS_LABELS[status] ?? status;
}
