import { getAdminReports } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import { formatNumber, reminderStatusLabel, statusLabel } from "@/lib/format";
import type { AdminReports } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locale";

async function loadReports(
  token: string,
): Promise<{ ok: true; reports: AdminReports } | { ok: false }> {
  try {
    const reports = await getAdminReports(token);
    return { ok: true, reports };
  } catch {
    return { ok: false };
  }
}

function ReportTable({
  title,
  rows,
  locale,
}: {
  title: string;
  rows: { label: string; count: number }[];
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-col divide-y divide-black/5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span>{row.label}</span>
            <span className="font-medium">
              {formatNumber(row.count, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminReportsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message={dict.admin.signInRequired} />;
  }

  const result = await loadReports(token);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { reports } = result;

  const debtRows = Object.entries(reports.debtsByStatus).map(
    ([status, count]) => ({ label: statusLabel(status, locale), count }),
  );
  const reminderRows = Object.entries(reports.remindersByStatus).map(
    ([status, count]) => ({
      label: reminderStatusLabel(status, locale),
      count,
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{dict.admin.reportsTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {dict.admin.reportsDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportTable
          title={dict.admin.debtsByStatus}
          rows={debtRows}
          locale={locale}
        />
        <ReportTable
          title={dict.admin.remindersByStatus}
          rows={reminderRows}
          locale={locale}
        />
      </div>
    </div>
  );
}
