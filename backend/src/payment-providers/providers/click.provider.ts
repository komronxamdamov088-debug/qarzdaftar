import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderName } from '../../database/database.types';
import {
  CheckoutRequest,
  ParsedWebhookEvent,
  RawWebhookRequest,
} from '../interfaces/payment-provider.interface';
import { BasePaymentProvider } from './base-payment-provider';

// Click Merchant API (https://docs.click.uz) — MD5 sign_string scheme.
// Implemented against public docs; no real CLICK_* credentials exist in
// this project yet, so this has never been exercised against Click's real
// sandbox. Verify byte-for-byte against a real test merchant account before
// taking real payments.
//
// Click's flow is two-phase, distinguished by the `action` field:
//  - Prepare (action=0): an acknowledgment only — Click asks "can you
//    accept this payment?" before any money moves. Its sign_string does
//    NOT include merchant_prepare_id (that field doesn't exist yet at this
//    point — we generate and return it in the Prepare response).
//  - Complete (action=1): the money-moving step. Its sign_string DOES
//    include merchant_prepare_id, echoed back from what we returned during
//    Prepare. Using the Prepare formula here (i.e. omitting
//    merchant_prepare_id) would make every real Complete webhook fail
//    signature verification — this was caught and fixed by re-reading
//    Click's docs; it was never exercised live since no credentials exist.
// Both phases map onto the shared 'create'/'complete' vocabulary in
// ParsedWebhookEvent.phase so PaymentTransactionsService handles them with
// the same generic logic Payme's CreateTransaction/PerformTransaction use.
const CLICK_ACTION_COMPLETE = 1;

interface ClickWebhookBody {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
  error: string;
}

@Injectable()
export class ClickProvider extends BasePaymentProvider {
  readonly name: PaymentProviderName = 'click';

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('CLICK_SERVICE_ID') &&
      this.config.get<string>('CLICK_MERCHANT_ID') &&
      this.config.get<string>('CLICK_SECRET_KEY') &&
      this.config.get<string>('CLICK_CHECKOUT_BASE_URL'),
    );
  }

  protected doBuildCheckoutUrl(request: CheckoutRequest): string {
    const baseUrl = this.config.get<string>('CLICK_CHECKOUT_BASE_URL')!;
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID')!;
    const merchantId = this.config.get<string>('CLICK_MERCHANT_ID')!;

    const url = new URL(baseUrl);
    url.searchParams.set('service_id', serviceId);
    url.searchParams.set('merchant_id', merchantId);
    url.searchParams.set('amount', request.amount.toFixed(2));
    url.searchParams.set('transaction_param', request.transactionId);
    url.searchParams.set('return_url', request.returnUrl);
    return url.toString();
  }

  protected doVerifySignature(request: RawWebhookRequest): boolean {
    const body = request.body as ClickWebhookBody;
    const secretKey = this.config.get<string>('CLICK_SECRET_KEY')!;
    const isComplete = Number(body.action) === CLICK_ACTION_COMPLETE;

    // Complete's sign_string inserts merchant_prepare_id right after
    // merchant_trans_id; Prepare's doesn't have that field yet.
    const parts = isComplete
      ? [
          body.click_trans_id,
          body.service_id,
          secretKey,
          body.merchant_trans_id,
          body.merchant_prepare_id ?? '',
          body.amount,
          body.action,
          body.sign_time,
        ]
      : [
          body.click_trans_id,
          body.service_id,
          secretKey,
          body.merchant_trans_id,
          body.amount,
          body.action,
          body.sign_time,
        ];

    const expected = createHash('md5').update(parts.join('')).digest('hex');
    return expected === body.sign_string;
  }

  protected doParseWebhook(request: RawWebhookRequest): ParsedWebhookEvent {
    const body = request.body as ClickWebhookBody;
    const isComplete = Number(body.action) === CLICK_ACTION_COMPLETE;
    return {
      transactionId: body.merchant_trans_id,
      providerTransactionId: body.click_trans_id,
      amount: Number(body.amount),
      status: body.error === '0' ? 'success' : 'failed',
      rawPayload: body as unknown as Record<string, unknown>,
      // Prepare only acknowledges (maps to the shared 'create' phase);
      // Complete is the money-moving step.
      phase: isComplete ? 'complete' : 'create',
    };
  }

  protected doBuildSuccessResponse(event: ParsedWebhookEvent): unknown {
    return {
      click_trans_id: event.providerTransactionId,
      merchant_trans_id: event.transactionId,
      // We don't track a separate prepare id — our own transaction id
      // already uniquely identifies this payment, and Click just echoes
      // whatever we return here back to us on the follow-up Complete call.
      merchant_prepare_id: event.transactionId,
      error: 0,
      error_note: 'Success',
    };
  }

  protected doBuildErrorResponse(code: string, message: string): unknown {
    return { error: code, error_note: message };
  }
}
