"use client";

import { useEffect, useRef } from "react";
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

export function TelegramBootstrap() {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.initData || attempted.current) {
      return;
    }
    attempted.current = true;

    loginWithTelegramAction(webApp.initData).then((result) => {
      if (result.ok) {
        router.replace(routeForStartParam(result.startParam));
      }
    });
  }, [router]);

  return null;
}
