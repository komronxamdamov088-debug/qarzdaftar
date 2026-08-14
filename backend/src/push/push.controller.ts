import { Body, Controller, Delete, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { PushService } from './push.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribePushDto,
  ) {
    return this.pushService.subscribe(user.id, dto);
  }

  @Delete('subscribe')
  unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnsubscribePushDto,
  ) {
    return this.pushService.unsubscribe(user.id, dto.endpoint);
  }
}
