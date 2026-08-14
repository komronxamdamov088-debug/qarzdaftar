import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  getCurrentUser,
  getDebt,
  listPayments,
  listReminders,
} from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import {
  confirmationStatusLabel,
  formatDate,
  formatSom,
  statusLabel,
} from "@/lib/format";
import type { CurrentUser, Debt, Payment, Reminder } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { DeleteDebtButton } from "./delete-debt-button";
import { AddPaymentForm } from "./add-payment-form";
import { PaymentList } from "./payment-list";
import { CopyLinkButton } from "./copy-link-button";
import { ReminderPicker } from "./reminder-picker";
import { AiReminderPicker } from "./ai-reminder-picker";

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
    return { ok: true, user, debt, payments, reminders };
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
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadDebt(token, id);
  if (!result.ok) {
    if (result.unauthorized) return <SignInRequired />;
    if (result.notFound) return <ErrorState message="Qarz topilmadi." />;
    return <ErrorState />;
  }

  const { user, debt, payments, reminders } = result;
  const iGave = debt.lender_id === user.id;
  const counterparty = iGave ? debt.borrower : debt.lender;
  const paidAmount = Number(debt.amount) - Number(debt.remaining_amount);
  const isPayable = debt.status !== "paid" && debt.status !== "cancelled";

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold uppercase">{counterparty.name}</h1>
        <p className="mt-1 text-2xl font-bold">{formatSom(debt.amount)}</p>
      </div>

      <dl className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 text-sm shadow-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">To&apos;langan</dt>
          <dd className="font-medium text-success">{formatSom(paidAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Qolgan</dt>
          <dd className="font-medium">{formatSom(debt.remaining_amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Yaratilgan sana</dt>
          <dd className="font-medium">{formatDate(debt.created_at)}</dd>
        </div>
        {debt.due_date && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Qaytarish sanasi</dt>
            <dd className="font-medium">{formatDate(debt.due_date)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{statusLabel(debt.status)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tasdiqlash</dt>
          <dd className="font-medium">
            {confirmationStatusLabel(debt.confirmation_status)}
          </dd>
        </div>
        {debt.note && (
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Izoh</dt>
            <dd className="font-medium">{debt.note}</dd>
          </div>
        )}
      </dl>

      {debt.confirmation_status === "pending" && (
        <section className="flex flex-col gap-2 rounded-xl bg-card px-4 py-4 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">
            Tasdiqlash havolasi
          </h2>
          <p className="text-xs text-muted-foreground">
            {counterparty.name}ga shu havolani yuboring — u qarzni
            tasdiqlaydi yoki rad etadi.
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
          To&apos;lovlar
        </h2>
        <PaymentList payments={payments} originalAmount={debt.amount} />
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
            To&apos;liq to&apos;langan
          </button>
        )}
        <ReminderPicker
          debtId={debt.id}
          hasDueDate={!!debt.due_date}
          existingReminders={reminders}
        />
      </div>

      <AiReminderPicker debtId={debt.id} />

      <div className="flex gap-3">
        <Link
          href={`/debts/${debt.id}/edit`}
          className="flex-1 rounded-full bg-primary py-2.5 text-center text-sm font-medium text-white"
        >
          Tahrirlash
        </Link>
        <DeleteDebtButton debtId={debt.id} />
      </div>
    </main>
  );
}
