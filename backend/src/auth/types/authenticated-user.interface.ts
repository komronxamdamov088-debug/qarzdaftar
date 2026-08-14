import { Role } from '../../common/decorators/roles.decorator';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
