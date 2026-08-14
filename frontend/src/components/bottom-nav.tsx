"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: {
  href: string;
  label: string;
  isAction?: boolean;
}[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/debts", label: "Qarzlar" },
  { href: "/debts/new", label: "+", isAction: true },
  { href: "/activity", label: "Activity" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/5 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          if (item.isAction) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label="Qarz qo'shish"
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
