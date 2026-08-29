import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AccountType } from '../../database/database.types';

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(['personal', 'business'] satisfies AccountType[])
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
