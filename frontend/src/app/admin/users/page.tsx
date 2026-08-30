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
import { AccessOverrideToggle } from "./access-override-toggle";

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
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                {user.accountType === "business" ? (
                  <span className="text-sm font-semibold">
                    {user.businessName}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {user.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{user.name}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {dict.admin.tablePhone}: {user.phone ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dict.admin.tableTelegram}:{" "}
                  {user.telegramUsername
                    ? `@${user.telegramUsername}`
                    : user.telegramConnected
                      ? dict.admin.telegramConnected
                      : dict.admin.telegramNotConnected}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.role === "admin"
                    ? dict.admin.roleAdmin
                    : dict.admin.roleUser}
                  {" · "}
                  {formatDate(user.createdAt, locale)}
                  {user.accessOverride && (
                    <>
                      {" · "}
                      <span className="text-success">
                        {dict.admin.accessOverrideActive}
                      </span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="flex flex-wrap items-start gap-2">
                  <RoleToggleButton
                    userId={user.id}
                    role={user.role}
                    disabled={user.id === currentUser.id}
                  />
                  <AccessOverrideToggle
                    userId={user.id}
                    active={user.accessOverride}
                  />
                </div>
                <BusinessStatusControl user={user} locale={locale} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
