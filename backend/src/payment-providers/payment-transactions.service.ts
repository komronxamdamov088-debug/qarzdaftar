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

    // Some gateway calls (Payme's PerformTransaction/CancelTransaction)
    // only carry the gateway's OWN transaction id, never ours — fall back
    // to looking our row up by provider_transaction_id in that case.
    const { data: transaction, error } = event.transactionId
      ? await this.supabase
          .from('payment_transactions')
          .select('*')
          .eq('id', event.transactionId)
          .maybeSingle()
      : await this.supabase
          .from('payment_transactions')
          .select('*')
          .eq('provider_transaction_id', event.providerTransactionId)
          .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!transaction) {
      return provider.buildErrorResponse(
        'TRANSACTION_NOT_FOUND',
        'Tranzaksiya topilmadi',
        event,
      );
    }

    // Backfill so every response built from here on has our real id and
    // stable, replay-safe timestamps, regardless of which fields this
    // particular call happened to carry.
    event.transactionId = transaction.id;
    event.transactionTimestamps = {
      createdAtMs: new Date(transaction.created_at).getTime(),
      updatedAtMs: new Date(transaction.updated_at).getTime(),
    };

    // Read-only precondition check (Payme CheckPerformTransaction) — never
    // writes anything.
    if (event.phase === 'check') {
      if (event.status !== 'success' || transaction.status !== 'pending') {
        return provider.buildErrorResponse(
          'PAYMENT_FAILED',
          "To'lov muvaffaqiyatsiz",
          event,
        );
      }
      if (Math.abs(event.amount - Number(transaction.amount)) > 0.01) {
        return provider.buildErrorResponse(
          'AMOUNT_MISMATCH',
          'Summa mos kelmadi',
          event,
        );
      }
      return provider.buildSuccessResponse(event);
    }

    // Acknowledges the gateway's own transaction id against our pending
    // row without moving money yet (Click Prepare / Payme
    // CreateTransaction).
    if (event.phase === 'create') {
      if (event.status !== 'success') {
        return provider.buildErrorResponse(
          'PAYMENT_FAILED',
          "To'lov muvaffaqiyatsiz",
          event,
        );
      }
      if (transaction.status !== 'pending') {
        // Idempotent replay against an already-decided transaction: just
        // re-acknowledge with the original timestamps, never re-decide.
        return provider.buildSuccessResponse(event);
      }
      if (Math.abs(event.amount - Number(transaction.amount)) > 0.01) {
        return provider.buildErrorResponse(
          'AMOUNT_MISMATCH',
          'Summa mos kelmadi',
          event,
        );
      }
      if (!transaction.provider_transaction_id) {
        await this.supabase
          .from('payment_transactions')
          .update({ provider_transaction_id: event.providerTransactionId })
          .eq('id', transaction.id);
      }
      return provider.buildSuccessResponse(event);
    }

    // The gateway cancels a transaction before/without it ever completing
    // (Payme CancelTransaction).
    if (event.phase === 'cancel') {
      if (transaction.status === 'success') {
        // A cancel/refund request against an already-completed payment
        // isn't supported yet — never silently "succeed" at undoing money
        // that's already been recorded against the debt.
        return provider.buildErrorResponse(
          'CANCEL_AFTER_COMPLETE_UNSUPPORTED',
          "To'langan tranzaksiyani bekor qilish hozircha qo'llab-quvvatlanmaydi",
          event,
        );
      }
      if (transaction.status !== 'cancelled') {
        await this.supabase
          .from('payment_transactions')
          .update({
            status: 'cancelled',
            provider_transaction_id: event.providerTransactionId,
            raw_webhook_payload: event.rawPayload,
          })
          .eq('id', transaction.id);
      }
      return provider.buildSuccessResponse(event);
    }

    // Terminal phase (Click Complete / Payme PerformTransaction / Yagona
    // Pay's single-phase webhook) — the only phase that ever applies money.

    // Idempotent: a replayed/retried webhook for an already-applied
    // transaction is a no-op, never applied twice.
    if (transaction.status === 'success') {
      return provider.buildSuccessResponse(event);
    }
    // Already decided the other way (failed/cancelled) — a late or
    // duplicate terminal call must never revive it and apply money. Found
    // live: a cancelled Payme transaction replaying PerformTransaction
    // fell through into the apply-payment path below unguarded before this
    // check existed.
    if (transaction.status !== 'pending') {
      return provider.buildErrorResponse(
        'PAYMENT_FAILED',
        "To'lov muvaffaqiyatsiz",
        event,
      );
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
        event,
      );
    }

    // The webhook's reported amount is never authoritative on its own — it
    // must match what we recorded at checkout time. Some gateways' terminal
    // call carries no amount at all (Payme's PerformTransaction only sends
    // `{id}` — the amount was already verified during CheckPerformTransaction/
    // CreateTransaction, both of which do carry it and run this same check
    // via the 'check'/'create' branches above), so event.amount is 0 in
    // that case and there is nothing new to cross-check here.
    if (
      event.amount > 0 &&
      Math.abs(event.amount - Number(transaction.amount)) > 0.01
    ) {
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
        event,
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
