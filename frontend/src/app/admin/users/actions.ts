"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import { updateAdminUserRole } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";

export async function updateUserRoleAction(
  userId: string,
  role: "user" | "admin",
): Promise<{ ok: false; message: string } | { ok: true }> {
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: "Tizimga kirish talab qilinadi." };
  }

  try {
    await updateAdminUserRole(token, userId, role);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Rolni yangilashda xatolik yuz berdi.",
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
