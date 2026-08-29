"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import {
  addAdminUserSubscriptionBonus,
  convertAdminUserToBusiness,
  revertAdminUserToPersonal,
  updateAdminUserRole,
  updateAdminUserSubscriptionPricing,
  updateAdminUserSubscriptionStatus,
} from "@/lib/admin-api";
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

export async function convertToBusinessAction(
  userId: string,
  businessName: string,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await convertAdminUserToBusiness(token, userId, businessName);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.businessUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateSubscriptionStatusAction(
  userId: string,
  active: boolean,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await updateAdminUserSubscriptionStatus(token, userId, active);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.businessUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function revertToPersonalAction(
  userId: string,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await revertAdminUserToPersonal(token, userId);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.businessUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateSubscriptionPricingAction(
  userId: string,
  input: { price?: number; discountPercent?: number },
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await updateAdminUserSubscriptionPricing(token, userId, input);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.businessUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function addSubscriptionBonusAction(
  userId: string,
  days: number,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await addAdminUserSubscriptionBonus(token, userId, days);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.businessUpdateError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
