import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ConvertToBusinessDto } from './dto/convert-to-business.dto';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';
import { UpdateSubscriptionPricingDto } from './dto/update-subscription-pricing.dto';
import { AddSubscriptionBonusDto } from './dto/add-subscription-bonus.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

// RolesGuard is registered globally (see app.module.ts) and reads this
// class-level @Roles('admin'), so every route below requires role='admin' —
// CLAUDE.md section 8/32: never rely on a frontend-only role check.
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(admin.id, id, dto.role);
  }

  @Patch('users/:id/business')
  convertToBusiness(
    @Param('id') id: string,
    @Body() dto: ConvertToBusinessDto,
  ) {
    return this.adminService.convertToBusiness(id, dto.businessName);
  }

  @Patch('users/:id/personal')
  revertToPersonal(@Param('id') id: string) {
    return this.adminService.revertToPersonal(id);
  }

  @Patch('users/:id/subscription')
  updateSubscriptionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionStatusDto,
  ) {
    return this.adminService.updateSubscriptionStatus(id, dto.active);
  }

  @Patch('users/:id/subscription-pricing')
  updateSubscriptionPricing(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPricingDto,
  ) {
    return this.adminService.updateSubscriptionPricing(id, dto);
  }

  @Post('users/:id/subscription-bonus')
  addSubscriptionBonus(
    @Param('id') id: string,
    @Body() dto: AddSubscriptionBonusDto,
  ) {
    return this.adminService.addSubscriptionBonusDays(id, dto.days);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }
}
