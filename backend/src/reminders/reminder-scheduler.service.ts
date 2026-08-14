import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtsService } from '../debts/debts.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';
import { TelegramService } from '../telegram/telegram.service';
import { Reminder } from './entities/reminder.entity';

function formatSom(amount: string): string {
  return `${Math.round(Number(amount)).toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm`;
}

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly debtsService: DebtsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
    private readonly telegramService: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDueReminders(): Promise<void> {
    const { data: dueReminders, error } = await this.supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (error) {
      this.logger.error(`Failed to load due reminders: ${error.message}`);
      return;
    }

    for (const reminder of dueReminders) {
      await this.processReminder(reminder);
    }
  }

  private async processReminder(reminder: Reminder): Promise<void> {
    try {
      const debt = await this.debtsService.findById(reminder.debt_id);
      const user = await this.usersService.findById(reminder.user_id);
      const counterparty =
        debt.lender_id === reminder.user_id ? debt.borrower : debt.lender;

      const title = 'Qarz eslatmasi';
      const body = `${counterparty.name} bilan bo'lgan ${formatSom(
        debt.remaining_amount,
      )} qarzingizning qaytarish sanasi yaqinlashmoqda.`;

      await this.notificationsService.create(
        reminder.user_id,
        'reminder',
        title,
        body,
      );

      if (user.push_enabled) {
        await this.pushService.sendToUser(reminder.user_id, {
          title,
          body,
          url: `/debts/${debt.id}`,
        });
      }

      if (user.telegram_enabled) {
        const telegramId = await this.telegramService.findTelegramIdForUser(
          reminder.user_id,
        );
        if (telegramId) {
          await this.telegramService.sendMessage(
            telegramId,
            `${title}\n\n${body}`,
          );
        }
      }

      await this.supabase
        .from('reminders')
        .update({ status: 'sent' })
        .eq('id', reminder.id);
    } catch (error) {
      this.logger.error(
        `Failed to process reminder ${reminder.id}: ${(error as Error).message}`,
      );
      await this.supabase
        .from('reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id);
    }
  }
}
