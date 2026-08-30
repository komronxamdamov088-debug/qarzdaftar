import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipSubscriptionGate } from '../common/decorators/skip-subscription-gate.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { UsersService } from './users.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // A blocked user (no business account / inactive subscription) must still
  // be able to read their own state to know what to do next — see
  // frontend app/(app)/layout.tsx, which branches purely on this response.
  // Returns the row JwtStrategy already fetched (user.raw) instead of
  // querying for the same user a second time.
  @SkipSubscriptionGate()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user.raw;
  }

  // Self-serve shop registration — see UsersService.registerBusiness for why
  // this alone never grants access.
  @SkipSubscriptionGate()
  @Patch('me/business')
  registerBusiness(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterBusinessDto,
  ) {
    return this.usersService.registerBusiness(user.id, dto);
  }

  @Patch('me/notifications')
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, dto);
  }

  @Patch('me/locale')
  updateLocale(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLocaleDto,
  ) {
    return this.usersService.updateLocale(user.id, dto);
  }

  @Patch('me/phone')
  updatePhone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePhoneDto,
  ) {
    return this.usersService.updatePhone(user.id, dto);
  }
}
