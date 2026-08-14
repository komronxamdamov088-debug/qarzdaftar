import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Controller('debts/:debtId/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
  ) {
    return this.remindersService.findAllForDebt(user.id, debtId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('debtId') debtId: string,
    @Body() dto: CreateReminderDto,
  ) {
    return this.remindersService.create(user.id, debtId, dto);
  }
}
