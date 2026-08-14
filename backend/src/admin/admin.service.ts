import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtStatus, ReminderStatus } from '../database/database.types';
import { Role } from '../common/decorators/roles.decorator';
import { AdminStats } from './entities/admin-stats.entity';
import { AdminUserSummary } from './entities/admin-user-summary.entity';
import { AdminReports } from './entities/admin-reports.entity';

const DEBT_STATUSES: DebtStatus[] = [
  'pending',
  'confirmed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
];

const REMINDER_STATUSES: ReminderStatus[] = [
  'pending',
  'sent',
  'failed',
  'cancelled',
];

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS).toISOString();
    const today = now.toISOString().slice(0, 10);

    const [
      totalUsers,
      newUsers,
      totalDebts,
      paidDebts,
      overdueDebts,
      aiReminderUsage,
      pushSubscriptions,
      telegramConnectedUsers,
      activeUsers,
    ] = await Promise.all([
      this.countRows(
        this.supabase.from('users').select('*', { count: 'exact', head: true }),
      ),
      this.countRows(
        this.supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo),
      ),
      this.countRows(
        this.supabase.from('debts').select('*', { count: 'exact', head: true }),
      ),
      this.countRows(
        this.supabase
          .from('debts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'paid'),
      ),
      this.countRows(
        this.supabase
          .from('debts')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', today)
          .not('status', 'in', '(paid,cancelled)'),
      ),
      this.countRows(
        this.supabase
          .from('ai_reminder_logs')
          .select('*', { count: 'exact', head: true }),
      ),
      this.countRows(
        this.supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true }),
      ),
      this.countRows(
        this.supabase
          .from('telegram_connections')
          .select('*', { count: 'exact', head: true }),
      ),
      this.countActiveUsers(thirtyDaysAgo),
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      totalDebts,
      paidDebts,
      overdueDebts,
      aiReminderUsage,
      pushSubscriptions,
      telegramConnectedUsers,
    };
  }

  async listUsers(): Promise<AdminUserSummary[]> {
    const [
      { data: users, error: usersError },
      { data: connections, error: connectionsError },
    ] = await Promise.all([
      this.supabase
        .from('users')
        .select('id, name, phone, role, created_at')
        .order('created_at', { ascending: false }),
      this.supabase.from('telegram_connections').select('user_id'),
    ]);

    if (usersError) {
      throw new InternalServerErrorException(usersError.message);
    }
    if (connectionsError) {
      throw new InternalServerErrorException(connectionsError.message);
    }

    const connectedUserIds = new Set((connections ?? []).map((c) => c.user_id));

    return (users ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      telegramConnected: connectedUserIds.has(user.id),
      createdAt: user.created_at,
    }));
  }

  // Note: role changes take effect on the target user's *next* login — the JWT
  // payload embeds the role at sign time and this app has no session/token
  // revocation mechanism, so an already-issued token keeps the old role.
  async updateUserRole(
    currentAdminId: string,
    targetUserId: string,
    role: Role,
  ): Promise<AdminUserSummary> {
    if (targetUserId === currentAdminId) {
      throw new BadRequestException(
        "O'zingizning rolingizni o'zgartira olmaysiz",
      );
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ role })
      .eq('id', targetUserId)
      .select('id, name, phone, role, created_at')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const { count } = await this.supabase
      .from('telegram_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      role: data.role,
      telegramConnected: (count ?? 0) > 0,
      createdAt: data.created_at,
    };
  }

  async getReports(): Promise<AdminReports> {
    const [
      { data: debts, error: debtsError },
      { data: reminders, error: remindersError },
    ] = await Promise.all([
      this.supabase.from('debts').select('status'),
      this.supabase.from('reminders').select('status'),
    ]);

    if (debtsError) {
      throw new InternalServerErrorException(debtsError.message);
    }
    if (remindersError) {
      throw new InternalServerErrorException(remindersError.message);
    }

    const debtsByStatus = Object.fromEntries(
      DEBT_STATUSES.map((status) => [status, 0]),
    ) as Record<DebtStatus, number>;
    for (const debt of debts ?? []) {
      debtsByStatus[debt.status] += 1;
    }

    const remindersByStatus = Object.fromEntries(
      REMINDER_STATUSES.map((status) => [status, 0]),
    ) as Record<ReminderStatus, number>;
    for (const reminder of reminders ?? []) {
      remindersByStatus[reminder.status] += 1;
    }

    return { debtsByStatus, remindersByStatus };
  }

  private async countRows(
    query: PromiseLike<{
      count: number | null;
      error: { message: string } | null;
    }>,
  ): Promise<number> {
    const { count, error } = await query;
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return count ?? 0;
  }

  // "Active" is approximated as: user is party to a debt updated in the last
  // N days. There's no login/last-seen tracking in the schema (see CLAUDE.md
  // section 28), so this is the least-invasive honest proxy available today.
  private async countActiveUsers(since: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('debts')
      .select('lender_id, borrower_id')
      .gte('updated_at', since);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const activeUserIds = new Set<string>();
    for (const row of data ?? []) {
      activeUserIds.add(row.lender_id);
      activeUserIds.add(row.borrower_id);
    }
    return activeUserIds.size;
  }
}
