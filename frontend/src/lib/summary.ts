import type { Debt } from "./types";

export interface DebtSummary {
  owedToMe: number;
  iOwe: number;
  balance: number;
}

export function summarizeDebts(debts: Debt[], currentUserId: string): DebtSummary {
  let owedToMe = 0;
  let iOwe = 0;

  for (const debt of debts) {
    const remaining = Number(debt.remaining_amount);
    if (debt.lender_id === currentUserId) {
      owedToMe += remaining;
    } else {
      iOwe += remaining;
    }
  }

  return { owedToMe, iOwe, balance: owedToMe - iOwe };
}

export function isOverdue(debt: Debt, today: string): boolean {
  return (
    !!debt.due_date &&
    debt.due_date < today &&
    debt.status !== "paid" &&
    debt.status !== "cancelled"
  );
}

export function isUpcoming(debt: Debt, today: string): boolean {
  return (
    !!debt.due_date &&
    debt.due_date >= today &&
    debt.status !== "paid" &&
    debt.status !== "cancelled"
  );
}
