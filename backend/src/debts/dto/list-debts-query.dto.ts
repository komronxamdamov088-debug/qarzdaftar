import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListDebtsQueryDto {
  @IsOptional()
  @IsIn(['given', 'taken'])
  direction?: 'given' | 'taken';

  @IsOptional()
  @IsIn(['unpaid', 'paid', 'overdue'])
  state?: 'unpaid' | 'paid' | 'overdue';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'amount', 'due_date'])
  sort?: 'newest' | 'oldest' | 'amount' | 'due_date';
}
