-- Lets a blocked business account (registered, not yet paid) flag "I want to
-- pay cash / outside the app" from within the subscription-gate screen
-- itself, instead of just a passive "contact support" text hint. See
-- backend/src/subscription-payments/subscription-payments.service.ts's
-- requestCashPayment(): sets this timestamp and notifies every admin
-- (in-app + Telegram), and it's cleared the moment an admin actually
-- activates the subscription (see AdminService/SubscriptionPaymentsService).
alter table users
  add column cash_payment_requested_at timestamptz;
