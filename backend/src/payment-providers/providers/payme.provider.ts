import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderName } from '../../database/database.types';
import {
  CheckoutRequest,
  ParsedWebhookEvent,
  RawWebhookRequest,
} from '../interfaces/payment-provider.interface';
import { BasePaymentProvider } from './base-payment-provider';

// Payme Merchant API (https://developer.help.paycom.uz) — JSON-RPC 2.0 over
// HTTPS with HTTP Basic Auth ("Paycom:<PAYME_KEY>"), amounts in tiyin
// (amount * 100). Implemented against public docs; no real PAYME_*
// credentials exist in this project yet, so this has never been exercised
// against Payme's real sandbox — verify against a real test merchant
// account before taking real payments.
//
// Payme's real merchant protocol has 4 methods that gate money movement
// (verified against developer.help.paycom.uz during this review):
//  - CheckPerformTransaction: read-only "can this payment happen?" check.
//  - CreateTransaction: creates Payme's own transaction record against our
//    pending row. Does NOT move money — that's PerformTransaction's job.
//  - PerformTransaction: the actual money-moving step.
//  - CancelTransaction: cancels a transaction, before or after completion.
// Only CreateTransaction and CheckPerformTransaction carry our own
// `account.transaction_id`; Perform/Cancel/CheckTransaction only carry
// Payme's own `id`, so PaymentTransactionsService falls back to looking our
// row up by provider_transaction_id for those. Payme also requires retried
// Create/Perform/Cancel calls to return byte-identical responses, which is
// why ParsedWebhookEvent carries the stored row's timestamps rather than
// each response using `Date.now()`.
//
// Deliberately NOT implemented: CheckTransaction and GetStatement. Both are
// read-only reporting/reconciliation methods Payme may call independently
// of the money-moving flow above; they're not required for a payment to go
// through, and are left as a documented gap rather than guessed at without
// a live sandbox to verify against.
const PAYME_CHECK_METHOD = 'CheckPerformTransaction';
const PAYME_CREATE_METHOD = 'CreateTransaction';
const PAYME_PERFORM_METHOD = 'PerformTransaction';
const PAYME_CANCEL_METHOD = 'CancelTransaction';

// Standard Payme merchant API error codes (developer.help.paycom.uz/metody-merchant-api/oshibki-errors/).
const PAYME_ERROR_CODES: Record<string, number> = {
  INVALID_SIGNATURE: -32504,
  TRANSACTION_NOT_FOUND: -31003,
  AMOUNT_MISMATCH: -31001,
  PAYMENT_FAILED: -31008,
  CANCEL_AFTER_COMPLETE_UNSUPPORTED: -31007,
};
const PAYME_DEFAULT_ERROR_CODE = -31008; // "operation cannot be performed" — safe generic fallback

interface PaymeWebhookBody {
  method: string;
  // JSON-RPC 2.0 request id — echoed back verbatim per the spec Payme's
  // own docs cite; Payme's doc examples omit it from illustrative
  // snippets, but a spec-compliant client always sends and expects it.
  id?: number | string;
  params: {
    id?: string; // Payme's own transaction id (Create/Perform/Cancel)
    time?: number; // ms epoch, CreateTransaction only
    amount?: number; // tiyin
    account?: { transaction_id?: string }; // our transaction id — only present on CheckPerformTransaction/CreateTransaction
    reason?: number; // CancelTransaction only
  };
}

@Injectable()
export class PaymeProvider extends BasePaymentProvider {
  readonly name: PaymentProviderName = 'payme';

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('PAYME_MERCHANT_ID') &&
      this.config.get<string>('PAYME_KEY') &&
      this.config.get<string>('PAYME_CHECKOUT_BASE_URL'),
    );
  }

  protected doBuildCheckoutUrl(request: CheckoutRequest): string {
    const baseUrl = this.config.get<string>('PAYME_CHECKOUT_BASE_URL')!;
    const merchantId = this.config.get<string>('PAYME_MERCHANT_ID')!;
    const amountTiyin = Math.round(request.amount * 100);

    const params = [
      `m=${merchantId}`,
      `ac.transaction_id=${request.transactionId}`,
      `a=${amountTiyin}`,
      `c=${encodeURIComponent(request.returnUrl)}`,
    ].join(';');
    const encoded = Buffer.from(params, 'utf8').toString('base64');
    return `${baseUrl}/${encoded}`;
  }

  protected doVerifySignature(request: RawWebhookRequest): boolean {
    const auth = request.headers['authorization'];
    const header = Array.isArray(auth) ? auth[0] : auth;
    if (!header?.startsWith('Basic ')) {
      return false;
    }

    const decoded = Buffer.from(
      header.slice('Basic '.length),
      'base64',
    ).toString('utf8');
    const [login, key] = decoded.split(':');
    const expectedKey = this.config.get<string>('PAYME_KEY')!;
    return login === 'Paycom' && key === expectedKey;
  }

  protected doParseWebhook(request: RawWebhookRequest): ParsedWebhookEvent {
    const body = request.body as PaymeWebhookBody;
    const amountSom = (body.params.amount ?? 0) / 100;

    let phase: ParsedWebhookEvent['phase'];
    switch (body.method) {
      case PAYME_CHECK_METHOD:
        phase = 'check';
        break;
      case PAYME_CREATE_METHOD:
        phase = 'create';
        break;
      case PAYME_CANCEL_METHOD:
        phase = 'cancel';
        break;
      case PAYME_PERFORM_METHOD:
      default:
        phase = 'complete';
        break;
    }

    return {
      // Only Check/Create ever carry our own id; Perform/Cancel don't —
      // PaymentTransactionsService backfills this from the row it looks up
      // by provider_transaction_id before any response is built.
      transactionId: body.params.account?.transaction_id ?? '',
      providerTransactionId: body.params.id ?? '',
      amount: amountSom,
      // Payme has no "this call itself represents failure" signal the way
      // Click's `error` field does — every well-formed call here is an
      // attempt whose accept/reject decision is ours to make via
      // buildErrorResponse; PaymentTransactionsService's own pending-state
      // and amount checks are what actually decide it.
      status: 'success',
      rawPayload: body as unknown as Record<string, unknown>,
      phase,
      rpcId: body.id,
    };
  }

  protected doBuildSuccessResponse(event: ParsedWebhookEvent): unknown {
    const createdAtMs = event.transactionTimestamps?.createdAtMs ?? Date.now();
    const updatedAtMs = event.transactionTimestamps?.updatedAtMs ?? Date.now();

    let result: unknown;
    switch (event.phase) {
      case 'check':
        result = { allow: true };
        break;
      case 'create':
        result = {
          create_time: createdAtMs,
          transaction: event.transactionId,
          state: 1,
        };
        break;
      case 'cancel':
        result = {
          transaction: event.transactionId,
          cancel_time: updatedAtMs,
          state: -1,
        };
        break;
      case 'complete':
      default:
        result = {
          transaction: event.transactionId,
          perform_time: updatedAtMs,
          state: 2,
        };
        break;
    }

    return this.withRpcId({ result }, event.rpcId);
  }

  protected doBuildErrorResponse(
    code: string,
    message: string,
    event?: ParsedWebhookEvent,
  ): unknown {
    const paymeCode = PAYME_ERROR_CODES[code] ?? PAYME_DEFAULT_ERROR_CODE;
    return this.withRpcId(
      {
        error: {
          code: paymeCode,
          message: { uz: message, ru: message, en: message },
        },
      },
      event?.rpcId,
    );
  }

  private withRpcId(body: Record<string, unknown>, rpcId: unknown): unknown {
    return rpcId === undefined ? body : { ...body, id: rpcId };
  }
}
