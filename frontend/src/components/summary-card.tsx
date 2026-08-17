import { formatSom } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";

const TONE_CLASSES = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  primary: "text-primary",
} as const;

export function SummaryCard({
  label,
  value,
  tone,
  signed = false,
  locale = DEFAULT_LOCALE,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE_CLASSES;
  signed?: boolean;
  locale?: Locale;
}) {
  const display = signed
    ? `${value >= 0 ? "+" : "-"}${formatSom(Math.abs(value), locale)}`
    : formatSom(value, locale);

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 shadow-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${TONE_CLASSES[tone]}`}>
        {display}
      </span>
    </div>
  );
}
