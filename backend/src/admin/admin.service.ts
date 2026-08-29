import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import {
  AccountType,
  DebtStatus,
  ReminderStatus,
  UserRole,
} from '../database/database.types';
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

  // Defaults to business accounts only — the admin's day-to-day use of this
  // list is monitoring shops, not scrolling through every personal debt user
  // (of which there can be many). `search` (by name/phone) drops the
  // accountType filter so a personal account can still be found and
  // converted via the "do'konga aylantirish" action.
  async listUsers(filter?: {
    accountType?: AccountType;
    search?: string;
  }): Promise<AdminUserSummary[]> {
    let query = this.supabase
      .from('users')
      .select(
        'id, name, phone, role, account_type, business_name, subscription_active, created_at',
      )
      .order('created_at', { ascending: false });

    const search = filter?.search?.trim().replace(/[,()%]/g, '');
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    } else if (filter?.accountType) {
      query = query.eq('account_type', filter.accountType);
    }

    const [
      { data: users, error: usersError },
      { data: connections, error: connectionsError },
    ] = await Promise.all([
      query,
      this.supabase.from('telegram_connections').select('user_id, username'),
    ]);

    if (usersError) {
      throw new InternalServerErrorException(usersError.message);
    }
    if (connectionsError) {
      throw new InternalServerErrorException(connectionsError.message);
    }

    const usernameByUserId = new Map(
      (connections ?? []).map((c) => [c.user_id, c.username]),
    );

    return (users ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      telegramConnected: usernameByUserId.has(user.id),
      telegramUsername: usernameByUserId.get(user.id) ?? null,
      createdAt: user.created_at,
      accountType: user.account_type,
      businessName: user.business_name,
      subscriptionActive: user.subscription_active,
    }));
  }

  // Role changes now take effect immediately, not just on the target's next
  // login: JwtStrategy re-reads role fresh from the database on every
  // authenticated request rather than trusting the JWT payload alone (added
  // together with the business-subscription gate below, which needs the same
  // live lookup to cut off access immediately).
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
      .select(
        'id, name, phone, role, account_type, business_name, subscription_active, created_at',
      )
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // A business account is always an existing regular user account the admin
  // manually flags after onboarding a shop outside the app — there is no
  // self-serve way to become a business, matching how the very first admin
  // account must also be created by hand (see CLAUDE.md section 9's
  // bootstrap note). Activating always turns the subscription on: this is
  // the "I went and set it up for them" action described by the product
  // owner, not a no-op rename.
  async convertToBusiness(
    targetUserId: string,
    businessName: string,
  ): Promise<AdminUserSummary> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        account_type: 'business',
        business_name: businessName,
        subscription_active: true,
      })
      .eq('id', targetUserId)
      .select(
        'id, name, phone, role, account_type, business_name, subscription_active, created_at',
      )
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // Flips subscription_active only — see JwtStrategy for how a deactivated
  // business account is immediately locked out of every authenticated route,
  // not just on its next login.
  async updateSubscriptionStatus(
    targetUserId: string,
    active: boolean,
  ): Promise<AdminUserSummary> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('users')
      .select('account_type')
      .eq('id', targetUserId)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(fetchError.message);
    }
    if (!existing) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    if (existing.account_type !== 'business') {
      throw new BadRequestException(
        "Obuna holatini faqat do'kon hisoblari uchun o'zgartirish mumkin",
      );
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ subscription_active: active })
      .eq('id', targetUserId)
      .select(
        'id, name, phone, role, account_type, business_name, subscription_active, created_at',
      )
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
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

  private async toUserSummary(user: {
    id: string;
    name: string;
    phone: string | null;
    role: UserRole;
    account_type: AccountType;
    business_name: string | null;
    subscription_active: boolean;
    created_at: string;
  }): Promise<AdminUserSummary> {
    const { data: connection, error } = await this.supabase
      .from('telegram_connections')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      telegramConnected: Boolean(connection),
      telegramUsername: connection?.username ?? null,
      createdAt: user.created_at,
      accountType: user.account_type,
      businessName: user.business_name,
      subscriptionActive: user.subscription_active,
    };
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
