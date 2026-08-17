import { ApiError } from "@/lib/api";
import { getStats } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { UserStats } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { SummaryCard } from "@/components/summary-card";
import { StatsProgressBar } from "@/components/stats-progress-bar";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

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
  const locale = await getLocale();
  const dict = getDictionary(locale);
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
      <h1 className="text-xl font-semibold">{dict.statistics.title}</h1>

      {!hasActivity ? (
        <p className="text-sm text-muted-foreground">
          {dict.statistics.empty}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={dict.statistics.totalGiven}
              value={stats.totalGiven}
              tone="success"
              locale={locale}
            />
            <SummaryCard
              label={dict.statistics.totalTaken}
              value={stats.totalTaken}
              tone="danger"
              locale={locale}
            />
            <SummaryCard
              label={dict.statistics.totalRepaid}
              value={stats.totalRepaid}
              tone="primary"
              locale={locale}
            />
            <SummaryCard
              label={dict.statistics.totalRemaining}
              value={stats.totalRemaining}
              tone="warning"
              locale={locale}
            />
          </section>

          <SummaryCard
            label={dict.statistics.totalOverdue}
            value={stats.totalOverdue}
            tone="danger"
            locale={locale}
          />

          <StatsProgressBar
            repaid={stats.totalRepaid}
            remaining={stats.totalRemaining}
            locale={locale}
          />
        </>
      )}
    </main>
  );
}
