import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { formatSom } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";

// Only surfaces when a shop actually has an active, still-current discount —
// a plain price with 0% discount isn't a promotion (and for personal
// accounts, which have no subscription at all). Also requires
// subscription_valid_until to still be in the future: a self-serve 2-month
// plan's discount is only meant to advertise "discount for these 2 months",
// not forever — once valid_until passes, the banner stops on its own without
// needing a separate cron to clear the discount field.
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
  if (
    !user.subscription_valid_until ||
    new Date(user.subscription_valid_until) < new Date()
  ) {
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
