import { IsBoolean } from 'class-validator';

export class UpdateAccessOverrideDto {
  @IsBoolean()
  override: boolean;
}
