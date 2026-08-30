"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/i18n/locale-context";

// useLinkStatus must be read from a component nested *inside* the Link it
// reports on. Without this, tapping a nav item showed zero visual change
// until the next page's data finished loading (which can take a while on
// this app's free-tier backend) — indistinguishable from the tap not having
// registered at all. Dimming the item the instant it's pending gives
// immediate feedback regardless of how long the actual navigation takes.
function NavLinkContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`transition-opacity ${pending ? "opacity-40" : "opacity-100"} ${className}`}
    >
      {children}
    </span>
  );
}

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
    <nav className="sticky bottom-0 z-10 border-t border-black/5 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[max(0px,env(safe-area-inset-bottom),var(--tg-safe-area-bottom))]">
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
                  <NavLinkContent>+</NavLinkContent>
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
                <NavLinkContent>{item.label}</NavLinkContent>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
