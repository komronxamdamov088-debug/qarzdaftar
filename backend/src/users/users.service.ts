import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { User } from './entities/user.entity';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findById(id: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return data;
  }

  // Debts require a real borrower/lender id, so an unregistered counterparty gets a placeholder user row they can later claim via the confirmation link.
  async findOrCreateCounterparty(name: string, phone?: string): Promise<User> {
    if (phone) {
      const { data: existing, error: lookupError } = await this.supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (lookupError) {
        throw new InternalServerErrorException(lookupError.message);
      }
      if (existing) {
        return existing;
      }
    }

    const { data: created, error: insertError } = await this.supabase
      .from('users')
      .insert({ name, phone: phone ?? null })
      .select('*')
      .single();

    if (insertError) {
      throw new InternalServerErrorException(insertError.message);
    }
    return created;
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...(dto.pushEnabled !== undefined && { push_enabled: dto.pushEnabled }),
        ...(dto.telegramEnabled !== undefined && {
          telegram_enabled: dto.telegramEnabled,
        }),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async updateLocale(userId: string, dto: UpdateLocaleDto): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ locale: dto.locale })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
