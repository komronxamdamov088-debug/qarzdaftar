import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSubscriptionPricingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
