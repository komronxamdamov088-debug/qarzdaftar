import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TelegramService } from '../telegram/telegram.service';
import {
  VerifiedTelegramInitData,
  verifyTelegramInitData,
} from '../telegram/telegram-init-data';
import { DebtsService } from '../debts/debts.service';
import { JwtPayload } from './types/authenticated-user.interface';

const CLAIM_START_PARAM_RE = /^claim-([0-9a-f-]{36})$/i;

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: string;
    locale: string;
  };
  startParam?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly debtsService: DebtsService,
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

    const { user: tgUser, startParam } = verified;
    const name = [tgUser.first_name, tgUser.last_name]
      .filter(Boolean)
      .join(' ');

    const claimMatch = startParam
      ? CLAIM_START_PARAM_RE.exec(startParam)
      : null;
    const user = claimMatch
      ? await this.debtsService
          .findByToken(claimMatch[1])
          .then((debt) =>
            this.telegramService.linkOrCreateForClaim(
              tgUser.id,
              name,
              tgUser.username,
              debt.borrower_id,
            ),
          )
          .catch(() =>
            this.telegramService.findOrCreateUserByTelegramId(
              tgUser.id,
              name,
              tgUser.username,
            ),
          )
      : await this.telegramService.findOrCreateUserByTelegramId(
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
      startParam,
    };
  }
}
