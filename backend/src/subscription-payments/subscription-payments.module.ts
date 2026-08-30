import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { PaymentProvidersModule } from '../payment-providers/payment-providers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TelegramModule } from '../telegram/telegram.module';
import { SubscriptionPaymentsService } from './subscription-payments.service';
import { SubscriptionExpiryService } from './subscription-expiry.service';
import { SubscriptionCheckoutController } from './subscription-checkout.controller';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PaymentProvidersModule,
    NotificationsModule,
    TelegramModule,
  ],
  controllers: [SubscriptionCheckoutController, SubscriptionWebhooksController],
  providers: [SubscriptionPaymentsService, SubscriptionExpiryService],
})
export class SubscriptionPaymentsModule {}
