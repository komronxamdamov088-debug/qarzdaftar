// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Regenerate with `supabase gen types typescript` once the project is linked.

export type UserRole = 'user' | 'admin';

export type UserLocale = 'uz' | 'ru';

export type AccountType = 'personal' | 'business';

export type DebtStatus =
  'pending' | 'confirmed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type ConfirmationStatus = 'pending' | 'confirmed' | 'rejected';

export type ReminderType =
  | '3_days_before'
  | '1_day_before'
  | 'due_date'
  | '1_day_after'
  | '3_days_after';

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export type AiReminderTone =
  'dostona' | 'hurmatli' | 'qisqa' | 'rasmiy' | 'hazilomuz';

export type PaymentProviderName = 'click' | 'payme' | 'yagona_pay';

export type PaymentMethod = 'cash' | PaymentProviderName;

export type PaymentTransactionStatus =
  'pending' | 'success' | 'failed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          push_enabled: boolean;
          telegram_enabled: boolean;
          locale: UserLocale;
          account_type: AccountType;
          business_name: string | null;
          subscription_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          push_enabled?: boolean;
          telegram_enabled?: boolean;
          locale?: UserLocale;
          account_type?: AccountType;
          business_name?: string | null;
          subscription_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      debts: {
        Row: {
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
        };
        Insert: {
          id?: string;
          lender_id: string;
          borrower_id: string;
          amount: number;
          remaining_amount: number;
          currency?: string;
          note?: string | null;
          due_date?: string | null;
          status?: DebtStatus;
          confirmation_status?: ConfirmationStatus;
          confirmation_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['debts']['Insert']>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          debt_id: string;
          amount: string;
          note: string | null;
          user_id: string | null;
          method: PaymentMethod;
          provider_transaction_id: string | null;
          payment_transaction_id: string | null;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          amount: number;
          note?: string | null;
          user_id?: string | null;
          method?: PaymentMethod;
          provider_transaction_id?: string | null;
          payment_transaction_id?: string | null;
          paid_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          debt_id: string;
          user_id: string;
          provider: PaymentProviderName;
          provider_transaction_id: string | null;
          amount: string;
          status: PaymentTransactionStatus;
          checkout_url: string | null;
          raw_webhook_payload: Record<string, unknown> | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          user_id: string;
          provider: PaymentProviderName;
          provider_transaction_id?: string | null;
          amount: number;
          status?: PaymentTransactionStatus;
          checkout_url?: string | null;
          raw_webhook_payload?: Record<string, unknown> | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['payment_transactions']['Insert']
        >;
        Relationships: [];
      };
      receipts: {
        Row: {
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
          locale: UserLocale;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          debt_id: string;
          receipt_number?: string;
          payer_name: string;
          recipient_name: string;
          payment_amount: number;
          debt_original_amount: number;
          debt_paid_amount: number;
          debt_remaining_amount: number;
          method: PaymentMethod;
          debt_status: DebtStatus;
          locale?: UserLocale;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          debt_id: string;
          user_id: string;
          type: ReminderType;
          scheduled_at: string;
          message: string | null;
          status: ReminderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          user_id: string;
          type: ReminderType;
          scheduled_at: string;
          message?: string | null;
          status?: ReminderStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['push_subscriptions']['Insert']
        >;
        Relationships: [];
      };
      telegram_connections: {
        Row: {
          id: string;
          user_id: string;
          telegram_id: number;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          telegram_id: number;
          username?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['telegram_connections']['Insert']
        >;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['notifications']['Insert']
        >;
        Relationships: [];
      };
      ai_reminder_logs: {
        Row: {
          id: string;
          user_id: string;
          tone: AiReminderTone;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tone: AiReminderTone;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['ai_reminder_logs']['Insert']
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_payment: {
        Args: {
          p_debt_id: string;
          p_user_id: string;
          p_amount: number;
          p_note: string | null;
          p_method?: PaymentMethod;
          p_provider_transaction_id?: string | null;
          p_payment_transaction_id?: string | null;
        };
        Returns: Database['public']['Tables']['payments']['Row'];
      };
    };
  };
}
