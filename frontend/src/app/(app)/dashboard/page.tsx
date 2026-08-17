import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getCurrentUser, listDebts } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { isOverdue, isUpcoming, summarizeDebts } from "@/lib/summary";
import type { CurrentUser, Debt } from "@/lib/types";
import { DebtCard } from "@/components/debt-card";
import { SummaryCard } from "@/components/summary-card";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

async function loadDashboardData(
  token: string,
): Promise<
  | { ok: true; user: CurrentUser; debts: Debt[] }
  | { ok: false; unauthorized: boolean }
> {
  try {
    const [user, debts] = await Promise.all([
      getCurrentUser(token),
      listDebts(token, { sort: "newest" }),
    ]);
    return { ok: true, user, debts };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadDashboardData(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { user, debts } = result;

  if (debts.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">{dict.dashboard.emptyTitle}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {dict.dashboard.emptyDescription}
        </p>
        <Link
          href="/debts/new"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          {dict.dashboard.emptyCta}
        </Link>
      </main>
    );
  }

  const { owedToMe, iOwe, balance } = summarizeDebts(debts, user.id);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = debts.filter((debt) => isOverdue(debt, today));
  const upcoming = debts
    .filter((debt) => isUpcoming(debt, today))
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 3);
  const recent = debts.slice(0, 5);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {dict.dashboard.greeting(user.name.split(" ")[0])}
        </h1>
        <Link
          href="/debts/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          {dict.dashboard.addDebt}
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label={dict.dashboard.owedToMe}
          value={owedToMe}
          tone="success"
          locale={locale}
        />
        <SummaryCard
          label={dict.dashboard.iOwe}
          value={iOwe}
          tone="danger"
          locale={locale}
        />
        <SummaryCard
          label={dict.dashboard.balance}
          value={balance}
          tone={balance >= 0 ? "success" : "danger"}
          signed
          locale={locale}
        />
      </section>

      {overdue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.dashboard.overdue}
          </h2>
          <div className="flex flex-col gap-2">
            {overdue.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currentUserId={user.id}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.dashboard.upcoming}
          </h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currentUserId={user.id}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.dashboard.recentActivity}
          </h2>
          <Link href="/debts" className="text-sm text-primary">
            {dict.dashboard.all}
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {recent.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              currentUserId={user.id}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
