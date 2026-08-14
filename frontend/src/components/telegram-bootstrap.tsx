"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginWithTelegramAction } from "@/lib/telegram-auth";

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
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return null;
}
