import { IsISO8601, IsOptional, IsPositive, MaxLength } from 'class-validator';

export class UpdateDebtDto {
  @IsOptional()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @MaxLength(500)
  note?: string;
}
