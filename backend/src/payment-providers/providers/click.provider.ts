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
// taking real payments. Click's full flow is two-phase (Prepare then
// Complete, distinguished by the `action` field) — both phases share the
// same sign_string formula and are handled by the same verify/parse pair
// below; PaymentTransactionsService treats action=1 (Complete) as the
// success signal.
const CLICK_ACTION_COMPLETE = 1;

interface ClickWebhookBody {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
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

    const expected = createHash('md5')
      .update(
        `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.amount}${body.action}${body.sign_time}`,
      )
      .digest('hex');

    return expected === body.sign_string;
  }

  protected doParseWebhook(request: RawWebhookRequest): ParsedWebhookEvent {
    const body = request.body as ClickWebhookBody;
    return {
      transactionId: body.merchant_trans_id,
      providerTransactionId: body.click_trans_id,
      amount: Number(body.amount),
      status:
        Number(body.action) === CLICK_ACTION_COMPLETE && body.error === '0'
          ? 'success'
          : 'failed',
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  protected doBuildSuccessResponse(event: ParsedWebhookEvent): unknown {
    return {
      click_trans_id: event.providerTransactionId,
      merchant_trans_id: event.transactionId,
      error: 0,
      error_note: 'Success',
    };
  }

  protected doBuildErrorResponse(code: string, message: string): unknown {
    return { error: code, error_note: message };
  }
}
