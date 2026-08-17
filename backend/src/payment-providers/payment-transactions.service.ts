import { randomUUID } from 'crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtsService } from '../debts/debts.service';
import { DebtWithParties } from '../debts/entities/debt.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';
import { TelegramService } from '../telegram/telegram.service';
import { PaymentsService } from '../payments/payments.service';
import {
  formatSom,
  getNotificationsI18n,
} from '../common/i18n/notifications-i18n';
import { PaymentProvidersService } from './payment-providers.service';
import { RawWebhookRequest } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentTransactionsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly providers: PaymentProvidersService,
    private readonly debtsService: DebtsService,
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
    private readonly telegramService: TelegramService,
  ) {}

  // Amount is always the server-computed remaining amount — never
  // client-supplied — and full-remaining-amount-only in v1 (no
  // partial-amount provider checkout yet, per the locked-in v1 scope).
  async initiateCheckout(
    debt: DebtWithParties,
    providerName: string,
    payerId: string,
    returnUrl: string,
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    const provider = this.providers.getProvider(providerName);
    const amount = Number(debt.remaining_amount);
    const transactionId = randomUUID();

    // Throws PROVIDER_NOT_CONFIGURED before any row is written if the
    // provider's env vars are unset — never fakes a checkout URL.
    const checkoutUrl = provider.buildCheckoutUrl({
      transactionId,
      debtId: debt.id,
      amount,
      returnUrl,
    });

    const { error } = await this.supabase.from('payment_transactions').insert({
      id: transactionId,
      debt_id: debt.id,
      user_id: payerId,
      provider: provider.name,
      amount,
      status: 'pending',
      checkout_url: checkoutUrl,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { checkoutUrl, transactionId };
  }

  async handleWebhook(
    providerName: string,
    request: RawWebhookRequest,
  ): Promise<unknown> {
    const provider = this.providers.getProvider(providerName);

    // Reject unverified requests outright — a webhook is never treated as a
    // trusted signal until its signature checks out.
    if (!provider.verifySignature(request)) {
      return provider.buildErrorResponse(
        'INVALID_SIGNATURE',
        'Imzo tasdiqlanmadi',
      );
    }

    const event = provider.parseWebhook(request);

    const { data: transaction, error } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', event.transactionId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!transaction) {
      return provider.buildErrorResponse(
        'TRANSACTION_NOT_FOUND',
        'Tranzaksiya topilmadi',
      );
    }

    // Idempotent: a replayed/retried webhook for an already-applied
    // transaction is a no-op, never applied twice.
    if (transaction.status === 'success') {
      return provider.buildSuccessResponse(event);
    }

    if (event.status !== 'success') {
      await this.supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          provider_transaction_id: event.providerTransactionId,
          raw_webhook_payload: event.rawPayload,
        })
        .eq('id', transaction.id);
      return provider.buildErrorResponse(
        'PAYMENT_FAILED',
        "To'lov muvaffaqiyatsiz",
      );
    }

    // The webhook's reported amount is never authoritative on its own — it
    // must match what we recorded at checkout time.
    if (Math.abs(event.amount - Number(transaction.amount)) > 0.01) {
      await this.supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: 'AMOUNT_MISMATCH',
          raw_webhook_payload: event.rawPayload,
        })
        .eq('id', transaction.id);
      return provider.buildErrorResponse(
        'AMOUNT_MISMATCH',
        'Summa mos kelmadi',
      );
    }

    const debt = await this.debtsService.findById(transaction.debt_id);

    const { payment } = await this.paymentsService.recordProviderPayment(
      debt.borrower_id,
      transaction.debt_id,
      Number(transaction.amount),
      provider.name,
      event.providerTransactionId,
      transaction.id,
    );

    await this.supabase
      .from('payment_transactions')
      .update({
        status: 'success',
        provider_transaction_id: event.providerTransactionId,
        raw_webhook_payload: event.rawPayload,
      })
      .eq('id', transaction.id);

    await this.notifyLender(debt, Number(payment.amount));

    return provider.buildSuccessResponse(event);
  }

  private async notifyLender(
    debt: DebtWithParties,
    amount: number,
  ): Promise<void> {
    const lender = await this.usersService.findById(debt.lender_id);
    const i18n = getNotificationsI18n(lender.locale);
    const title = i18n.paymentReceivedTitle;
    const body = i18n.paymentReceivedBody(
      debt.borrower.name,
      formatSom(amount, lender.locale),
    );

    await this.notificationsService.create(
      debt.lender_id,
      'payment',
      title,
      body,
    );

    if (lender.push_enabled) {
      await this.pushService.sendToUser(debt.lender_id, {
        title,
        body,
        url: `/debts/${debt.id}`,
      });
    }

    if (lender.telegram_enabled) {
      const telegramId = await this.telegramService.findTelegramIdForUser(
        debt.lender_id,
      );
      if (telegramId) {
        await this.telegramService.sendMessage(
          telegramId,
          `${title}\n\n${body}`,
        );
      }
    }
  }
}
