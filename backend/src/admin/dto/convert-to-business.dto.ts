import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConvertToBusinessDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  businessName: string;
}
