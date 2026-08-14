import { IsIn, IsUUID } from 'class-validator';
import { AI_REMINDER_TONES } from '../entities/ai-reminder-tone';
import type { AiReminderTone } from '../entities/ai-reminder-tone';

export class GenerateAiReminderDto {
  @IsUUID()
  debtId!: string;

  @IsIn(AI_REMINDER_TONES)
  tone!: AiReminderTone;
}
