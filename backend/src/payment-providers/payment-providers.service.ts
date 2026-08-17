import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProviderName } from '../database/database.types';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { QulayPayProvider } from './providers/qulay-pay.provider';

const VALID_PROVIDER_NAMES: PaymentProviderName[] = [
  'click',
  'payme',
  'qulay_pay',
];

@Injectable()
export class PaymentProvidersService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(
    click: ClickProvider,
    payme: PaymeProvider,
    qulayPay: QulayPayProvider,
  ) {
    this.providers = { click, payme, qulay_pay: qulayPay };
  }

  // Accepts kebab-case route params too ("qulay-pay") and normalizes them to
  // the snake_case value stored in the database/enum ("qulay_pay").
  getProvider(name: string): PaymentProvider {
    const normalized = name.replace(/-/g, '_');
    if (!this.isValidProviderName(normalized)) {
      throw new NotFoundException({
        code: 'PROVIDER_NOT_FOUND',
        message: "To'lov usuli topilmadi",
      });
    }
    return this.providers[normalized];
  }

  private isValidProviderName(name: string): name is PaymentProviderName {
    return (VALID_PROVIDER_NAMES as string[]).includes(name);
  }
}
