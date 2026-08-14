export function ErrorState({
  message = "Ma'lumotni yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-lg font-semibold text-danger">Xatolik</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
