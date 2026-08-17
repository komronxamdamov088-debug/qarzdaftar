import type { PaymentProviderName } from "@/lib/types";

// Simple brand-colored initial badges (not a reproduction of each
// provider's official logo/wordmark, which we don't have licensed assets
// for) — enough for a user to recognize Click/Payme/Qulay Pay at a glance
// in the payment-method picker.
const PROVIDER_STYLE: Record<
  PaymentProviderName,
  { background: string; letter: string }
> = {
  click: { background: "#0079FF", letter: "C" },
  payme: { background: "#00CDBA", letter: "P" },
  qulay_pay: { background: "#FF7A00", letter: "Q" },
};

export function PaymentProviderIcon({
  provider,
  size = 20,
}: {
  provider: PaymentProviderName;
  size?: number;
}) {
  const { background, letter } = PROVIDER_STYLE[provider];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * 0.55,
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  );
}
