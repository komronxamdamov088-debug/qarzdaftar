import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

export async function SignInRequired() {
  const dict = getDictionary(await getLocale());
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-lg font-semibold">{dict.signInRequired.title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {dict.signInRequired.description}
      </p>
    </div>
  );
}
