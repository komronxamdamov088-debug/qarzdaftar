import { ApiError } from "@/lib/api";
import { getCurrentUser, listDebts } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { CurrentUser, Debt, ListDebtsParams } from "@/lib/types";
import { DebtCard } from "@/components/debt-card";
import { DebtFilters } from "@/components/debt-filters";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";

async function loadDebts(
  token: string,
  params: ListDebtsParams,
): Promise<
  | { ok: true; user: CurrentUser; debts: Debt[] }
  | { ok: false; unauthorized: boolean }
> {
  try {
    const [user, debts] = await Promise.all([
      getCurrentUser(token),
      listDebts(token, params),
    ]);
    return { ok: true, user, debts };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

function asDirection(value: unknown): "given" | "taken" | undefined {
  return value === "given" || value === "taken" ? value : undefined;
}

function asState(value: unknown): "unpaid" | "paid" | "overdue" | undefined {
  return value === "unpaid" || value === "paid" || value === "overdue"
    ? value
    : undefined;
}

function asSort(
  value: unknown,
): "newest" | "oldest" | "amount" | "due_date" | undefined {
  return value === "newest" ||
    value === "oldest" ||
    value === "amount" ||
    value === "due_date"
    ? value
    : undefined;
}

export default async function DebtsPage(props: PageProps<"/debts">) {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const searchParams = await props.searchParams;
  const params: ListDebtsParams = {
    direction: asDirection(searchParams.direction),
    state: asState(searchParams.state),
    search:
      typeof searchParams.search === "string" ? searchParams.search : undefined,
    sort: asSort(searchParams.sort),
  };

  const result = await loadDebts(token, params);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { user, debts } = result;

  return (
    <main className="flex flex-1 flex-col gap-4 py-6">
      <h1 className="px-4 text-xl font-semibold">Qarzlar</h1>
      <DebtFilters />
      <div className="flex flex-col gap-2 px-4">
        {debts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Hech narsa topilmadi.
          </p>
        ) : (
          debts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} currentUserId={user.id} />
          ))
        )}
      </div>
    </main>
  );
}
