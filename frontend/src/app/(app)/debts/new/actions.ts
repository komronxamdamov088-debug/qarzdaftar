"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { createDebt } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import type { CreateDebtInput } from "@/lib/types";

export async function createDebtAction(
  input: CreateDebtInput,
): Promise<{ ok: false; message: string } | undefined> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  let debtId: string;
  try {
    const debt = await createDebt(token, input);
    debtId = debt.id;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? "Qarzni saqlashda xatolik yuz berdi. Ma'lumotlarni tekshirib, qaytadan urinib ko'ring."
        : "Kutilmagan xatolik yuz berdi.";
    return { ok: false, message };
  }

  redirect(`/debts/${debtId}`);
}
