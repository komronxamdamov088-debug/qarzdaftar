import { Controller, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { DebtsService } from '../debts/debts.service';
import { PaymentTransactionsService } from './payment-transactions.service';

// Public checkout-initiation path for the debt-share/confirmation link.
// Deliberately calls DebtsService.findByToken (which has no
// confirmation_status gate) rather than the one-shot confirmByToken, so
// paying is independent of whether the debt has been confirmed/rejected yet.
@Controller('debts/confirm/:token/checkout')
export class PublicPaymentCheckoutController {
  constructor(
    private readonly transactionsService: PaymentTransactionsService,
    private readonly debtsService: DebtsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post(':provider')
  async checkout(
    @Param('token') token: string,
    @Param('provider') provider: string,
  ) {
    const debt = await this.debtsService.findByToken(token);
    // See payment-checkout.controller.ts: `?payment=pending` is a UI hint
    // only, never the source of truth for whether the payment succeeded.
    const returnUrl = `${this.frontendUrl()}/confirm/${token}?payment=pending`;
    return this.transactionsService.initiateCheckout(
      debt,
      provider,
      debt.borrower_id,
      returnUrl,
    );
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? '';
  }
}
