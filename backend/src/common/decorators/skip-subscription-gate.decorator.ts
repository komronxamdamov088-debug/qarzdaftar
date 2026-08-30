import { SetMetadata } from '@nestjs/common';

export const SKIP_SUBSCRIPTION_GATE_KEY = 'skipSubscriptionGate';

// Marks a route as reachable even by a user SubscriptionGateGuard would
// otherwise block (personal account, or a business account with no active
// subscription) — needed for the handful of endpoints that a blocked user
// must still be able to call in order to become unblocked: registering as a
// business, initiating a subscription checkout, and reading their own
// current state (GET /users/me).
export const SkipSubscriptionGate = () =>
  SetMetadata(SKIP_SUBSCRIPTION_GATE_KEY, true);
