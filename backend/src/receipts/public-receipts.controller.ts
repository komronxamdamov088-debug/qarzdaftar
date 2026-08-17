import { Controller, Get, Header, Param } from '@nestjs/common';
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

  @Public()
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('token') token: string,
    @Param('id') id: string,
  ): Promise<Buffer> {
    const receipt = await this.receiptsService.findOneByToken(token, id);
    const pdf = await this.receiptsService.generatePdf(receipt);
    return Buffer.from(pdf);
  }
}
