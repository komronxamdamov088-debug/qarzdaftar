import { DebtStatus, ReminderStatus } from '../../database/database.types';

// Aggregate counts only — never individual debts, amounts, or parties, per
// CLAUDE.md's admin privacy-first rule (section 8/39).
export interface AdminReports {
  debtsByStatus: Record<DebtStatus, number>;
  remindersByStatus: Record<ReminderStatus, number>;
}
