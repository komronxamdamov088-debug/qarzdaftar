import { createHmac, timingSafeEqual } from 'crypto';

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface VerifiedTelegramInitData {
  user: TelegramWebAppUser;
  authDate: number;
  startParam?: string;
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

// Official verification algorithm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
): VerifiedTelegramInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('MISSING_HASH');
  }
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const computedHashBuffer = Buffer.from(computedHash, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (
    computedHashBuffer.length !== hashBuffer.length ||
    !timingSafeEqual(computedHashBuffer, hashBuffer)
  ) {
    throw new Error('INVALID_HASH');
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new Error('EXPIRED');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('MISSING_USER');
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new Error('INVALID_USER_PAYLOAD');
  }

  const startParam = params.get('start_param') ?? undefined;

  return { user, authDate, startParam };
}
