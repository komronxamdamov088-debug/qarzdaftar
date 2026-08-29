import { IsString, Matches } from 'class-validator';

export class UpdatePhoneDto {
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: "Telefon raqami noto'g'ri formatda",
  })
  phone: string;
}
