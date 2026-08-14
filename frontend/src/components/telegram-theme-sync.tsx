"use client";

import { useEffect } from "react";
import type { TelegramThemeParams } from "@/types/telegram";

const CSS_VAR_MAP: Partial<Record<keyof TelegramThemeParams, string>> = {
  bg_color: "--background",
  text_color: "--foreground",
  secondary_bg_color: "--card",
  hint_color: "--muted-foreground",
  button_color: "--primary",
};

function applyTheme(themeParams: TelegramThemeParams) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as [
    keyof TelegramThemeParams,
    string,
  ][]) {
    const value = themeParams[key];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

export function TelegramThemeSync() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    webApp.ready();
    webApp.expand();
    applyTheme(webApp.themeParams);

    const onThemeChanged = () => applyTheme(webApp.themeParams);
    webApp.onEvent("themeChanged", onThemeChanged);
    return () => webApp.offEvent("themeChanged", onThemeChanged);
  }, []);

  return null;
}
