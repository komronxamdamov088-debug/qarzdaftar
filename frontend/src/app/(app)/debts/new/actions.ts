"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { createDebt } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type { CreateDebtInput } from "@/lib/types";

export async function createDebtAction(
  input: CreateDebtInput,
): Promise<{ ok: false; message: string } | undefined> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  let debtId: string;
  try {
    const debt = await createDebt(token, input);
    debtId = debt.id;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? dict.newDebt.submitError
        : dict.newDebt.unexpectedError;
    return { ok: false, message };
  }

  redirect(`/debts/${debtId}`);
}
