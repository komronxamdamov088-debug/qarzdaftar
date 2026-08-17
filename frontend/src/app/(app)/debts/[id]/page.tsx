import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  getCurrentUser,
  getDebt,
  listPayments,
  listReminders,
} from "@/lib/debts-api";
import { listReceiptsForDebt } from "@/lib/payments-api";
import { getServerToken } from "@/lib/session";
import {
  confirmationStatusLabel,
  formatDate,
  formatSom,
  statusLabel,
} from "@/lib/format";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type { CurrentUser, Debt, Payment, Receipt, Reminder } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { ReceiptList } from "@/components/receipt-list";
import { DeleteDebtButton } from "./delete-debt-button";
import { AddPaymentForm } from "./add-payment-form";
import { PaymentList } from "./payment-list";
import { CopyLinkButton } from "./copy-link-button";
import { ReminderPicker } from "./reminder-picker";
import { AiReminderPicker } from "./ai-reminder-picker";
import { PaymentButtons } from "./payment-buttons";

async function loadDebt(
  token: string,
  id: string,
): Promise<
  | {
      ok: true;
      user: CurrentUser;
      debt: Debt;
      payments: Payment[];
      reminders: Reminder[];
      receipts: Receipt[];
    }
  | { ok: false; unauthorized: boolean; notFound: boolean }
> {
  try {
    const [user, debt, payments, reminders] = await Promise.all([
      getCurrentUser(token),
      getDebt(token, id),
      listPayments(token, id),
      listReminders(token, id),
    ]);
    // Fetched separately and never lets a receipts-endpoint failure take
    // down the whole page — receipts are supplementary, the debt itself is
    // the primary content.
    const receipts = await listReceiptsForDebt(token, id).catch(() => []);
    return { ok: true, user, debt, payments, reminders, receipts };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
      notFound:
        error instanceof ApiError &&
        (error.status === 404 || error.status === 403),
    };
  }
}

export default async function DebtDetailPage(props: PageProps<"/debts/[id]">) {
  const { id } = await props.params;
  const { payment } = await props.searchParams;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadDebt(token, id);
  if (!result.ok) {
    if (result.unauthorized) return <SignInRequired />;
    if (result.notFound)
      return <ErrorState message={dict.debtDetail.notFound} />;
    return <ErrorState />;
  }

  const { user, debt, payments, reminders, receipts } = result;
  const iGave = debt.lender_id === user.id;
  const counterparty = iGave ? debt.borrower : debt.lender;
  const paidAmount = Number(debt.amount) - Number(debt.remaining_amount);
  const isPayable = debt.status !== "paid" && debt.status !== "cancelled";

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold uppercase">{counterparty.name}</h1>
        <p className="mt-1 text-2xl font-bold">{formatSom(debt.amount, locale)}</p>
      </div>

      {payment === "pending" && (
        <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          {dict.paymentButtons.pendingBanner}
        </p>
      )}

      <dl className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 text-sm shadow-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{dict.debtDetail.paid}</dt>
          <dd className="font-medium text-success">
            {formatSom(paidAmount, locale)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{dict.debtDetail.remaining}</dt>
          <dd className="font-medium">
            {formatSom(debt.remaining_amount, locale)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {dict.debtDetail.createdDate}
          </dt>
          <dd className="font-medium">{formatDate(debt.created_at, locale)}</dd>
        </div>
        {debt.due_date && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{dict.debtDetail.dueDate}</dt>
            <dd className="font-medium">{formatDate(debt.due_date, locale)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{dict.debtDetail.status}</dt>
          <dd className="font-medium">{statusLabel(debt.status, locale)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {dict.debtDetail.confirmation}
          </dt>
          <dd className="font-medium">
            {confirmationStatusLabel(debt.confirmation_status, locale)}
          </dd>
        </div>
        {debt.note && (
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{dict.debtDetail.note}</dt>
            <dd className="font-medium">{debt.note}</dd>
          </div>
        )}
      </dl>

      {debt.confirmation_status === "pending" && (
        <section className="flex flex-col gap-2 rounded-xl bg-card px-4 py-4 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.debtDetail.confirmationLinkTitle}
          </h2>
          <p className="text-xs text-muted-foreground">
            {dict.debtDetail.confirmationLinkDescription(counterparty.name)}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/confirm/${debt.confirmation_token}`}
            </span>
            <CopyLinkButton
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/confirm/${debt.confirmation_token}`}
            />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {dict.debtDetail.payments}
        </h2>
        <PaymentList
          payments={payments}
          originalAmount={debt.amount}
          locale={locale}
        />
      </section>

      <div className="flex gap-3">
        {isPayable ? (
          <AddPaymentForm
            debtId={debt.id}
            maxAmount={Number(debt.remaining_amount)}
          />
        ) : (
          <button
            type="button"
            disabled
            className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-muted-foreground"
          >
            {dict.debtDetail.fullyPaid}
          </button>
        )}
        <ReminderPicker
          debtId={debt.id}
          hasDueDate={!!debt.due_date}
          existingReminders={reminders}
        />
      </div>

      {isPayable && <PaymentButtons debtId={debt.id} />}

      <AiReminderPicker debtId={debt.id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {dict.receipts.title}
        </h2>
        <ReceiptList
          receipts={receipts}
          confirmationToken={debt.confirmation_token}
          locale={locale}
        />
      </section>

      <div className="flex gap-3">
        <Link
          href={`/debts/${debt.id}/edit`}
          className="flex-1 rounded-full bg-primary py-2.5 text-center text-sm font-medium text-white"
        >
          {dict.debtDetail.edit}
        </Link>
        <DeleteDebtButton debtId={debt.id} />
      </div>
    </main>
  );
}
