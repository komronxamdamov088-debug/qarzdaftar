"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import { generateAiReminder } from "@/lib/ai-api";
import {
  createPayment,
  createReminder,
  deleteDebt,
  updateDebt,
} from "@/lib/debts-api";
import { initiateAuthenticatedCheckout } from "@/lib/payments-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type {
  AiReminderTone,
  CreatePaymentInput,
  CreateReminderInput,
  PaymentProviderName,
  UpdateDebtInput,
} from "@/lib/types";

export async function deleteDebtAction(
  id: string,
): Promise<{ ok: false; message: string } | undefined> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await deleteDebt(token, id);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/debts");
  redirect("/debts");
}

export async function updateDebtAction(
  id: string,
  input: UpdateDebtInput,
): Promise<{ ok: false; message: string } | undefined> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await updateDebt(token, id, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath(`/debts/${id}`);
  redirect(`/debts/${id}`);
}

export async function createPaymentAction(
  debtId: string,
  input: CreatePaymentInput,
): Promise<{ ok: false; message: string } | { ok: true } | undefined> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await createPayment(token, debtId, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath(`/debts/${debtId}`);
  return { ok: true };
}

export async function generateAiReminderAction(
  debtId: string,
  tone: AiReminderTone,
): Promise<{ ok: false; message: string } | { ok: true; message: string }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const result = await generateAiReminder(token, { debtId, tone });
    return { ok: true, message: result.message };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }
}

export async function initiateCheckoutAction(
  debtId: string,
  provider: PaymentProviderName,
): Promise<
  | { ok: false; message: string }
  | { ok: true; checkoutUrl: string }
> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const result = await initiateAuthenticatedCheckout(token, debtId, provider);
    return { ok: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }
}

export async function createReminderAction(
  debtId: string,
  input: CreateReminderInput,
): Promise<{ ok: false; message: string } | { ok: true } | undefined> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await createReminder(token, debtId, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.apiErrors.GENERIC,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath(`/debts/${debtId}`);
  return { ok: true };
}
