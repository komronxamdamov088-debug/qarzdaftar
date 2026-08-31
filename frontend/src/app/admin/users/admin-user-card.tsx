"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { formatDate } from "@/lib/format";
import type { AdminUserSummary } from "@/lib/types";
import type { Locale } from "@/i18n/locale";
import { RoleToggleButton } from "./role-toggle-button";
import { BusinessStatusControl } from "./business-status-control";
import { AccessOverrideToggle } from "./access-override-toggle";

export function AdminUserCard({
  initialUser,
  locale,
  isCurrentUser,
}: {
  initialUser: AdminUserSummary;
  locale: Locale;
  isCurrentUser: boolean;
}) {
  const { dict } = useTranslations();
  const [user, setUser] = useState(initialUser);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
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
          {user.role === "admin" ? dict.admin.roleAdmin : dict.admin.roleUser}
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
        {user.cashPaymentRequestedAt && (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
            {dict.admin.cashPaymentRequested}{" "}
            {formatDate(user.cashPaymentRequestedAt, locale)}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="flex flex-wrap items-start gap-2">
          <RoleToggleButton
            userId={user.id}
            role={user.role}
            disabled={isCurrentUser}
            onUpdate={setUser}
          />
          <AccessOverrideToggle
            userId={user.id}
            active={user.accessOverride}
            onUpdate={setUser}
          />
        </div>
        <BusinessStatusControl user={user} locale={locale} onUpdate={setUser} />
      </div>
    </div>
  );
}
