import { ApiError } from "@/lib/api";
import { getPublicDebt } from "@/lib/debts-api";
import { listPublicReceipts } from "@/lib/payments-api";
import { formatDate, formatSom } from "@/lib/format";
import type { PublicDebtView, Receipt } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { ReceiptList } from "@/components/receipt-list";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { ConfirmActions } from "./confirm-actions";
import { PaymentButtons } from "./payment-buttons";

async function loadPublicDebt(
  token: string,
): Promise<
  | { ok: true; debt: PublicDebtView; receipts: Receipt[] }
  | { ok: false; notFound: boolean }
> {
  try {
    const debt = await getPublicDebt(token);
    // Fetched separately so a receipts-endpoint failure never hides the
    // debt itself behind a generic error — receipts are supplementary.
    const receipts = await listPublicReceipts(token).catch(() => []);
    return { ok: true, debt, receipts };
  } catch (error) {
    return {
      ok: false,
      notFound: error instanceof ApiError && error.status === 404,
    };
  }
}

export default async function ConfirmPage(
  props: PageProps<"/confirm/[token]">,
) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { token } = await props.params;
  const { payment } = await props.searchParams;
  const result = await loadPublicDebt(token);

  if (!result.ok) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background">
        <ErrorState
          message={result.notFound ? dict.confirmPage.linkInvalid : undefined}
        />
      </main>
    );
  }

  const { debt, receipts } = result;
  const isPayable = debt.status !== "paid" && debt.status !== "cancelled";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      {payment === "pending" && (
        <p className="w-full max-w-xs rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          {dict.paymentButtons.pendingBanner}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">
          {dict.confirmPage.header(
            debt.lender.name,
            debt.borrower.name,
            formatSom(debt.amount, locale),
          )}
        </h1>
        {debt.due_date && (
          <p className="text-sm text-muted-foreground">
            {dict.confirmPage.dueDate(formatDate(debt.due_date, locale))}
          </p>
        )}
        {debt.note && (
          <p className="text-sm text-muted-foreground">{debt.note}</p>
        )}
      </div>

      <ConfirmActions
        token={token}
        confirmationStatus={debt.confirmation_status}
      />

      {isPayable && <PaymentButtons token={token} />}

      {receipts.length > 0 && (
        <div className="flex w-full max-w-xs flex-col gap-2 text-left">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.receipts.title}
          </h2>
          <ReceiptList receipts={receipts} confirmationToken={token} locale={locale} />
        </div>
      )}

      <p className="max-w-xs text-xs text-muted-foreground">
        {dict.confirmPage.disclaimer}
      </p>
    </main>
  );
}
