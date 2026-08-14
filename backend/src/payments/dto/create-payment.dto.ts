import { IsOptional, IsPositive, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsPositive()
  amount!: number;

  @IsOptional()
  @MaxLength(500)
  note?: string;
}
