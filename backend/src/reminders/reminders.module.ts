import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushModule } from '../push/push.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';

@Module({
  imports: [
    DatabaseModule,
    DebtsModule,
    UsersModule,
    NotificationsModule,
    PushModule,
    TelegramModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, ReminderSchedulerService],
})
export class RemindersModule {}
