import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SUPABASE_CLIENT } from '../../database/supabase.provider';
import type { SupabaseClient } from '../../database/supabase.provider';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../types/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Looks the user up fresh on every request (rather than trusting the JWT
  // payload alone) so a business account's access can be cut off immediately
  // when an admin deactivates its subscription — the JWT itself is valid for
  // 7 days and has no revocation mechanism, so this is the only place that
  // can enforce "blocked right now" instead of "blocked on next login".
  // Admin-role accounts are never gated by this check, so an admin can never
  // accidentally lock themselves out by marking their own account business.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, role, account_type, subscription_active')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error || !data) {
      throw new UnauthorizedException();
    }

    if (
      data.role === 'user' &&
      data.account_type === 'business' &&
      !data.subscription_active
    ) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_INACTIVE',
        message: "Obuna faol emas. Administrator bilan bog'laning.",
      });
    }

    return { id: data.id, role: data.role };
  }
}
