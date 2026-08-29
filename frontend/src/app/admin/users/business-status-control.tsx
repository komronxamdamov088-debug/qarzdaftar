"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import type { AdminUserSummary } from "@/lib/types";
import {
  convertToBusinessAction,
  updateSubscriptionStatusAction,
} from "./actions";

export function BusinessStatusControl({
  user,
}: {
  user: AdminUserSummary;
}) {
  const { dict } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  function convert() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await convertToBusinessAction(user.id, trimmed);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setShowForm(false);
    });
  }

  function toggleSubscription() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubscriptionStatusAction(
        user.id,
        !user.subscriptionActive,
      );
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  if (user.accountType === "business") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-medium">{user.businessName}</span>
        <button
          type="button"
          onClick={toggleSubscription}
          disabled={isPending}
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap disabled:opacity-50"
        >
          {user.subscriptionActive
            ? dict.admin.deactivateSubscription
            : dict.admin.activateSubscription}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={dict.admin.businessNamePlaceholder}
          className="w-36 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={convert}
            disabled={isPending || !name.trim()}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {dict.common.save}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isPending}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium"
          >
            {dict.common.cancel}
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap"
    >
      {dict.admin.convertToBusiness}
    </button>
  );
}
