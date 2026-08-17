"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/i18n/locale-context";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useTranslations();

  const navItems: { href: string; label: string; isAction?: boolean }[] = [
    { href: "/dashboard", label: dict.nav.home },
    { href: "/debts", label: dict.nav.debts },
    { href: "/debts/new", label: "+", isAction: true },
    { href: "/activity", label: dict.nav.activity },
    { href: "/profile", label: dict.nav.profile },
  ];

  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/5 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[max(0px,env(safe-area-inset-bottom))]">
      <ul className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          if (item.isAction) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={dict.nav.addDebt}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white shadow-md shadow-primary/30"
                >
                  +
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-1 text-xs ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
