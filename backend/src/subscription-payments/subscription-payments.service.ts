import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { UsersService } from '../users/users.service';
import { PaymentProvidersService } from '../payment-providers/payment-providers.service';
import { RawWebhookRequest } from '../payment-providers/interfaces/payment-provider.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { TelegramService } from '../telegram/telegram.service';

// Mirrors PaymentTransactionsService's webhook state machine (see that
// file's own comments for the full phase-by-phase rationale — Click's
// Prepare/Complete, Payme's Check/Create/Perform/Cancel) but on
// subscription_transactions, and with a completely different terminal
// action: activating a subscription instead of recording a debt payment.
// Kept as its own service rather than generalizing PaymentTransactionsService
// to handle both, to avoid touching the already-tested, already-live debt
// payment flow for an unrelated feature.
@Injectable()
export class SubscriptionPaymentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly providers: PaymentProvidersService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly telegramService: TelegramService,
  ) {}

  // The "contact support" hint on the blocked-but-registered screen used to
  // be text-only — this makes it an actual action: flags the request
  // (persisted, so it survives as a badge in /admin/users even if no admin
  // is around right now) and notifies every admin immediately, both in-app
  // and via Telegram (mirrors PaymentTransactionsService.notifyLender's
  // telegram_enabled-gated pattern). Cleared the moment an admin actually
  // activates the account — see AdminService.updateSubscriptionStatus and
  // this service's own activateSubscription().
  async requestCashPayment(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user.account_type !== 'business' || !user.subscription_plan_months) {
      throw new BadRequestException({
        code: 'NOT_REGISTERED_AS_BUSINESS',
        message: "Avval do'kon sifatida ro'yxatdan o'ting va rejani tanlang",
      });
    }

    const { error } = await this.supabase
      .from('users')
      .update({ cash_payment_requested_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const { data: admins, error: adminsError } = await this.supabase
      .from('users')
      .select('id, telegram_enabled')
      .eq('role', 'admin');
    if (adminsError) {
      throw new InternalServerErrorException(adminsError.message);
    }

    const title = "Do'kon naqt to'lov so'radi";
    const body = `${user.business_name ?? user.name} — ${Number(user.subscription_price).toLocaleString('uz-UZ')} so'm${
      user.phone ? `, tel: ${user.phone}` : ''
    }`;

    for (const admin of admins ?? []) {
      await this.notificationsService.create(
        admin.id,
        'cash_payment_request',
        title,
        body,
      );
      if (admin.telegram_enabled) {
        const telegramId = await this.telegramService.findTelegramIdForUser(
          admin.id,
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

  // Amount and plan are always read from the user's own row (set by
  // UsersService.registerBusiness) — never client-supplied at checkout time,
  // same principle as debt-payment checkout using the server-computed
  // remaining amount.
  async initiateCheckout(
    userId: string,
    providerName: string,
    returnUrl: string,
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    const user = await this.usersService.findById(userId);
    if (user.account_type !== 'business' || !user.subscription_plan_months) {
      throw new BadRequestException({
        code: 'NOT_REGISTERED_AS_BUSINESS',
        message: "Avval do'kon sifatida ro'yxatdan o'ting va rejani tanlang",
      });
    }

    const provider = this.providers.getProvider(providerName);
    const amount = Number(user.subscription_price);
    const transactionId = randomUUID();

    const checkoutUrl = provider.buildCheckoutUrl({
      transactionId,
      amount,
      returnUrl,
    });

    const { error } = await this.supabase
      .from('subscription_transactions')
      .insert({
        id: transactionId,
        user_id: userId,
        provider: provider.name,
        plan_months: user.subscription_plan_months,
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

    if (!provider.verifySignature(request)) {
      return provider.buildErrorResponse(
        'INVALID_SIGNATURE',
        'Imzo tasdiqlanmadi',
      );
    }

    const event = provider.parseWebhook(request);

    const { data: transaction, error } = event.transactionId
      ? await this.supabase
          .from('subscription_transactions')
          .select('*')
          .eq('id', event.transactionId)
          .maybeSingle()
      : await this.supabase
          .from('subscription_transactions')
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

    event.transactionId = transaction.id;
    event.transactionTimestamps = {
      createdAtMs: new Date(transaction.created_at).getTime(),
      updatedAtMs: new Date(transaction.updated_at).getTime(),
    };

    // Read-only precondition check (Payme CheckPerformTransaction).
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

    // Acknowledges the gateway's own transaction id (Click Prepare / Payme
    // CreateTransaction) without moving anything yet.
    if (event.phase === 'create') {
      if (event.status !== 'success') {
        return provider.buildErrorResponse(
          'PAYMENT_FAILED',
          "To'lov muvaffaqiyatsiz",
          event,
        );
      }
      if (transaction.status !== 'pending') {
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
          .from('subscription_transactions')
          .update({ provider_transaction_id: event.providerTransactionId })
          .eq('id', transaction.id);
      }
      return provider.buildSuccessResponse(event);
    }

    // Payme CancelTransaction.
    if (event.phase === 'cancel') {
      if (transaction.status === 'success') {
        return provider.buildErrorResponse(
          'CANCEL_AFTER_COMPLETE_UNSUPPORTED',
          "To'langan tranzaksiyani bekor qilish hozircha qo'llab-quvvatlanmaydi",
          event,
        );
      }
      if (transaction.status !== 'cancelled') {
        await this.supabase
          .from('subscription_transactions')
          .update({
            status: 'cancelled',
            provider_transaction_id: event.providerTransactionId,
            raw_webhook_payload: event.rawPayload,
          })
          .eq('id', transaction.id);
      }
      return provider.buildSuccessResponse(event);
    }

    // Terminal phase — the only phase that ever activates a subscription.
    if (transaction.status === 'success') {
      return provider.buildSuccessResponse(event);
    }
    if (transaction.status !== 'pending') {
      return provider.buildErrorResponse(
        'PAYMENT_FAILED',
        "To'lov muvaffaqiyatsiz",
        event,
      );
    }

    if (event.status !== 'success') {
      await this.supabase
        .from('subscription_transactions')
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

    if (
      event.amount > 0 &&
      Math.abs(event.amount - Number(transaction.amount)) > 0.01
    ) {
      await this.supabase
        .from('subscription_transactions')
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

    await this.activateSubscription(
      transaction.user_id,
      transaction.plan_months,
    );

    await this.supabase
      .from('subscription_transactions')
      .update({
        status: 'success',
        provider_transaction_id: event.providerTransactionId,
        raw_webhook_payload: event.rawPayload,
      })
      .eq('id', transaction.id);

    return provider.buildSuccessResponse(event);
  }

  // Extends subscription_valid_until from whichever is later, today or the
  // shop's current valid-until date — same "stack, don't reset" rule as
  // AdminService.addSubscriptionBonusDays, so a renewal paid before the
  // previous period expires doesn't lose the remaining days.
  private async activateSubscription(
    userId: string,
    planMonths: number,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    const today = new Date();
    const currentValidUntil = user.subscription_valid_until
      ? new Date(user.subscription_valid_until)
      : null;
    const base =
      currentValidUntil && currentValidUntil > today
        ? currentValidUntil
        : today;
    const next = new Date(base);
    next.setMonth(next.getMonth() + planMonths);

    const { error } = await this.supabase
      .from('users')
      .update({
        subscription_active: true,
        subscription_valid_until: next.toISOString().slice(0, 10),
        cash_payment_requested_at: null,
      })
      .eq('id', userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
