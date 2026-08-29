"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithTelegramAction } from "@/lib/telegram-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function routeForStartParam(startParam: string | undefined): string {
  if (!startParam) {
    return "/dashboard";
  }
  const debtMatch = /^debt-(.+)$/.exec(startParam);
  if (debtMatch && UUID_RE.test(debtMatch[1])) {
    return `/debts/${debtMatch[1]}`;
  }
  const payMatch = /^pay-(.+)$/.exec(startParam);
  if (payMatch && UUID_RE.test(payMatch[1])) {
    return `/debts/${payMatch[1]}?openPayment=1`;
  }
  return "/dashboard";
}

// `telegram-web-app.js` is loaded with strategy="beforeInteractive" (see
// app/layout.tsx), so window.Telegram is already populated by the time this
// component hydrates — safe to read directly as the initial state instead
// of discovering it a tick later inside an effect.
function isTelegramContext(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(window.Telegram?.WebApp?.initData);
}

// Inside Telegram, the marketing hero should never be visible at all — the
// Mini App should land straight on the real app after login. Outside
// Telegram (a plain browser visit), there's no initData, so the hero renders
// immediately instead.
export function HomeGate({
  heroLine1,
  heroLine2,
  subtitle,
}: {
  heroLine1: string;
  heroLine2: string;
  subtitle: string;
}) {
  const router = useRouter();
  const attempted = useRef(false);
  const [isTelegram] = useState(isTelegramContext);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!isTelegram || !webApp || attempted.current) {
      return;
    }
    attempted.current = true;

    loginWithTelegramAction(webApp.initData).then((result) => {
      if (result.ok) {
        router.replace(routeForStartParam(result.startParam));
      } else {
        setError(result.message);
      }
    });
  }, [isTelegram, router]);

  if (isTelegram && !error) {
    return <main className="flex flex-1" />;
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {heroLine1}
        <br />
        {heroLine2}
      </h1>
      <p className="max-w-md text-muted-foreground">{subtitle}</p>
    </main>
  );
}
