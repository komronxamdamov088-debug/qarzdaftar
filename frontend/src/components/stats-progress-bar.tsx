import { formatSom } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/dictionaries";

export function StatsProgressBar({
  repaid,
  remaining,
  locale = DEFAULT_LOCALE,
}: {
  repaid: number;
  remaining: number;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const total = repaid + remaining;
  const repaidPct = total > 0 ? (repaid / total) * 100 : 0;
  const remainingPct = total > 0 ? 100 - repaidPct : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
      <span className="text-sm font-medium">{dict.statsProgressBar.label}</span>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-background">
        {repaidPct > 0 && (
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${repaidPct}%` }}
          />
        )}
        {remainingPct > 0 && (
          <div
            className="h-full rounded-full bg-warning"
            style={{ width: `${remainingPct}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          {dict.statsProgressBar.repaid}: {formatSom(repaid, locale)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" />
          {dict.statsProgressBar.remaining}: {formatSom(remaining, locale)}
        </span>
      </div>
    </div>
  );
}
