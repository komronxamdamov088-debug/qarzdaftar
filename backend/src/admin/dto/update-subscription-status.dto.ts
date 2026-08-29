import { IsBoolean } from 'class-validator';

export class UpdateSubscriptionStatusDto {
  @IsBoolean()
  active: boolean;
}
