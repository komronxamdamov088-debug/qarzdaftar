import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtsService } from '../debts/debts.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { Reminder, ReminderType } from './entities/reminder.entity';

const REMINDER_OFFSET_DAYS: Record<ReminderType, number> = {
  '3_days_before': -3,
  '1_day_before': -1,
  due_date: 0,
  '1_day_after': 1,
  '3_days_after': 3,
};

const UNIQUE_VIOLATION = '23505';

function computeScheduledAt(dueDate: string, type: ReminderType): string {
  const scheduled = new Date(`${dueDate}T09:00:00Z`);
  scheduled.setUTCDate(scheduled.getUTCDate() + REMINDER_OFFSET_DAYS[type]);
  return scheduled.toISOString();
}

@Injectable()
export class RemindersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly debtsService: DebtsService,
  ) {}

  async create(
    userId: string,
    debtId: string,
    dto: CreateReminderDto,
  ): Promise<Reminder> {
    const debt = await this.debtsService.findOneForUser(userId, debtId);
    if (!debt.due_date) {
      throw new BadRequestException('Bu qarzda qaytarish sanasi belgilanmagan');
    }

    const { data, error } = await this.supabase
      .from('reminders')
      .insert({
        debt_id: debtId,
        user_id: userId,
        type: dto.type,
        scheduled_at: computeScheduledAt(debt.due_date, dto.type),
      })
      .select('*')
      .single();

    if (error) {
      throw this.mapInsertError(error);
    }
    return data;
  }

  async findAllForDebt(userId: string, debtId: string): Promise<Reminder[]> {
    await this.debtsService.findOneForUser(userId, debtId);

    const { data, error } = await this.supabase
      .from('reminders')
      .select('*')
      .eq('debt_id', debtId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  private mapInsertError(error: PostgrestError): Error {
    if (error.code === UNIQUE_VIOLATION) {
      return new BadRequestException(
        'Bu turdagi eslatma allaqachon rejalashtirilgan',
      );
    }
    return new InternalServerErrorException(error.message);
  }
}
