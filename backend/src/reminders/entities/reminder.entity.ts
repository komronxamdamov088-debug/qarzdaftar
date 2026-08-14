import {
  Database,
  ReminderType,
  ReminderStatus,
} from '../../database/database.types';

export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type { ReminderType, ReminderStatus };
