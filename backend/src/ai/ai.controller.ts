import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
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
    // AI reminder was designed for personal debt reminders between
    // individuals — shop accounts don't get it (owner's decision). Enforced
    // here, not just hidden in the UI, matching this codebase's rule that
    // the backend is the real authority, not a client-side check.
    if (user.accountType === 'business') {
      throw new ForbiddenException({
        code: 'AI_NOT_AVAILABLE_FOR_BUSINESS',
        message: "AI eslatma do'kon hisoblari uchun mavjud emas",
      });
    }

    const debt = await this.debtsService.findOneForUser(user.id, dto.debtId);
    const message = await this.aiService.generateReminder(
      debt,
      user.id,
      dto.tone,
    );
    return { message };
  }
}
