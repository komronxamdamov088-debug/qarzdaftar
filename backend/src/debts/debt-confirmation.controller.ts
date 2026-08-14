import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { DebtsService } from './debts.service';
import { ConfirmDebtDto } from './dto/confirm-debt.dto';
import { toPublicDebtView } from './entities/debt.entity';

@Controller('debts/confirm')
export class DebtConfirmationController {
  constructor(private readonly debtsService: DebtsService) {}

  @Public()
  @Get(':token')
  async findByToken(@Param('token') token: string) {
    const debt = await this.debtsService.findByToken(token);
    return toPublicDebtView(debt);
  }

  @Public()
  @Post(':token')
  async confirm(@Param('token') token: string, @Body() dto: ConfirmDebtDto) {
    const debt = await this.debtsService.confirmByToken(token, dto.action);
    return toPublicDebtView(debt);
  }
}
