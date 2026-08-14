import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { UserStats } from './entities/user-stats.entity';

@Injectable()
export class StatsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getStatsForUser(userId: string): Promise<UserStats> {
    const { data, error } = await this.supabase
      .from('debts')
      .select(
        'amount, remaining_amount, due_date, status, lender_id, borrower_id',
      )
      .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const today = new Date().toISOString().slice(0, 10);
    const stats: UserStats = {
      totalGiven: 0,
      totalTaken: 0,
      totalRepaid: 0,
      totalRemaining: 0,
      totalOverdue: 0,
    };

    for (const debt of data ?? []) {
      const amount = Number(debt.amount);
      const remaining = Number(debt.remaining_amount);

      if (debt.lender_id === userId) {
        stats.totalGiven += amount;
      } else {
        stats.totalTaken += amount;
      }

      stats.totalRepaid += amount - remaining;
      stats.totalRemaining += remaining;

      const isOverdue =
        !!debt.due_date &&
        debt.due_date < today &&
        debt.status !== 'paid' &&
        debt.status !== 'cancelled';
      if (isOverdue) {
        stats.totalOverdue += remaining;
      }
    }

    return stats;
  }
}
