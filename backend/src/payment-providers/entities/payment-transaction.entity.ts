import { Database } from '../../database/database.types';

export type PaymentTransaction =
  Database['public']['Tables']['payment_transactions']['Row'];
