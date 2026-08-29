import { listAdminUsers } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { formatDate } from "@/lib/format";
import type { AdminUserSummary, CurrentUser } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { RoleToggleButton } from "./role-toggle-button";
import { BusinessStatusControl } from "./business-status-control";

async function loadUsers(
  token: string,
  search: string | undefined,
): Promise<
  | { ok: true; users: AdminUserSummary[]; currentUser: CurrentUser }
  | { ok: false }
> {
  try {
    const [users, currentUser] = await Promise.all([
      search
        ? listAdminUsers(token, { search })
        : listAdminUsers(token, { accountType: "business" }),
      getCurrentUser(token),
    ]);
    return { ok: true, users, currentUser };
  } catch {
    return { ok: false };
  }
}

export default async function AdminUsersPage(
  props: PageProps<"/admin/users">,
) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <ErrorState message={dict.admin.signInRequired} />;
  }

  const { q } = await props.searchParams;
  const search = typeof q === "string" && q.trim() ? q.trim() : undefined;

  const result = await loadUsers(token, search);
  if (!result.ok) {
    return <ErrorState />;
  }

  const { users, currentUser } = result;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {search ? dict.admin.searchButton : dict.admin.usersTitle}
      </h1>

      <div className="flex flex-col gap-2">
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={search ?? ""}
            placeholder={dict.admin.searchPlaceholder}
            className="w-full max-w-sm rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            {dict.admin.searchButton}
          </button>
          {search && (
            <a
              href="/admin/users"
              className="flex items-center rounded-lg border border-black/10 px-4 py-2 text-sm font-medium"
            >
              {dict.admin.clearSearch}
            </a>
          )}
        </form>
        {!search && (
          <p className="text-xs text-muted-foreground">
            {dict.admin.searchHint}
          </p>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search ? dict.admin.noSearchResults : dict.admin.noBusinessAccounts}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">{dict.admin.tableName}</th>
                <th className="px-4 py-3 font-medium">
                  {dict.admin.tablePhone}
                </th>
                <th className="px-4 py-3 font-medium">
                  {dict.admin.tableTelegram}
                </th>
                <th className="px-4 py-3 font-medium">{dict.admin.tableRole}</th>
                <th className="px-4 py-3 font-medium">
                  {dict.admin.tableCreatedAt}
                </th>
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    {user.accountType === "business" ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.businessName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.name}
                        </span>
                      </div>
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.telegramUsername
                      ? `@${user.telegramUsername}`
                      : user.telegramConnected
                        ? dict.admin.telegramConnected
                        : dict.admin.telegramNotConnected}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "admin"
                      ? dict.admin.roleAdmin
                      : dict.admin.roleUser}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <RoleToggleButton
                      userId={user.id}
                      role={user.role}
                      disabled={user.id === currentUser.id}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <BusinessStatusControl user={user} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
