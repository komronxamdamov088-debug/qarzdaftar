"use server";

import { extractApiErrorMessage } from "@/lib/api";
import {
  addAdminUserSubscriptionBonus,
  convertAdminUserToBusiness,
  revertAdminUserToPersonal,
  updateAdminUserAccessOverride,
  updateAdminUserRole,
  updateAdminUserSubscriptionPricing,
  updateAdminUserSubscriptionStatus,
} from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type { AdminUserSummary } from "@/lib/types";

type ActionResult =
  | { ok: false; message: string }
  | { ok: true; user: AdminUserSummary };

export async function updateUserRoleAction(
  userId: string,
  role: "user" | "admin",
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await updateAdminUserRole(token, userId, role);
    return { ok: true, user };
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
}

export async function convertToBusinessAction(
  userId: string,
  businessName: string,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await convertAdminUserToBusiness(token, userId, businessName);
    return { ok: true, user };
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
}

export async function updateSubscriptionStatusAction(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await updateAdminUserSubscriptionStatus(token, userId, active);
    return { ok: true, user };
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
}

export async function revertToPersonalAction(
  userId: string,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await revertAdminUserToPersonal(token, userId);
    return { ok: true, user };
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
}

export async function updateAccessOverrideAction(
  userId: string,
  override: boolean,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await updateAdminUserAccessOverride(token, userId, override);
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.admin.accessOverrideError,
        dict.apiErrors,
      ),
    };
  }
}

export async function updateSubscriptionPricingAction(
  userId: string,
  input: { price?: number; discountPercent?: number },
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await updateAdminUserSubscriptionPricing(token, userId, input);
    return { ok: true, user };
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
}

export async function addSubscriptionBonusAction(
  userId: string,
  days: number,
): Promise<ActionResult> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const user = await addAdminUserSubscriptionBonus(token, userId, days);
    return { ok: true, user };
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
}
