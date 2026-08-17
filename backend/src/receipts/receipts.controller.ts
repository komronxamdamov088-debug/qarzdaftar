import { Controller, Get, Header, Param } from '@nestjs/common';
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

  @Get('receipts/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Buffer> {
    const receipt = await this.receiptsService.findOneForUser(user.id, id);
    const pdf = await this.receiptsService.generatePdf(receipt);
    return Buffer.from(pdf);
  }
}
