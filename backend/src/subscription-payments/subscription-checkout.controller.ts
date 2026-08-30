import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGate } from '../common/decorators/skip-subscription-gate.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { SubscriptionPaymentsService } from './subscription-payments.service';

// A user who isn't unlocked yet is exactly who needs to reach this route —
// hence @SkipSubscriptionGate() on the one endpoint that lets them pay.
@Controller('subscription-payments')
export class SubscriptionCheckoutController {
  constructor(
    private readonly subscriptionPayments: SubscriptionPaymentsService,
    private readonly config: ConfigService,
  ) {}

  @SkipSubscriptionGate()
  @Post(':provider/checkout')
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('provider') provider: string,
  ) {
    // The subscribe/register screen is rendered inline by every protected
    // page's layout while a user is blocked (see frontend
    // app/(app)/layout.tsx) — there's no dedicated route to redirect back
    // to, so this just lands on the dashboard, which will keep showing the
    // same gate screen until a verified webhook actually activates access.
    const returnUrl = `${this.frontendUrl()}/dashboard?payment=pending`;
    return this.subscriptionPayments.initiateCheckout(
      user.id,
      provider,
      returnUrl,
    );
  }

  @SkipSubscriptionGate()
  @HttpCode(200)
  @Post('cash-request')
  requestCashPayment(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionPayments
      .requestCashPayment(user.id)
      .then(() => ({ ok: true }));
  }

  // No per-user sensitivity — the same instructions are shown to every
  // blocked shop, so this is @Public() rather than merely gate-exempt (the
  // subscription-gate screen needs it before a user's own token is even
  // relevant). Returns null (never a fake/empty-string address) when unset,
  // so the frontend can hide this section entirely rather than show a blank
  // "pay here" box.
  @Public()
  @Get('payment-info')
  getPaymentInfo() {
    return {
      instructions:
        this.config.get<string>('OWNER_PAYMENT_INSTRUCTIONS') || null,
    };
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? '';
  }
}
