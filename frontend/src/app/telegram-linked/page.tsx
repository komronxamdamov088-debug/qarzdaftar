import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export default async function TelegramLinkedPage() {
  const dict = getDictionary(await getLocale());
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl">
        ✅
      </div>
      <h1 className="text-xl font-semibold">{dict.telegramLinked.title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {dict.telegramLinked.body}
      </p>
    </main>
  );
}
