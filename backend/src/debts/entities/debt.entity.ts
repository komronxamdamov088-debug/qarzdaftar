import {
  Database,
  DebtStatus,
  ConfirmationStatus,
} from '../../database/database.types';

export type Debt = Database['public']['Tables']['debts']['Row'];
export type { DebtStatus, ConfirmationStatus };

export interface PublicPerson {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface DebtWithParties extends Debt {
  lender: PublicPerson;
  borrower: PublicPerson;
}

// Shape returned from the unauthenticated confirmation link — no internal
// ids, tokens, or ownership fields, just what the recipient needs to see.
export interface PublicDebtView {
  id: string;
  amount: string;
  remaining_amount: string;
  currency: string;
  note: string | null;
  due_date: string | null;
  status: DebtStatus;
  confirmation_status: ConfirmationStatus;
  created_at: string;
  lender: PublicPerson;
  borrower: PublicPerson;
}

export function toPublicDebtView(debt: DebtWithParties): PublicDebtView {
  return {
    id: debt.id,
    amount: debt.amount,
    remaining_amount: debt.remaining_amount,
    currency: debt.currency,
    note: debt.note,
    due_date: debt.due_date,
    status: debt.status,
    confirmation_status: debt.confirmation_status,
    created_at: debt.created_at,
    lender: debt.lender,
    borrower: debt.borrower,
  };
}
