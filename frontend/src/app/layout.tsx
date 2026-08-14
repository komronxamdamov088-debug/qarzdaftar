import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { TelegramThemeSync } from "@/components/telegram-theme-sync";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <ServiceWorkerRegistration />
        <TelegramThemeSync />
        {children}
      </body>
    </html>
  );
}
