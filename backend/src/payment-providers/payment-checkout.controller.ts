import { Controller, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { DebtsService } from '../debts/debts.service';
import { PaymentTransactionsService } from './payment-transactions.service';

// Authenticated checkout-initiation path — ownership-checked via the same
// DebtsService.findOneForUser() every other authenticated debt route uses.
// Lives in payment-providers/ (not payments/) because PaymentTransactions
// Service depends on PaymentsService (to apply a verified webhook via
// record_payment) — putting checkout-initiation on PaymentsController would
// create a module import cycle (payments -> payment-providers -> payments).
@Controller('debts/:debtId/payments')
export class PaymentCheckoutController {
  constructor(
    private readonly transactionsService: PaymentTransactionsService,
    private readonly debtsService: DebtsService,
    private readonly config: ConfigService,
  ) {}

  @Post(':provider/checkout')
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
    @Param('provider') provider: string,
  ) {
    const debt = await this.debtsService.findOneForUser(user.id, debtId);
    const returnUrl = `${this.frontendUrl()}/debts/${debt.id}`;
    return this.transactionsService.initiateCheckout(
      debt,
      provider,
      user.id,
      returnUrl,
    );
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? '';
  }
}
