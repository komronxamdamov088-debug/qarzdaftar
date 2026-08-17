export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
  };
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  onEvent: (eventType: "themeChanged", callback: () => void) => void;
  offEvent: (eventType: "themeChanged", callback: () => void) => void;
  // Opens a URL in the device's system/default browser rather than
  // Telegram's own WebView — needed for anything a plain <a target="_blank">
  // can't reliably do inside the Mini App sandbox (e.g. downloading a PDF).
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export {};
