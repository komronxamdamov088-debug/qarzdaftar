import { TelegramBootstrap } from "@/components/telegram-bootstrap";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export default async function Home() {
  const dict = getDictionary(await getLocale());
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <TelegramBootstrap />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.home.heroLine1}
        <br />
        {dict.home.heroLine2}
      </h1>
      <p className="max-w-md text-muted-foreground">{dict.home.subtitle}</p>
    </main>
  );
}
