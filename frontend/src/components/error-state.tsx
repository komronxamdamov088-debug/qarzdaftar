import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export async function ErrorState({ message }: { message?: string }) {
  const dict = getDictionary(await getLocale());
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-lg font-semibold text-danger">{dict.errorState.title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? dict.errorState.defaultMessage}
      </p>
    </div>
  );
}
