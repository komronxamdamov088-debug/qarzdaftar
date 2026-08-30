import { Controller, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { SubscriptionPaymentsService } from './subscription-payments.service';

// Same rawBody/no-DTO pattern as PaymentWebhooksController — provider-shaped
// payloads, signature verification needs the exact original bytes.
@Controller('subscription-payments/webhooks')
export class SubscriptionWebhooksController {
  constructor(
    private readonly subscriptionPayments: SubscriptionPaymentsService,
  ) {}

  @Public()
  @Post(':provider')
  handleWebhook(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.subscriptionPayments.handleWebhook(provider, {
      rawBody: req.rawBody ?? Buffer.alloc(0),
      headers: req.headers,
      body: req.body,
    });
  }
}
