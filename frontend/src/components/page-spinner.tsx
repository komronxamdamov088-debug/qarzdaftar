import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

// Rendered as the Suspense fallback by every route's loading.tsx (Next.js
// App Router convention) — without this, a page whose own data fetch takes
// a while showed nothing at all in between navigation and content, which
// reads as the app being unresponsive/broken rather than merely loading.
export async function PageSpinner() {
  const dict = getDictionary(await getLocale());
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary"
        role="status"
        aria-label={dict.common.loading}
      />
      <p className="text-sm text-muted-foreground">{dict.common.loading}</p>
    </div>
  );
}
