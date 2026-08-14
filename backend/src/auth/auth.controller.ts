import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(): never {
    throw new NotImplementedException(
      "Telefon/OTP orqali ro'yxatdan o'tish hali mavjud emas.",
    );
  }

  @Public()
  @Post('login')
  login(): never {
    throw new NotImplementedException(
      'Telefon/OTP orqali kirish hali mavjud emas.',
    );
  }

  @Public()
  @Post('otp')
  verifyOtp(): never {
    throw new NotImplementedException('OTP tasdiqlash hali mavjud emas.');
  }

  @Public()
  @Post('telegram')
  telegramLogin(@Body() dto: TelegramAuthDto) {
    return this.authService.loginWithTelegram(dto.initData);
  }
}
