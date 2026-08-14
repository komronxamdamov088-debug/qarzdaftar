export function AdminStatTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 shadow-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">
        {value.toLocaleString("uz-UZ")}
      </span>
    </div>
  );
}
