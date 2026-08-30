import { Role } from '../../common/decorators/roles.decorator';
import { AccountType } from '../../database/database.types';
import { User } from '../../users/entities/user.entity';

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
  // The complete row JwtStrategy already fetched to compute the fields
  // above. Carried through so GET /users/me can return it directly instead
  // of running a second, identical "select the current user by id" query
  // right after JwtStrategy just ran one.
  raw: User;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
