import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { TelegramThemeSync } from "@/components/telegram-theme-sync";
import { TelegramSafeAreaSync } from "@/components/telegram-safe-area-sync";
import { getLocale } from "@/i18n/get-locale";
import { LocaleProvider } from "@/i18n/locale-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QarzDaftar",
  description:
    "Qarz unutilmaydi. Munosabat buzilmaydi. Shaxsiy qarzlaringizni oddiy va qulay boshqaring.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QarzDaftar",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <ServiceWorkerRegistration />
        <TelegramThemeSync />
        <TelegramSafeAreaSync />
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
