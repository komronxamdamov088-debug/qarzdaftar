import { AccountType, UserRole } from '../../database/database.types';

// Deliberately excludes debts/amounts — CLAUDE.md section 8: admins must not
// see private debt details by default. Only account-level fields are exposed.
export interface AdminUserSummary {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  telegramConnected: boolean;
  telegramUsername: string | null;
  createdAt: string;
  accountType: AccountType;
  businessName: string | null;
  subscriptionActive: boolean;
  subscriptionPrice: string;
  subscriptionDiscountPercent: string;
  subscriptionValidUntil: string | null;
}
