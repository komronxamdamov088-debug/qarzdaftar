import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentProviderName } from '../../database/database.types';
import {
  CheckoutRequest,
  ParsedWebhookEvent,
  PaymentProvider,
  RawWebhookRequest,
} from '../interfaces/payment-provider.interface';

// Shared "not configured" guard so every provider throws the exact same
// ServiceUnavailableException shape — mirrors AiService's precedent when
// AI_API_KEY is unset. Subclasses implement the real per-gateway logic in
// the `do*` methods; this class never lets it run unless isConfigured().
export abstract class BasePaymentProvider implements PaymentProvider {
  abstract readonly name: PaymentProviderName;

  abstract isConfigured(): boolean;
  protected abstract doBuildCheckoutUrl(request: CheckoutRequest): string;
  protected abstract doVerifySignature(request: RawWebhookRequest): boolean;
  protected abstract doParseWebhook(
    request: RawWebhookRequest,
  ): ParsedWebhookEvent;
  protected abstract doBuildSuccessResponse(event: ParsedWebhookEvent): unknown;
  protected abstract doBuildErrorResponse(
    code: string,
    message: string,
    event?: ParsedWebhookEvent,
  ): unknown;

  buildCheckoutUrl(request: CheckoutRequest): string {
    this.assertConfigured();
    return this.doBuildCheckoutUrl(request);
  }

  verifySignature(request: RawWebhookRequest): boolean {
    this.assertConfigured();
    return this.doVerifySignature(request);
  }

  parseWebhook(request: RawWebhookRequest): ParsedWebhookEvent {
    this.assertConfigured();
    return this.doParseWebhook(request);
  }

  buildSuccessResponse(event: ParsedWebhookEvent): unknown {
    this.assertConfigured();
    return this.doBuildSuccessResponse(event);
  }

  buildErrorResponse(
    code: string,
    message: string,
    event?: ParsedWebhookEvent,
  ): unknown {
    this.assertConfigured();
    return this.doBuildErrorResponse(code, message, event);
  }

  protected assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException({
        code: 'PROVIDER_NOT_CONFIGURED',
        message: `${this.name} hozircha sozlanmagan`,
      });
    }
  }
}
