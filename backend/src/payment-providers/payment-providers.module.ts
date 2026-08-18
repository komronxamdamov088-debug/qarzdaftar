import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushModule } from '../push/push.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PaymentsModule } from '../payments/payments.module';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { YagonaPayProvider } from './providers/yagona-pay.provider';
import { PaymentProvidersService } from './payment-providers.service';
import { PaymentTransactionsService } from './payment-transactions.service';
import { PaymentWebhooksController } from './payment-webhooks.controller';
import { PaymentCheckoutController } from './payment-checkout.controller';
import { PublicPaymentCheckoutController } from './public-payment-checkout.controller';

@Module({
  imports: [
    DatabaseModule,
    DebtsModule,
    UsersModule,
    NotificationsModule,
    PushModule,
    TelegramModule,
    PaymentsModule,
  ],
  controllers: [
    PaymentWebhooksController,
    PaymentCheckoutController,
    PublicPaymentCheckoutController,
  ],
  providers: [
    ClickProvider,
    PaymeProvider,
    YagonaPayProvider,
    PaymentProvidersService,
    PaymentTransactionsService,
  ],
  exports: [PaymentTransactionsService],
})
export class PaymentProvidersModule {}
