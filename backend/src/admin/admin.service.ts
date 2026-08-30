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

// Kept as a single string literal (not built via `+` concatenation) so
// supabase-js's typed client can still parse the column list at the type
// level — concatenating literals widens the type to plain `string`, which
// breaks that inference and made every `.select(USER_SUMMARY_COLUMNS)` call
// fall back to an untyped `GenericStringError` result.
const USER_SUMMARY_COLUMNS =
  'id, name, phone, role, account_type, business_name, subscription_active, subscription_price, subscription_discount_percent, subscription_valid_until, access_override, cash_payment_requested_at, created_at';

interface UserSummaryRow {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  account_type: AccountType;
  business_name: string | null;
  subscription_active: boolean;
  subscription_price: string;
  subscription_discount_percent: string;
  subscription_valid_until: string | null;
  access_override: boolean;
  cash_payment_requested_at: string | null;
  created_at: string;
}

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
      .select(USER_SUMMARY_COLUMNS)
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
      subscriptionPrice: user.subscription_price,
      subscriptionDiscountPercent: user.subscription_discount_percent,
      subscriptionValidUntil: user.subscription_valid_until,
      accessOverride: user.access_override,
      cashPaymentRequestedAt: user.cash_payment_requested_at,
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
      .select(USER_SUMMARY_COLUMNS)
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
      .select(USER_SUMMARY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // The inverse of convertToBusiness — resets every subscription-related
  // field back to its default so a re-converted account later doesn't
  // inherit stale pricing/discount/valid-until data from a previous stint
  // as a business account.
  async revertToPersonal(targetUserId: string): Promise<AdminUserSummary> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        account_type: 'personal',
        business_name: null,
        subscription_active: true,
        subscription_price: 0,
        subscription_discount_percent: 0,
        subscription_valid_until: null,
        subscription_plan_months: null,
        cash_payment_requested_at: null,
      })
      .eq('id', targetUserId)
      .select(USER_SUMMARY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // The manual exemption that keeps a specific account working regardless of
  // account_type/subscription_active — see SubscriptionGateGuard. Its main
  // use is grandfathering a pre-existing personal account (a real
  // friend/family user from before the app became shop-only) without
  // forcing them to become a business, but nothing stops it being used on a
  // business account too (e.g. a shop the owner wants to keep free).
  async setAccessOverride(
    targetUserId: string,
    override: boolean,
  ): Promise<AdminUserSummary> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ access_override: override })
      .eq('id', targetUserId)
      .select(USER_SUMMARY_COLUMNS)
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
    await this.assertBusinessAccount(
      targetUserId,
      "Obuna holatini faqat do'kon hisoblari uchun o'zgartirish mumkin",
    );

    const { data, error } = await this.supabase
      .from('users')
      // Activating also clears any pending cash-payment-request badge — the
      // admin acting on it is exactly what the badge exists to prompt.
      .update({
        subscription_active: active,
        ...(active && { cash_payment_requested_at: null }),
      })
      .eq('id', targetUserId)
      .select(USER_SUMMARY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // Records the monthly price and an optional current-month discount for a
  // shop. No billing engine — purely informational, shown to the shop owner
  // in their own profile too (see frontend profile page), and never
  // automatically affects subscription_active.
  async updateSubscriptionPricing(
    targetUserId: string,
    dto: { price?: number; discountPercent?: number },
  ): Promise<AdminUserSummary> {
    await this.assertBusinessAccount(
      targetUserId,
      "Narx/chegirmani faqat do'kon hisoblari uchun o'zgartirish mumkin",
    );

    const update: {
      subscription_price?: number;
      subscription_discount_percent?: number;
    } = {};
    if (dto.price !== undefined) {
      update.subscription_price = dto.price;
    }
    if (dto.discountPercent !== undefined) {
      update.subscription_discount_percent = dto.discountPercent;
    }

    const { data, error } = await this.supabase
      .from('users')
      .update(update)
      .eq('id', targetUserId)
      .select(USER_SUMMARY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  // "Bonus kun" extends how far subscription_valid_until reaches — purely a
  // record of "paid through" that the admin and the shop owner can both see;
  // it never touches subscription_active on its own. Extends from whichever
  // is later: today, or the shop's current valid-until date (so adding bonus
  // days to an account that's still comfortably paid up stacks correctly
  // instead of resetting to today + days).
  async addSubscriptionBonusDays(
    targetUserId: string,
    days: number,
  ): Promise<AdminUserSummary> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('users')
      .select('account_type, subscription_valid_until')
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
        "Bonus kunlarni faqat do'kon hisoblari uchun qo'shish mumkin",
      );
    }

    const today = new Date();
    const currentValidUntil = existing.subscription_valid_until
      ? new Date(existing.subscription_valid_until)
      : null;
    const base =
      currentValidUntil && currentValidUntil > today
        ? currentValidUntil
        : today;
    const next = new Date(base);
    next.setDate(next.getDate() + days);

    const { data, error } = await this.supabase
      .from('users')
      .update({ subscription_valid_until: next.toISOString().slice(0, 10) })
      .eq('id', targetUserId)
      .select(USER_SUMMARY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.toUserSummary(data);
  }

  private async assertBusinessAccount(
    targetUserId: string,
    errorMessage: string,
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('users')
      .select('account_type')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    if (data.account_type !== 'business') {
      throw new BadRequestException(errorMessage);
    }
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

  private async toUserSummary(user: UserSummaryRow): Promise<AdminUserSummary> {
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
      subscriptionPrice: user.subscription_price,
      subscriptionDiscountPercent: user.subscription_discount_percent,
      subscriptionValidUntil: user.subscription_valid_until,
      accessOverride: user.access_override,
      cashPaymentRequestedAt: user.cash_payment_requested_at,
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
