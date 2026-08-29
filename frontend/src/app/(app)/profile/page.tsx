import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/debts-api";
import { getServerToken } from "@/lib/session";
import { formatDate, formatSom } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";
import { SignInRequired } from "@/components/sign-in-required";
import { ErrorState } from "@/components/error-state";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { NotificationSettings } from "./notification-settings";
import { LanguageSwitcher } from "./language-switcher";
import { PhoneEditor } from "./phone-editor";

async function loadUser(
  token: string,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; unauthorized: boolean }> {
  try {
    const user = await getCurrentUser(token);
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      unauthorized: error instanceof ApiError && error.status === 401,
    };
  }
}

export default async function ProfilePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  const result = await loadUser(token);
  if (!result.ok) {
    return result.unauthorized ? <SignInRequired /> : <ErrorState />;
  }

  const { user } = result;
  const discountPercent = Number(user.subscription_discount_percent);
  const effectivePrice =
    Number(user.subscription_price) * (1 - discountPercent / 100);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <PhoneEditor phone={user.phone} />
      </div>

      <Link
        href="/statistics"
        className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm font-medium shadow-sm"
      >
        {dict.profile.statistics}
        <span className="text-muted-foreground">→</span>
      </Link>

      {user.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm font-medium shadow-sm"
        >
          {dict.profile.adminPanel}
          <span className="text-muted-foreground">→</span>
        </Link>
      )}

      {user.account_type === "business" && (
        <section className="rounded-xl bg-card px-4 py-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">
            {dict.profile.subscription.title}
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {dict.profile.subscription.price}
              </dt>
              <dd>{formatSom(user.subscription_price, locale)}</dd>
            </div>
            {discountPercent > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {dict.profile.subscription.discount}
                </dt>
                <dd>{discountPercent}%</dd>
              </div>
            )}
            <div className="flex items-center justify-between font-medium">
              <dt className="text-muted-foreground font-normal">
                {dict.profile.subscription.effectivePrice}
              </dt>
              <dd>{formatSom(effectivePrice, locale)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {dict.profile.subscription.validUntil}
              </dt>
              <dd>
                {user.subscription_valid_until
                  ? formatDate(user.subscription_valid_until, locale)
                  : dict.profile.subscription.noExpiry}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="rounded-xl bg-card px-4 py-4 shadow-sm">
        <LanguageSwitcher />
      </section>

      <NotificationSettings
        pushEnabled={user.push_enabled}
        telegramEnabled={user.telegram_enabled}
      />
    </main>
  );
}
