"use client";

import { useState, useTransition } from "react";
import { extractApiErrorMessage } from "@/lib/api";
import { confirmPublicDebt } from "@/lib/debts-api";
import type { ConfirmationStatus } from "@/lib/types";
import { useTranslations } from "@/i18n/locale-context";

export function ConfirmActions({
  token,
  confirmationStatus,
}: {
  token: string;
  confirmationStatus: ConfirmationStatus;
}) {
  const { dict } = useTranslations();
  const [status, setStatus] = useState<ConfirmationStatus>(confirmationStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status === "confirmed") {
    return (
      <p className="text-sm font-medium text-success">
        {dict.confirmActions.confirmed}
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <p className="text-sm font-medium text-danger">
        {dict.confirmActions.rejected}
      </p>
    );
  }

  function act(action: "confirm" | "reject") {
    setError(null);
    startTransition(async () => {
      try {
        await confirmPublicDebt(token, action);
        setStatus(action === "confirm" ? "confirmed" : "rejected");
      } catch (err) {
        setError(
          extractApiErrorMessage(
            err,
            dict.confirmActions.genericError,
            dict.apiErrors,
          ),
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => act("confirm")}
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {dict.confirmActions.confirm}
        </button>
        <button
          type="button"
          onClick={() => act("reject")}
          disabled={isPending}
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {dict.confirmActions.reject}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
