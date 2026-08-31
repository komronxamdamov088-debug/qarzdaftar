"use server";

import { revalidatePath } from "next/cache";
import { extractApiErrorMessage } from "@/lib/api";
import {
  initiateSubscriptionCheckout,
  registerBusiness,
  requestCashPayment,
} from "@/lib/subscription-api";
import type { PaymentProviderName, SubscriptionPlanMonths } from "@/lib/types";
import { getServerToken } from "@/lib/session";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export async function registerBusinessAction(
  businessName: string,
  planMonths: SubscriptionPlanMonths,
  phone: string,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await registerBusiness(token, { businessName, planMonths, phone });
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.subscriptionGate.registerError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function initiateSubscriptionCheckoutAction(
  provider: PaymentProviderName,
): Promise<
  { ok: false; message: string } | { ok: true; checkoutUrl: string }
> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    const result = await initiateSubscriptionCheckout(token, provider);
    return { ok: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.subscriptionGate.checkoutError,
        dict.apiErrors,
      ),
    };
  }
}

export async function requestCashPaymentAction(): Promise<
  { ok: false; message: string } | { ok: true }
> {
  const dict = getDictionary(await getLocale());
  const token = await getServerToken();
  if (!token) {
    return { ok: false, message: dict.apiErrors.AUTH_REQUIRED };
  }

  try {
    await requestCashPayment(token);
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        dict.subscriptionGate.cashRequestError,
        dict.apiErrors,
      ),
    };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
