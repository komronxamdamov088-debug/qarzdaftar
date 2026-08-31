import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  // Telegram login always find-or-creates by telegram_id only (see CLAUDE.md section 25 — phone-linking needs OTP, which isn't built yet).
  // Every single Mini App open re-runs this (see frontend HomeGate — there's
  // no "already have a session" skip), so the returning-user path is the
  // hottest query in the whole app; it's a single embedded-join select
  // (telegram_connections -> users) instead of two sequential round trips.
  async findOrCreateUserByTelegramId(
    telegramId: number,
    name: string,
    username?: string,
  ): Promise<User> {
    const { data: existingConnection, error: lookupError } = await this.supabase
      .from('telegram_connections')
      .select('user:users(*)')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (lookupError) {
      throw new InternalServerErrorException(lookupError.message);
    }

    if (existingConnection?.user) {
      return existingConnection.user as unknown as User;
    }

    const { data: createdUser, error: insertUserError } = await this.supabase
      .from('users')
      .insert({ name })
      .select('*')
      .single();

    if (insertUserError) {
      throw new InternalServerErrorException(insertUserError.message);
    }

    const { error: insertConnectionError } = await this.supabase
      .from('telegram_connections')
      .insert({
        user_id: createdUser.id,
        telegram_id: telegramId,
        username: username ?? null,
      });

    if (insertConnectionError) {
      throw new InternalServerErrorException(insertConnectionError.message);
    }

    return createdUser;
  }

  // Links a customer's real Telegram identity to their existing placeholder
  // user row (created by a shop via UsersService.findOrCreateCounterparty
  // when they added a debt) instead of always spawning a new, disconnected
  // user the way findOrCreateUserByTelegramId does. Reached only via a
  // t.me/<bot>?startapp=claim-<confirmation_token> deep link the shop shares
  // with that specific customer — see AuthService.loginWithTelegram.
  async linkOrCreateForClaim(
    telegramId: number,
    name: string,
    username: string | undefined,
    borrowerId: string,
  ): Promise<User> {
    const { data: existingConnection, error: lookupError } = await this.supabase
      .from('telegram_connections')
      .select('user:users(*)')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (lookupError) {
      throw new InternalServerErrorException(lookupError.message);
    }
    if (existingConnection?.user) {
      // This Telegram account is already a known QarzDaftar user — log them
      // into their own existing account rather than claiming on top of it.
      return existingConnection.user as unknown as User;
    }

    const { data: borrowerConnection, error: borrowerLookupError } =
      await this.supabase
        .from('telegram_connections')
        .select('user_id')
        .eq('user_id', borrowerId)
        .maybeSingle();

    if (borrowerLookupError) {
      throw new InternalServerErrorException(borrowerLookupError.message);
    }
    if (borrowerConnection) {
      // The placeholder was already claimed (e.g. the link was re-tapped by
      // someone else) — never steal an existing claim. Fall back to an
      // ordinary login for whoever is tapping the link now.
      return this.findOrCreateUserByTelegramId(telegramId, name, username);
    }

    const { error: insertConnectionError } = await this.supabase
      .from('telegram_connections')
      .insert({
        user_id: borrowerId,
        telegram_id: telegramId,
        username: username ?? null,
      });

    if (insertConnectionError) {
      // e.g. a concurrent claim raced us on the telegram_id unique
      // constraint — claiming must never break login, so fall back.
      this.logger.warn(
        `Claim link failed for borrower ${borrowerId}: ${insertConnectionError.message}`,
      );
      return this.findOrCreateUserByTelegramId(telegramId, name, username);
    }

    const { data: linkedUser, error: updateError } = await this.supabase
      .from('users')
      .update({ telegram_enabled: true })
      .eq('id', borrowerId)
      .select('*')
      .single();

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }
    return linkedUser;
  }

  async findTelegramIdForUser(userId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('telegram_connections')
      .select('telegram_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data?.telegram_id ?? null;
  }

  async sendMessage(telegramId: number, text: string): Promise<boolean> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not configured — Telegram notifications are disabled.',
      );
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `Telegram sendMessage failed (${response.status}): ${body}`,
      );
      return false;
    }

    return true;
  }
}
