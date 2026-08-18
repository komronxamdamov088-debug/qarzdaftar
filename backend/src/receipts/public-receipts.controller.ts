import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ReceiptsService } from './receipts.service';

// Public path: same trust boundary as DebtConfirmationController — a valid
// confirmation_token authorizes viewing receipts for that debt, no account
// required (the counterparty may not even have a QarzDaftar account yet).
@Controller('debts/confirm/:token/receipts')
export class PublicReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Public()
  @Get()
  findAll(@Param('token') token: string) {
    return this.receiptsService.findAllByToken(token);
  }

  @Public()
  @Get(':id')
  findOne(@Param('token') token: string, @Param('id') id: string) {
    return this.receiptsService.findOneByToken(token, id);
  }

  // See receipts.controller.ts's downloadPdf for why this must be a
  // StreamableFile and not a raw Buffer.
  @Public()
  @Get(':id/pdf')
  async downloadPdf(
    @Param('token') token: string,
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const receipt = await this.receiptsService.findOneByToken(token, id);
    const pdf = await this.receiptsService.generatePdf(receipt);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${receipt.receipt_number}.pdf"`,
    });
  }
}
