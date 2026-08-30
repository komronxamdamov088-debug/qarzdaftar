import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';

// Closes the loop on "buy a 1 or 2 month plan": without this, a single
// payment would grant permanent access, since nothing else ever turns
// subscription_active back off. Runs once a day and only ever touches
// subscription_active — access_override (manual admin exemptions) and admin-
// granted unlimited access (no subscription_valid_until set) are both
// naturally unaffected, since the `.lt(...)` filter below only ever matches
// business accounts with a real, already-past valid-until date.
@Injectable()
export class SubscriptionExpiryService {
  private readonly logger = new Logger(SubscriptionExpiryService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deactivateExpiredSubscriptions(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('users')
      .update({ subscription_active: false })
      .eq('account_type', 'business')
      .eq('subscription_active', true)
      .lt('subscription_valid_until', today)
      .select('id');

    if (error) {
      this.logger.error(
        `Failed to deactivate expired subscriptions: ${error.message}`,
      );
      return;
    }
    if (data && data.length > 0) {
      this.logger.log(`Deactivated ${data.length} expired subscription(s).`);
    }
  }
}
