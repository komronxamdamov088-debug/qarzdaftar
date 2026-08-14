import { IsIn } from 'class-validator';
import type { ReminderType } from '../entities/reminder.entity';

const REMINDER_TYPES: ReminderType[] = [
  '3_days_before',
  '1_day_before',
  'due_date',
  '1_day_after',
  '3_days_after',
];

export class CreateReminderDto {
  @IsIn(REMINDER_TYPES)
  type!: ReminderType;
}
