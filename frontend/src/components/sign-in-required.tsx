export function SignInRequired() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-lg font-semibold">Tizimga kirish talab qilinadi</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Bu sahifani ko&apos;rish uchun avval hisobingizga kiring. Telefon/OTP
        va Telegram orqali kirish tez orada faollashtiriladi.
      </p>
    </div>
  );
}
