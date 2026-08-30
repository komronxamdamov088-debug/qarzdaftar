export type DebtStatus =
  | "pending"
  | "confirmed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type ConfirmationStatus = "pending" | "confirmed" | "rejected";

export type DebtDirection = "given" | "taken";

export interface PublicPerson {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Debt {
  id: string;
  lender_id: string;
  borrower_id: string;
  amount: string;
  remaining_amount: string;
  currency: string;
  note: string | null;
  due_date: string | null;
  status: DebtStatus;
  confirmation_status: ConfirmationStatus;
  confirmation_token: string;
  created_at: string;
  updated_at: string;
  lender: PublicPerson;
  borrower: PublicPerson;
}

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

export interface Person {
  name: string;
  phone?: string;
}

export interface CreateDebtInput {
  person: Person;
  amount: number;
  type: DebtDirection;
  dueDate?: string;
  note?: string;
}

export interface UpdateDebtInput {
  amount?: number;
  dueDate?: string;
  note?: string;
}

export type SubscriptionPlanMonths = 1 | 2;

export interface CurrentUser {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  push_enabled: boolean;
  telegram_enabled: boolean;
  locale: "uz" | "ru";
  account_type: AccountType;
  business_name: string | null;
  subscription_active: boolean;
  subscription_price: string;
  subscription_discount_percent: string;
  subscription_valid_until: string | null;
  subscription_plan_months: SubscriptionPlanMonths | null;
  access_override: boolean;
  cash_payment_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface UpdateNotificationPreferencesInput {
  pushEnabled?: boolean;
  telegramEnabled?: boolean;
}

export type PaymentProviderName = "click" | "payme" | "yagona_pay";

export type PaymentMethod = "cash" | PaymentProviderName;

export interface Payment {
  id: string;
  debt_id: string;
  amount: string;
  note: string | null;
  method: PaymentMethod;
  provider_transaction_id: string | null;
  paid_at: string;
  created_at: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  transactionId: string;
}

export interface Receipt {
  id: string;
  payment_id: string;
  debt_id: string;
  receipt_number: string;
  payer_name: string;
  recipient_name: string;
  payment_amount: string;
  debt_original_amount: string;
  debt_paid_amount: string;
  debt_remaining_amount: string;
  method: PaymentMethod;
  debt_status: DebtStatus;
  locale: "uz" | "ru";
  created_at: string;
}

export interface CreatePaymentInput {
  amount: number;
  note?: string;
}

export interface CreatePaymentResult {
  payment: Payment;
  debt: Debt;
}

export type ReminderType =
  | "3_days_before"
  | "1_day_before"
  | "due_date"
  | "1_day_after"
  | "3_days_after";

export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";

export interface Reminder {
  id: string;
  debt_id: string;
  user_id: string;
  type: ReminderType;
  scheduled_at: string;
  message: string | null;
  status: ReminderStatus;
  created_at: string;
}

export interface CreateReminderInput {
  type: ReminderType;
}

export type AiReminderTone =
  | "dostona"
  | "hurmatli"
  | "qisqa"
  | "rasmiy"
  | "hazilomuz";

export interface GenerateAiReminderInput {
  debtId: string;
  tone: AiReminderTone;
}

export interface GenerateAiReminderResult {
  message: string;
}

export interface UserStats {
  totalGiven: number;
  totalTaken: number;
  totalRepaid: number;
  totalRemaining: number;
  totalOverdue: number;
}

export interface AdminStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalDebts: number;
  paidDebts: number;
  overdueDebts: number;
  aiReminderUsage: number;
  pushSubscriptions: number;
  telegramConnectedUsers: number;
}

export type AccountType = "personal" | "business";

export interface AdminUserSummary {
  id: string;
  name: string;
  phone: string | null;
  role: "user" | "admin";
  telegramConnected: boolean;
  telegramUsername: string | null;
  createdAt: string;
  accountType: AccountType;
  businessName: string | null;
  subscriptionActive: boolean;
  subscriptionPrice: string;
  subscriptionDiscountPercent: string;
  subscriptionValidUntil: string | null;
  accessOverride: boolean;
  cashPaymentRequestedAt: string | null;
}

export interface AdminReports {
  debtsByStatus: Record<DebtStatus, number>;
  remindersByStatus: Record<ReminderStatus, number>;
}

export interface ListDebtsParams {
  direction?: DebtDirection;
  state?: "unpaid" | "paid" | "overdue";
  search?: string;
  sort?: "newest" | "oldest" | "amount" | "due_date";
}
