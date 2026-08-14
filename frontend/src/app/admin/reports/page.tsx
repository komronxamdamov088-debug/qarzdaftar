import { getAdminReports } from "@/lib/admin-api";
import { getServerToken } from "@/lib/session";
import { reminderStatusLabel, statusLabel } from "@/lib/format";
import type { AdminReports } from "@/lib/types";
import { ErrorState } from "@/components/error-state";

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
}: {
  title: string;
  rows: { label: string; count: number }[];
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
              {row.count.toLocaleString("uz-UZ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminReportsPage() {
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message="Tizimga kirish talab qilinadi." />;
  }

  const result = await loadReports(token);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { reports } = result;

  const debtRows = Object.entries(reports.debtsByStatus).map(
    ([status, count]) => ({ label: statusLabel(status), count }),
  );
  const reminderRows = Object.entries(reports.remindersByStatus).map(
    ([status, count]) => ({ label: reminderStatusLabel(status), count }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Hisobotlar</h1>
        <p className="text-sm text-muted-foreground">
          Faqat umumiy sonlar — shaxsiy qarz tafsilotlari ko&apos;rsatilmaydi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportTable title="Qarzlar holati bo'yicha" rows={debtRows} />
        <ReportTable title="Eslatmalar holati bo'yicha" rows={reminderRows} />
      </div>
    </div>
  );
}
