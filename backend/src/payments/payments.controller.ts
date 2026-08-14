import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('debts/:debtId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
  ) {
    return this.paymentsService.findAllForDebt(user.id, debtId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(user.id, debtId, dto);
  }
}
