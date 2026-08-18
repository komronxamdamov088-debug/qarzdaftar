"use client";

import { useEffect } from "react";
import type { TelegramSafeAreaInset } from "@/types/telegram";

function applyInset(prefix: string, inset: TelegramSafeAreaInset) {
  const root = document.documentElement;
  root.style.setProperty(`--tg-${prefix}-top`, `${inset.top}px`);
  root.style.setProperty(`--tg-${prefix}-bottom`, `${inset.bottom}px`);
  root.style.setProperty(`--tg-${prefix}-left`, `${inset.left}px`);
  root.style.setProperty(`--tg-${prefix}-right`, `${inset.right}px`);
}

export function TelegramSafeAreaSync() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    const sync = () => {
      if (webApp.safeAreaInset) {
        applyInset("safe-area", webApp.safeAreaInset);
      }
      if (webApp.contentSafeAreaInset) {
        applyInset("content-safe-area", webApp.contentSafeAreaInset);
      }
    };

    sync();
    webApp.onEvent("safeAreaChanged", sync);
    webApp.onEvent("contentSafeAreaChanged", sync);
    return () => {
      webApp.offEvent("safeAreaChanged", sync);
      webApp.offEvent("contentSafeAreaChanged", sync);
    };
  }, []);

  return null;
}
