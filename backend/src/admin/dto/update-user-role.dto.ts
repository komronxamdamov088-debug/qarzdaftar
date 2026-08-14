import { IsIn } from 'class-validator';
import type { Role } from '../../common/decorators/roles.decorator';

export class UpdateUserRoleDto {
  @IsIn(['user', 'admin'] satisfies Role[])
  role: Role;
}
