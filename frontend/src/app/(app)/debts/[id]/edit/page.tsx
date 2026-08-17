import { ApiError } from "@/lib/api";
import { getDebt } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type { Debt } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { EditDebtForm } from "./edit-debt-form";

async function loadDebt(
  token: string,
  id: string,
): Promise<{ ok: true; debt: Debt } | { ok: false; unauthorized: boolean }> {
  try {
    const debt = await getDebt(token, id);
    return { ok: true, debt };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function EditDebtPage(
  props: PageProps<"/debts/[id]/edit">,
) {
  const { id } = await props.params;
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadDebt(token, id);
  if (!result.ok) {
    return result.unauthorized ? (
      <SignInRequired />
    ) : (
      <ErrorState message={dict.editDebt.loadError} />
    );
  }

  return <EditDebtForm debt={result.debt} />;
}
