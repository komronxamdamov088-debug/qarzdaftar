import { getAdminStats } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import type { AdminStats } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { AdminStatTile } from "@/components/admin-stat-tile";

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
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message="Tizimga kirish talab qilinadi." />;
  }

  const result = await loadStats(token);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { stats } = result;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Boshqaruv paneli</h1>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AdminStatTile label="Jami foydalanuvchilar" value={stats.totalUsers} />
        <AdminStatTile
          label="Yangi foydalanuvchilar (7 kun)"
          value={stats.newUsers}
        />
        <AdminStatTile
          label="Faol foydalanuvchilar (30 kun)"
          value={stats.activeUsers}
        />
        <AdminStatTile label="Jami qarzlar" value={stats.totalDebts} />
        <AdminStatTile label="To'langan qarzlar" value={stats.paidDebts} />
        <AdminStatTile
          label="Muddati o'tgan qarzlar"
          value={stats.overdueDebts}
        />
        <AdminStatTile
          label="AI eslatma ishlatilishi"
          value={stats.aiReminderUsage}
        />
        <AdminStatTile label="Push obunalari" value={stats.pushSubscriptions} />
        <AdminStatTile
          label="Telegram ulangan foydalanuvchilar"
          value={stats.telegramConnectedUsers}
        />
      </section>
    </div>
  );
}
