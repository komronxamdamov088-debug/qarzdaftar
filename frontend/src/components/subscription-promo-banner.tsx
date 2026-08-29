import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { formatSom } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";

// Only surfaces when a shop actually has an active discount — a plain price
// with 0% discount isn't a promotion, so this renders nothing in that case
// (and for personal accounts, which have no subscription at all).
export async function SubscriptionPromoBanner({
  user,
}: {
  user: CurrentUser;
}) {
  if (user.account_type !== "business") {
    return null;
  }

  const discountPercent = Number(user.subscription_discount_percent);
  if (!(discountPercent > 0)) {
    return null;
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const price = Number(user.subscription_price);
  const effectivePrice = price * (1 - discountPercent / 100);

  return (
    <section className="flex items-center gap-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3.5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-bold text-white">
        -{discountPercent}%
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{dict.promoBanner.title}</span>
        <span className="text-xs text-muted-foreground">
          <span className="line-through">{formatSom(price, locale)}</span>{" "}
          <span className="font-medium text-foreground">
            {formatSom(effectivePrice, locale)}
          </span>{" "}
          {dict.promoBanner.perMonth}
        </span>
      </div>
    </section>
  );
}
