"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { updateAccessOverrideAction } from "./actions";
import type { AdminUserSummary } from "@/lib/types";

// Grants/revokes access_override — the manual exemption that lets a user
// keep using the app without being a business with an active subscription.
// Its main use is a pre-existing personal account (real friends/family who
// were already using the app before it became shop-only), but it works for
// any account.
export function AccessOverrideToggle({
  userId,
  active,
  onUpdate,
}: {
  userId: string;
  active: boolean;
  onUpdate: (user: AdminUserSummary) => void;
}) {
  const { dict } = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await updateAccessOverrideAction(userId, !active);
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
        disabled={isPending}
        title={dict.admin.accessOverrideHint}
        className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap disabled:opacity-50 ${
          active
            ? "border-success/30 bg-success/10 text-success"
            : "border-black/10"
        }`}
      >
        {isPending
          ? dict.common.saving
          : active
            ? dict.admin.accessOverrideRevoke
            : dict.admin.accessOverrideGrant}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
