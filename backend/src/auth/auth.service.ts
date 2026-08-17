import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TelegramService } from '../telegram/telegram.service';
import {
  VerifiedTelegramInitData,
  verifyTelegramInitData,
} from '../telegram/telegram-init-data';
import { JwtPayload } from './types/authenticated-user.interface';

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: string;
    locale: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async loginWithTelegram(initData: string): Promise<AuthResult> {
    const botToken = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');

    let verified: VerifiedTelegramInitData;
    try {
      verified = verifyTelegramInitData(initData, botToken);
    } catch {
      throw new UnauthorizedException(
        'Telegram autentifikatsiyasi muvaffaqiyatsiz tugadi',
      );
    }

    const { user: tgUser } = verified;
    const name = [tgUser.first_name, tgUser.last_name]
      .filter(Boolean)
      .join(' ');

    const user = await this.telegramService.findOrCreateUserByTelegramId(
      tgUser.id,
      name,
      tgUser.username,
    );

    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        locale: user.locale,
      },
    };
  }
}
