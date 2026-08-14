import { ApiError } from "@/lib/api";
import { getStats } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { UserStats } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { SummaryCard } from "@/components/summary-card";
import { StatsProgressBar } from "@/components/stats-progress-bar";

async function loadStats(
  token: string,
): Promise<{ ok: true; stats: UserStats } | { ok: false; unauthorized: boolean }> {
  try {
    const stats = await getStats(token);
    return { ok: true, stats };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function StatisticsPage() {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadStats(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { stats } = result;
  const hasActivity = stats.totalGiven + stats.totalTaken > 0;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-semibold">Statistika</h1>

      {!hasActivity ? (
        <p className="text-sm text-muted-foreground">
          Statistikangiz qarz qo&apos;shganingizdan keyin shu yerda paydo
          bo&apos;ladi.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Jami bergan"
              value={stats.totalGiven}
              tone="success"
            />
            <SummaryCard
              label="Jami olgan"
              value={stats.totalTaken}
              tone="danger"
            />
            <SummaryCard
              label="Qaytarilgan"
              value={stats.totalRepaid}
              tone="primary"
            />
            <SummaryCard
              label="Qolgan"
              value={stats.totalRemaining}
              tone="warning"
            />
          </section>

          <SummaryCard
            label="Muddati o'tgan"
            value={stats.totalOverdue}
            tone="danger"
          />

          <StatsProgressBar
            repaid={stats.totalRepaid}
            remaining={stats.totalRemaining}
          />
        </>
      )}
    </main>
  );
}
