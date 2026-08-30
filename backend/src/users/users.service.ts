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
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import {
  SUBSCRIPTION_PLAN_PRICES,
  subscriptionPlanDiscountPercent,
} from '../common/subscription-plans';

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

  // Telegram login never collects a phone number on its own — this lets a
  // business account share one explicitly (e.g. via Telegram's own
  // requestContact() prompt on the frontend) so the admin can see it in
  // /admin/users without needing a separate outreach channel.
  async updatePhone(userId: string, dto: UpdatePhoneDto): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ phone: dto.phone })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  // Self-serve: the Mini App is shop-only (see SubscriptionGateGuard), so a
  // newly-logged-in personal account registers itself as a shop and picks a
  // plan here, at the point where it's still blocked from every other route
  // (this endpoint is @SkipSubscriptionGate()'d). Always explicitly forces
  // subscription_active to false — access is only ever granted by a
  // verified payment webhook (SubscriptionPaymentsService) or an admin
  // action, never by self-registration alone. This must be explicit rather
  // than "just never touch it": subscription_active defaults to true at the
  // database level (users.subscription_active default true, migration
  // 0013) — that default only ever mattered for personal accounts, where
  // the gate ignores it entirely, so a freshly-registered business account
  // would otherwise inherit that default and be granted access without ever
  // paying (caught live while testing this exact endpoint). Safe to call
  // again on an already-business-but-unpaid account (e.g. switching plans
  // before paying) — this endpoint is only ever reachable by a still-
  // blocked user in the first place (see SubscriptionGate on the frontend),
  // so forcing false here can never interrupt an already-active shop.
  async registerBusiness(
    userId: string,
    dto: RegisterBusinessDto,
  ): Promise<User> {
    const price = SUBSCRIPTION_PLAN_PRICES[dto.planMonths];
    const discountPercent = subscriptionPlanDiscountPercent(dto.planMonths);

    const { data, error } = await this.supabase
      .from('users')
      .update({
        account_type: 'business',
        business_name: dto.businessName,
        subscription_plan_months: dto.planMonths,
        subscription_price: price,
        subscription_discount_percent: discountPercent,
        subscription_active: false,
        ...(dto.phone !== undefined && { phone: dto.phone }),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
