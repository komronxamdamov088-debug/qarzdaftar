import { PaymentProviderName } from '../../database/database.types';

export interface CheckoutRequest {
  /** Our own payment_transactions.id — passed through so the provider's
   * webhook can be matched back to this transaction even before we know
   * the provider's own transaction id. */
  transactionId: string;
  debtId: string;
  /** Always the server-computed remaining amount — never client-supplied. */
  amount: number;
  returnUrl: string;
}

export interface ParsedWebhookEvent {
  /** Our payment_transactions.id, recovered from the webhook URL/payload.
   * Some gateway calls (Payme's PerformTransaction/CancelTransaction) don't
   * carry our id at all — only the gateway's own id — so this may start
   * out empty; PaymentTransactionsService always backfills it from the
   * looked-up row before any provider response is built. */
  transactionId: string;
  providerTransactionId: string;
  amount: number;
  status: 'success' | 'failed';
  rawPayload: Record<string, unknown>;
  /**
   * Some gateways split one logical payment into multiple webhook calls
   * that PaymentTransactionsService must handle differently:
   *  - 'check'    read-only precondition check (Payme CheckPerformTransaction).
   *               Never writes to our stored transaction.
   *  - 'create'   acknowledges/records the gateway's own transaction id
   *               against our pending row, but does NOT move money yet
   *               (Click Prepare, Payme CreateTransaction).
   *  - 'cancel'   the gateway cancels a transaction before/without it ever
   *               completing (Payme CancelTransaction). Marks our row
   *               cancelled; a cancel against an already-completed
   *               transaction (i.e. a refund) is explicitly rejected, never
   *               silently accepted.
   *  - 'complete' or undefined  the terminal, money-moving webhook (Click
   *               Complete, Payme PerformTransaction, Yagona Pay's
   *               single-phase webhook). Only this phase ever calls
   *               PaymentsService.recordProviderPayment.
   */
  phase?: 'check' | 'create' | 'cancel' | 'complete';
  /** JSON-RPC 2.0 request id (Payme) — must be echoed back verbatim in the
   * response when the request included one, per the JSON-RPC 2.0 spec
   * Payme's own docs cite. */
  rpcId?: unknown;
  /** Our stored payment_transactions row's timestamps, filled in by
   * PaymentTransactionsService (providers never touch the database
   * directly). Needed so a retried webhook call returns byte-identical
   * timing fields — Payme's docs require CreateTransaction/
   * CancelTransaction/PerformTransaction responses to match on every retry
   * rather than drifting to "now" on each replay. */
  transactionTimestamps?: { createdAtMs: number; updatedAtMs: number };
}

export interface RawWebhookRequest {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * One implementation per gateway (Click/Payme/Yagona Pay). Every method other
 * than `isConfigured()` MUST throw a `PROVIDER_NOT_CONFIGURED` error when the
 * provider's env vars are unset — mirroring how `AiService` behaves when
 * `AI_API_KEY` is missing. Never fake a successful payment: `success` is
 * only ever produced by `parseWebhook()` after `verifySignature()` accepts
 * the request.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  buildCheckoutUrl(request: CheckoutRequest): string;
  verifySignature(request: RawWebhookRequest): boolean;
  parseWebhook(request: RawWebhookRequest): ParsedWebhookEvent;
  buildSuccessResponse(event: ParsedWebhookEvent): unknown;
  /** `event` is provided whenever the error happens after parseWebhook()
   * has already run (e.g. TRANSACTION_NOT_FOUND, AMOUNT_MISMATCH) so a
   * provider that needs to echo request-scoped data (Payme's JSON-RPC id)
   * can do so; it's absent for errors detected before parsing (e.g. an
   * invalid signature). */
  buildErrorResponse(
    code: string,
    message: string,
    event?: ParsedWebhookEvent,
  ): unknown;
}
