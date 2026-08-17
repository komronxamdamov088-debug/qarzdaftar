import { apiFetch } from "./api";
import type { CheckoutResult, PaymentProviderName, Receipt } from "./types";

// Authenticated checkout — lives on payment-providers/ backend routes, not
// /debts/:id/payments, to avoid a backend module import cycle (see task.md
// Stage 3). Kept as its own thin-wrapper module (payments-api.ts) rather
// than folded into debts-api.ts for the same reason: it's a distinct
// backend module with its own route family.
export function initiateAuthenticatedCheckout(
  token: string,
  debtId: string,
  provider: PaymentProviderName,
) {
  return apiFetch<CheckoutResult>(`/debts/${debtId}/payments/${provider}/checkout`, {
    method: "POST",
    token,
  });
}

export function listReceiptsForDebt(token: string, debtId: string) {
  return apiFetch<Receipt[]>(`/debts/${debtId}/receipts`, { token });
}

// Unauthenticated: reachable via the shareable confirmation link, same
// trust boundary as getPublicDebt/confirmPublicDebt in debts-api.ts.
export function initiatePublicCheckout(
  confirmationToken: string,
  provider: PaymentProviderName,
) {
  return apiFetch<CheckoutResult>(
    `/debts/confirm/${confirmationToken}/checkout/${provider}`,
    { method: "POST" },
  );
}

export function listPublicReceipts(confirmationToken: string) {
  return apiFetch<Receipt[]>(`/debts/confirm/${confirmationToken}/receipts`);
}

// The debt owner already possesses the debt's confirmation_token (it's
// shown to them as the share link), so a receipt's PDF is always fetched
// through the public route — no separate authenticated-download mechanism
// needed, and no Bearer token has to be smuggled into a plain <a href>.
export function receiptPdfUrl(confirmationToken: string, receiptId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return `${apiUrl}/debts/confirm/${confirmationToken}/receipts/${receiptId}/pdf`;
}
