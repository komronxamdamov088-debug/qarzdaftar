import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProviderName } from '../database/database.types';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { YagonaPayProvider } from './providers/yagona-pay.provider';

const VALID_PROVIDER_NAMES: PaymentProviderName[] = [
  'click',
  'payme',
  'yagona_pay',
];

@Injectable()
export class PaymentProvidersService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(
    click: ClickProvider,
    payme: PaymeProvider,
    yagonaPay: YagonaPayProvider,
  ) {
    this.providers = { click, payme, yagona_pay: yagonaPay };
  }

  // Accepts kebab-case route params too ("yagona-pay") and normalizes them
  // to the snake_case value stored in the database/enum ("yagona_pay").
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
