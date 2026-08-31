"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { updateUserRoleAction } from "./actions";
import type { AdminUserSummary } from "@/lib/types";

export function RoleToggleButton({
  userId,
  role,
  disabled,
  onUpdate,
}: {
  userId: string;
  role: "user" | "admin";
  disabled?: boolean;
  onUpdate: (user: AdminUserSummary) => void;
}) {
  const { dict } = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextRole = role === "admin" ? "user" : "admin";

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, nextRole);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onUpdate(result.user);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || isPending}
        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap disabled:opacity-50"
      >
        {isPending
          ? dict.common.saving
          : role === "admin"
            ? dict.admin.demote
            : dict.admin.promote}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
