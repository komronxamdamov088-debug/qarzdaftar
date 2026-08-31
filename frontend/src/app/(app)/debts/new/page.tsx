import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { AddDebtWizard } from "./add-debt-wizard";

async function loadUser(
  token: string,
): Promise<
  { ok: true; user: CurrentUser } | { ok: false; unauthorized: boolean }
> {
  try {
    const user = await getCurrentUser(token);
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function NewDebtPage() {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadUser(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  return (
    <AddDebtWizard phoneRequired={result.user.account_type === "business"} />
  );
}
