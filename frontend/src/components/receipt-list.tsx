import { getDictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";
import { formatDate, formatSom } from "@/lib/format";
import { receiptPdfUrl } from "@/lib/payments-api";
import type { Receipt } from "@/lib/types";

export function ReceiptList({
  receipts,
  confirmationToken,
  locale = DEFAULT_LOCALE,
}: {
  receipts: Receipt[];
  confirmationToken: string;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);

  if (receipts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{dict.receipts.empty}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="flex flex-col gap-1 rounded-lg bg-card px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {formatSom(receipt.payment_amount, locale)}
            </span>
            <span className="text-muted-foreground">
              {formatDate(receipt.created_at, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {dict.receipts.receiptNumber}: {receipt.receipt_number}
              {" · "}
              {dict.receipts.methodLabels[receipt.method]}
            </span>
            <a
              href={receiptPdfUrl(confirmationToken, receipt.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary"
            >
              {dict.receipts.downloadPdf}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
