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
  /** Our payment_transactions.id, recovered from the webhook URL/payload. */
  transactionId: string;
  providerTransactionId: string;
  amount: number;
  status: 'success' | 'failed';
  rawPayload: Record<string, unknown>;
}

export interface RawWebhookRequest {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * One implementation per gateway (Click/Payme/Qulay Pay). Every method other
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
  buildErrorResponse(code: string, message: string): unknown;
}
