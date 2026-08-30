import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { SubscriptionPlanMonths } from '../../database/database.types';

export class RegisterBusinessDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  businessName: string;

  @IsIn([1, 2])
  planMonths: SubscriptionPlanMonths;

  // Telegram login never collects a phone number on its own (same gap
  // UpdatePhoneDto/updatePhone already work around on the profile page) —
  // collected here too so a shop's phone is visible to the admin
  // (GET /admin/users) from the moment they register, before they've ever
  // been unblocked long enough to reach /profile.
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: "Telefon raqami noto'g'ri formatda" })
  phone?: string;
}
