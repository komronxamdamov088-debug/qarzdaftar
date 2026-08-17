import { formatNumber } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";

export function AdminStatTile({
  label,
  value,
  locale = DEFAULT_LOCALE,
}: {
  label: string;
  value: number;
  locale?: Locale;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 shadow-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">
        {formatNumber(value, locale)}
      </span>
    </div>
  );
}
