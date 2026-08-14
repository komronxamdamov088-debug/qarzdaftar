import { listAdminUsers } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { formatDate } from "@/lib/format";
import type { AdminUserSummary, CurrentUser } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { RoleToggleButton } from "./role-toggle-button";

async function loadUsers(
  token: string,
): Promise<
  | { ok: true; users: AdminUserSummary[]; currentUser: CurrentUser }
  | { ok: false }
> {
  try {
    const [users, currentUser] = await Promise.all([
      listAdminUsers(token),
      getCurrentUser(token),
    ]);
    return { ok: true, users, currentUser };
  } catch {
    return { ok: false };
  }
}

export default async function AdminUsersPage() {
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message="Tizimga kirish talab qilinadi." />;
  }

  const result = await loadUsers(token);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { users, currentUser } = result;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Foydalanuvchilar</h1>

      <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ism</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Telegram</th>
              <th className="px-4 py-3 font-medium">Ro&apos;yxatdan o&apos;tgan</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.phone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {user.role === "admin" ? "Admin" : "Foydalanuvchi"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.telegramConnected ? "Ulangan" : "Ulanmagan"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <RoleToggleButton
                    userId={user.id}
                    role={user.role}
                    disabled={user.id === currentUser.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
