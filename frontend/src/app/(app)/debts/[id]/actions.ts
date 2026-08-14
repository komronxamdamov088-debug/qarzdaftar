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
import { getServerToken } from "@/lib/session";
import type {
  AiReminderTone,
  CreatePaymentInput,
  CreateReminderInput,
  UpdateDebtInput,
} from "@/lib/types";

export async function deleteDebtAction(
  id: string,
): Promise<{ ok: false; message: string } | undefined> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await deleteDebt(token, id);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Qarzni o'chirishda xatolik yuz berdi.",
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
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await updateDebt(token, id, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(error, "Saqlashda xatolik yuz berdi."),
    };
  }

  revalidatePath(`/debts/${id}`);
  redirect(`/debts/${id}`);
}

export async function createPaymentAction(
  debtId: string,
  input: CreatePaymentInput,
): Promise<{ ok: false; message: string } | { ok: true } | undefined> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await createPayment(token, debtId, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "To'lovni saqlashda xatolik yuz berdi.",
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
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    const result = await generateAiReminder(token, { debtId, tone });
    return { ok: true, message: result.message };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "AI xabar yaratishda xatolik yuz berdi.",
      ),
    };
  }
}

export async function createReminderAction(
  debtId: string,
  input: CreateReminderInput,
): Promise<{ ok: false; message: string } | { ok: true } | undefined> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await createReminder(token, debtId, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Eslatmani saqlashda xatolik yuz berdi.",
      ),
    };
  }

  revalidatePath(`/debts/${debtId}`);
  return { ok: true };
}
