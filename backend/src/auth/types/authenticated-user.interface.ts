import { Role } from '../../common/decorators/roles.decorator';
import { AccountType } from '../../database/database.types';

// accountType/subscriptionActive/accessOverride are fetched fresh from the
// database on every request by JwtStrategy (see its own comment) and carried
// here so SubscriptionGateGuard doesn't need a second database round-trip to
// decide whether this request is allowed through.
export interface AuthenticatedUser {
  id: string;
  role: Role;
  accountType: AccountType;
  subscriptionActive: boolean;
  accessOverride: boolean;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
