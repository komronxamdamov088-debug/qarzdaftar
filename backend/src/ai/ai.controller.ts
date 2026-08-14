import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { DebtsService } from '../debts/debts.service';
import { AiService } from './ai.service';
import { GenerateAiReminderDto } from './dto/generate-ai-reminder.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly debtsService: DebtsService,
  ) {}

  @Post('reminder')
  async generateReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateAiReminderDto,
  ): Promise<{ message: string }> {
    const debt = await this.debtsService.findOneForUser(user.id, dto.debtId);
    const message = await this.aiService.generateReminder(
      debt,
      user.id,
      dto.tone,
    );
    return { message };
  }
}
