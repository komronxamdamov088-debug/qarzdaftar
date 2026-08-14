import { ApiError } from "@/lib/api";
import { getPublicDebt } from "@/lib/debts-api";
import { formatDate, formatSom } from "@/lib/format";
import type { PublicDebtView } from "@/lib/types";
import { ErrorState } from "@/components/error-state";
import { ConfirmActions } from "./confirm-actions";

async function loadPublicDebt(
  token: string,
): Promise<
  { ok: true; debt: PublicDebtView } | { ok: false; notFound: boolean }
> {
  try {
    const debt = await getPublicDebt(token);
    return { ok: true, debt };
  } catch (error) {
    return {
      ok: false,
      notFound: error instanceof ApiError && error.status === 404,
    };
  }
}

export default async function ConfirmPage(
  props: PageProps<"/confirm/[token]">,
) {
  const { token } = await props.params;
  const result = await loadPublicDebt(token);

  if (!result.ok) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background">
        <ErrorState
          message={
            result.notFound
              ? "Havola yaroqsiz yoki muddati o'tgan."
              : undefined
          }
        />
      </main>
    );
  }

  const { debt } = result;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">
          {debt.lender.name} {debt.borrower.name}ga {formatSom(debt.amount)}{" "}
          qarz berdi.
        </h1>
        {debt.due_date && (
          <p className="text-sm text-muted-foreground">
            Qaytarish sanasi: {formatDate(debt.due_date)}
          </p>
        )}
        {debt.note && (
          <p className="text-sm text-muted-foreground">{debt.note}</p>
        )}
      </div>

      <ConfirmActions
        token={token}
        confirmationStatus={debt.confirmation_status}
      />

      <p className="max-w-xs text-xs text-muted-foreground">
        Bu ikki tomon o&apos;rtasidagi raqamli yozuv. QarzDaftar buni
        avtomatik yuridik shartnoma deb hisoblamaydi.
      </p>
    </main>
  );
}
