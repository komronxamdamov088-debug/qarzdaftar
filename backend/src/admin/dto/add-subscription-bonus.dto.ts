import { IsInt, Min } from 'class-validator';

export class AddSubscriptionBonusDto {
  @IsInt()
  @Min(1)
  days: number;
}
