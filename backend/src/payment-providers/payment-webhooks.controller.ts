import { Controller, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PaymentTransactionsService } from './payment-transactions.service';

// Deliberately reads req.rawBody/headers only (no @Body() DTO) — these are
// provider-shaped payloads (Click form-encoded, Payme JSON-RPC, Yagona Pay
// JSON), not our own DTOs, so the global ValidationPipe never applies here.
// Signature verification needs the exact original bytes (req.rawBody, from
// main.ts's `rawBody: true`), which a parsed-then-restringified body can't
// guarantee.
@Controller('payments/webhooks')
export class PaymentWebhooksController {
  constructor(
    private readonly transactionsService: PaymentTransactionsService,
  ) {}

  @Public()
  @Post(':provider')
  handleWebhook(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.transactionsService.handleWebhook(provider, {
      rawBody: req.rawBody ?? Buffer.alloc(0),
      headers: req.headers,
      body: req.body,
    });
  }
}
