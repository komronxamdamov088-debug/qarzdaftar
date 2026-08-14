"use client";

import { useState, useTransition } from "react";
import { deleteDebtAction } from "./actions";

export function DeleteDebtButton({ debtId }: { debtId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex-1 rounded-full border border-danger/40 py-2.5 text-sm font-medium text-danger"
      >
        O&apos;chirish
      </button>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-full border border-black/10 py-2 text-xs font-medium"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteDebtAction(debtId);
              if (result && !result.ok) {
                setError(result.message);
              }
            })
          }
          className="flex-1 rounded-full bg-danger py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? "O'chirilmoqda..." : "Tasdiqlash"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
