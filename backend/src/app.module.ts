import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DebtsModule } from './debts/debts.module';
import { PaymentsModule } from './payments/payments.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PaymentProvidersModule } from './payment-providers/payment-providers.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    DebtsModule,
    PaymentsModule,
    RemindersModule,
    NotificationsModule,
    PushModule,
    TelegramModule,
    AiModule,
    AdminModule,
    StatsModule,
    ReceiptsModule,
    PaymentProvidersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerModule.forRoot() only registers the storage/options — the
    // guard itself was never wired up, so rate limiting was a no-op until
    // this line (CLAUDE.md section 32: "rate limiting where appropriate").
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
