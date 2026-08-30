import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_SUBSCRIPTION_GATE_KEY } from '../decorators/skip-subscription-gate.decorator';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.interface';

// The Mini App is now shop-only: a `role: 'user'` account may use every
// authenticated route only if it's a business account with an active
// subscription, OR an admin has explicitly exempted it via access_override
// (the mechanism used to keep pre-existing personal accounts working — see
// migration 0015). Runs after JwtAuthGuard (so request.user is populated)
// and after RolesGuard. Split out from JwtStrategy specifically so routes a
// blocked user must still reach — self-serve business registration,
// subscription checkout, GET /users/me — can opt out via
// @SkipSubscriptionGate(), which a Passport strategy can't do per-route.
@Injectable()
export class SubscriptionGateGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_GATE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user || user.role === 'admin' || user.accessOverride) {
      return true;
    }

    if (user.accountType !== 'business') {
      throw new ForbiddenException({
        code: 'ACCESS_RESTRICTED',
        message: "Bu ilova hozircha faqat obunasi faol do'konlar uchun mavjud.",
      });
    }

    if (!user.subscriptionActive) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_INACTIVE',
        message:
          "Obuna faol emas. Obunani yangilang yoki administrator bilan bog'laning.",
      });
    }

    return true;
  }
}
