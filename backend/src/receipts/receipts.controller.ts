import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { ReceiptsService } from './receipts.service';

@Controller()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('debts/:debtId/receipts')
  findAllForDebt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
  ) {
    return this.receiptsService.findAllForDebt(user.id, debtId);
  }

  @Get('receipts/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.receiptsService.findOneForUser(user.id, id);
  }

  // Returning a raw Buffer here would silently break: Nest's Express adapter
  // calls `response.json()` for any object return value (Buffer included),
  // which JSON-serializes the bytes as `{"type":"Buffer","data":[...]}`
  // instead of sending them raw — the client never gets a real PDF no
  // matter what Content-Type header is set. StreamableFile is Nest's
  // documented escape hatch: it takes the reply() branch that pipes the
  // bytes through untouched.
  @Get('receipts/:id/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const receipt = await this.receiptsService.findOneForUser(user.id, id);
    const pdf = await this.receiptsService.generatePdf(receipt);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${receipt.receipt_number}.pdf"`,
    });
  }
}
