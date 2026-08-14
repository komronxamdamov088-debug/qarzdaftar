import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";

const NAV_ITEMS = [
  { href: "/admin", label: "Boshqaruv paneli" },
  { href: "/admin/users", label: "Foydalanuvchilar" },
  { href: "/admin/reports", label: "Hisobotlar" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  let user;
  try {
    user = await getCurrentUser(token);
  } catch (error) {
    return error instanceof ApiError && error.status === 401 ? (
      <SignInRequired />
    ) : (
      <ErrorState />
    );
  }

  // Real enforcement is server-side in NestJS (RolesGuard + @Roles('admin') on
  // every /admin/* route, CLAUDE.md section 8/32) — this is UX only, so an
  // admin never sees the panel chrome around a 403 the API would still return.
  if (user.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h2 className="text-lg font-semibold">Ruxsat yo&apos;q</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bu bo&apos;lim faqat administratorlar uchun.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-black/5 bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <span className="text-lg font-semibold">QarzDaftar Admin</span>
          <nav className="flex items-center gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground"
            >
              Profil
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
