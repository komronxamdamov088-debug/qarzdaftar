import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderName } from '../../database/database.types';
import {
  CheckoutRequest,
  ParsedWebhookEvent,
  RawWebhookRequest,
} from '../interfaces/payment-provider.interface';
import { BasePaymentProvider } from './base-payment-provider';

// TODO(qulay-pay): Qulay Pay is a smaller, less-documented aggregator than
// Click/Payme. The field names/signature scheme below (HMAC-SHA256 over the
// raw webhook body, hex-encoded, in an `X-Qulay-Signature` header) are
// PROVISIONAL — built against the same PaymentProvider interface as the
// other two gateways so the rest of the system (checkout endpoint, webhook
// controller, idempotency, PaymentTransactionsService) doesn't need to know
// the difference, but every detail here must be verified against Qulay
// Pay's real integration docs once a merchant account exists.
interface QulayPayWebhookBody {
  transaction_id: string; // Qulay Pay's own id
  merchant_transaction_id: string; // our transactionId
  amount: number; // som
  status: string;
}

@Injectable()
export class QulayPayProvider extends BasePaymentProvider {
  readonly name: PaymentProviderName = 'qulay_pay';

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('QULAY_PAY_MERCHANT_ID') &&
      this.config.get<string>('QULAY_PAY_SECRET_KEY') &&
      this.config.get<string>('QULAY_PAY_CHECKOUT_BASE_URL') &&
      this.config.get<string>('QULAY_PAY_API_BASE_URL'),
    );
  }

  protected doBuildCheckoutUrl(request: CheckoutRequest): string {
    const baseUrl = this.config.get<string>('QULAY_PAY_CHECKOUT_BASE_URL')!;
    const merchantId = this.config.get<string>('QULAY_PAY_MERCHANT_ID')!;

    const url = new URL(baseUrl);
    url.searchParams.set('merchant_id', merchantId);
    url.searchParams.set('amount', request.amount.toFixed(2));
    url.searchParams.set('merchant_transaction_id', request.transactionId);
    url.searchParams.set('return_url', request.returnUrl);
    return url.toString();
  }

  protected doVerifySignature(request: RawWebhookRequest): boolean {
    const provided = request.headers['x-qulay-signature'];
    const signature = Array.isArray(provided) ? provided[0] : provided;
    if (!signature) {
      return false;
    }

    const secretKey = this.config.get<string>('QULAY_PAY_SECRET_KEY')!;
    const expected = createHmac('sha256', secretKey)
      .update(request.rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');
    return (
      expectedBuf.length === providedBuf.length &&
      timingSafeEqual(expectedBuf, providedBuf)
    );
  }

  protected doParseWebhook(request: RawWebhookRequest): ParsedWebhookEvent {
    const body = request.body as QulayPayWebhookBody;
    return {
      transactionId: body.merchant_transaction_id,
      providerTransactionId: body.transaction_id,
      amount: body.amount,
      status: body.status === 'success' ? 'success' : 'failed',
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  protected doBuildSuccessResponse(event: ParsedWebhookEvent): unknown {
    return { status: 'ok', transaction_id: event.providerTransactionId };
  }

  protected doBuildErrorResponse(code: string, message: string): unknown {
    return { status: 'error', code, message };
  }
}
