"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import { updateAdminUserRole } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export async function updateUserRoleAction(
  userId: string,
  role: "user" | "admin",
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await updateAdminUserRole(token, userId, role);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.roleUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
