import { getAdminStats } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import type { AdminStats } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { AdminStatTile } from "@/components/admin-stat-tile";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

async function loadStats(
  token: string,
): Promise<{ ok: true; stats: AdminStats } | { ok: false }> {
  try {
    const stats = await getAdminStats(token);
    return { ok: true, stats };
  } catch {
    return { ok: false };
  }
}

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message={dict.admin.signInRequired} />;
  }

  const result = await loadStats(token);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { stats } = result;
  const { tiles } = dict.admin;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{dict.admin.dashboardTitle}</h1>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AdminStatTile
          label={tiles.totalUsers}
          value={stats.totalUsers}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.newUsers}
          value={stats.newUsers}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.activeUsers}
          value={stats.activeUsers}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.totalDebts}
          value={stats.totalDebts}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.paidDebts}
          value={stats.paidDebts}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.overdueDebts}
          value={stats.overdueDebts}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.aiReminderUsage}
          value={stats.aiReminderUsage}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.pushSubscriptions}
          value={stats.pushSubscriptions}
          locale={locale}
        />
        <AdminStatTile
          label={tiles.telegramConnectedUsers}
          value={stats.telegramConnectedUsers}
          locale={locale}
        />
      </section>
    </div>
  );
}
