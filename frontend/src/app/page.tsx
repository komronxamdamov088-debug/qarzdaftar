import { TelegramBootstrap } from "@/components/telegram-bootstrap";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <TelegramBootstrap />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Qarz unutilmaydi.
        <br />
        Munosabat buzilmaydi.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Kim sizdan qancha olganini yoki siz kimdan qancha qarzdor ekaningizni
        oddiy va qulay boshqaring.
      </p>
    </main>
  );
}
