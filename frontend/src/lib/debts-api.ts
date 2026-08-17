import { apiFetch } from "./api";
import type {
  CreateDebtInput,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateReminderInput,
  CurrentUser,
  Debt,
  ListDebtsParams,
  Payment,
  PublicDebtView,
  Reminder,
  UpdateDebtInput,
  UserStats,
} from "./types";

function toQueryString(params?: ListDebtsParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export function listDebts(token: string, params?: ListDebtsParams) {
  return apiFetch<Debt[]>(`/debts${toQueryString(params)}`, { token });
}

export function getDebt(token: string, id: string) {
  return apiFetch<Debt>(`/debts/${id}`, { token });
}

export function createDebt(token: string, input: CreateDebtInput) {
  return apiFetch<Debt>("/debts", { method: "POST", body: input, token });
}

export function updateDebt(token: string, id: string, input: UpdateDebtInput) {
  return apiFetch<Debt>(`/debts/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteDebt(token: string, id: string) {
  return apiFetch<void>(`/debts/${id}`, { method: "DELETE", token });
}

export function getCurrentUser(token: string) {
  return apiFetch<CurrentUser>("/users/me", { token });
}

export function updateUserLocale(token: string, locale: "uz" | "ru") {
  return apiFetch<CurrentUser>("/users/me/locale", {
    method: "PATCH",
    body: { locale },
    token,
  });
}

export function getStats(token: string) {
  return apiFetch<UserStats>("/stats", { token });
}

export function listPayments(token: string, debtId: string) {
  return apiFetch<Payment[]>(`/debts/${debtId}/payments`, { token });
}

export function createPayment(
  token: string,
  debtId: string,
  input: CreatePaymentInput,
) {
  return apiFetch<CreatePaymentResult>(`/debts/${debtId}/payments`, {
    method: "POST",
    body: input,
    token,
  });
}

export function listReminders(token: string, debtId: string) {
  return apiFetch<Reminder[]>(`/debts/${debtId}/reminders`, { token });
}

export function createReminder(
  token: string,
  debtId: string,
  input: CreateReminderInput,
) {
  return apiFetch<Reminder>(`/debts/${debtId}/reminders`, {
    method: "POST",
    body: input,
    token,
  });
}

// Unauthenticated: reachable via the shareable confirmation link, no session required.
export function getPublicDebt(confirmationToken: string) {
  return apiFetch<PublicDebtView>(`/debts/confirm/${confirmationToken}`);
}

export function confirmPublicDebt(
  confirmationToken: string,
  action: "confirm" | "reject",
) {
  return apiFetch<PublicDebtView>(`/debts/confirm/${confirmationToken}`, {
    method: "POST",
    body: { action },
  });
}
