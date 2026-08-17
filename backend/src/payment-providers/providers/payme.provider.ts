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
// against Payme's real sandbox. Verify against a real test merchant account
// before taking real payments — in particular Payme's full method set
// (CheckPerformTransaction/CreateTransaction/PerformTransaction/
// CancelTransaction) is richer than the single perform-transaction webhook
// modeled here; PaymentTransactionsService only cares about the terminal
// success/failure outcome.
const PAYME_PERFORM_METHOD = 'PerformTransaction';

interface PaymeWebhookBody {
  method: string;
  params: {
    id: string; // Payme's own transaction id
    account?: { transaction_id?: string }; // our transactionId, echoed back
    amount?: number; // tiyin
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

    return {
      transactionId: body.params.account?.transaction_id ?? '',
      providerTransactionId: body.params.id,
      amount: amountSom,
      status: body.method === PAYME_PERFORM_METHOD ? 'success' : 'failed',
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  protected doBuildSuccessResponse(event: ParsedWebhookEvent): unknown {
    return {
      result: {
        transaction: event.providerTransactionId,
        perform_time: Date.now(),
        state: 2,
      },
    };
  }

  protected doBuildErrorResponse(code: string, message: string): unknown {
    return {
      error: { code: -31008, message: { uz: message, ru: message } },
      id: code,
    };
  }
}
