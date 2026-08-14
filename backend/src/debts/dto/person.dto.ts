import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PersonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: "phone noto'g'ri formatda" })
  phone?: string;
}
