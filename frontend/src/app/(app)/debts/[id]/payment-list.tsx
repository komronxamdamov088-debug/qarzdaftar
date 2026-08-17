import { getDictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";
import { formatDate, formatSom } from "@/lib/format";
import type { Payment } from "@/lib/types";

export function PaymentList({
  payments,
  originalAmount,
  locale = DEFAULT_LOCALE,
}: {
  payments: Payment[];
  originalAmount: string;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{dict.paymentList.empty}</p>
    );
  }

  const total = Number(originalAmount);
  const rows = payments.reduce<{ payment: Payment; cumulative: number }[]>(
    (acc, payment) => {
      const previous = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      return [...acc, { payment, cumulative: previous + Number(payment.amount) }];
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      {rows.map(({ payment, cumulative }) => {
        const progress =
          total > 0 ? Math.min(100, Math.round((cumulative / total) * 100)) : 0;
        return (
          <div
            key={payment.id}
            className="flex flex-col gap-1 rounded-lg bg-card px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatSom(payment.amount, locale)}
              </span>
              <span className="text-muted-foreground">
                {formatDate(payment.paid_at, locale)}
              </span>
            </div>
            {payment.note && (
              <span className="text-xs text-muted-foreground">
                {payment.note}
              </span>
            )}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
