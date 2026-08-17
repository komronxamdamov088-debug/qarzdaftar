import Link from "next/link";
import { formatDate, formatSom, statusLabel } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";
import type { Debt } from "@/lib/types";

export function DebtCard({
  debt,
  currentUserId,
  locale = DEFAULT_LOCALE,
}: {
  debt: Debt;
  currentUserId: string;
  locale?: Locale;
}) {
  const iGave = debt.lender_id === currentUserId;
  const counterparty = iGave ? debt.borrower : debt.lender;

  return (
    <Link
      href={`/debts/${debt.id}`}
      className="flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{counterparty.name}</span>
        <span className="text-xs text-muted-foreground">
          {statusLabel(debt.status, locale)}
          {debt.due_date ? ` · ${formatDate(debt.due_date, locale)}` : ""}
        </span>
      </div>
      <span
        className={`text-base font-semibold ${iGave ? "text-success" : "text-danger"}`}
      >
        {formatSom(debt.remaining_amount, locale)}
      </span>
    </Link>
  );
}
