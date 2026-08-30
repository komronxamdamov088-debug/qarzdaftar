import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
  // when an admin deactivates its subscription, or granted immediately via
  // access_override — the JWT itself is valid for 7 days and has no
  // revocation mechanism, so this is the only place that can enforce
  // "blocked/allowed right now" instead of "on next login". The actual
  // allow/deny decision has moved to SubscriptionGateGuard (see
  // common/guards/subscription-gate.guard.ts) so specific routes — most
  // importantly the self-serve registration/checkout endpoints a blocked
  // user must still be able to reach — can opt out via
  // @SkipSubscriptionGate(); a Passport strategy has no per-route escape
  // hatch, so the gate can't live here anymore.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, role, account_type, subscription_active, access_override')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error || !data) {
      throw new UnauthorizedException();
    }

    return {
      id: data.id,
      role: data.role,
      accountType: data.account_type,
      subscriptionActive: data.subscription_active,
      accessOverride: data.access_override,
    };
  }
}
