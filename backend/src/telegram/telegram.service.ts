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
