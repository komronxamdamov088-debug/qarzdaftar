import type { PaymentProviderName } from "@/lib/types";

// Brand-toned SVG marks — one consistent visual metaphor per provider,
// rendered at identical size/stroke-weight so the three read as one family.
// These are original glyphs (cursor / card+check / wallet), not a
// reproduction of Click's, Payme's, or Qulay Pay's actual trademarked
// logos — we don't have licensed brand assets, and precisely recreating a
// registered mark isn't something to do without permission. Colors are
// tuned close to each brand's real palette so the icon still reads as
// "that provider" at a glance.
const PROVIDER_STYLE: Record<PaymentProviderName, { background: string }> = {
  click: { background: "#0079FF" },
  payme: { background: "#00C4B3" },
  qulay_pay: { background: "#FF7A1A" },
};

function ClickGlyph() {
  return (
    <path
      d="M8 3.5v3M8 12.5v-1M3.5 8h1M12.5 8h-.5M5.3 5.3l.7.7M10.7 10.7l-.5-.5M5.3 10.7l.7-.7M11 5l-3.2 8-1.3-3.5L3 8.7 11 5Z"
      fill="none"
      stroke="white"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function PaymeGlyph() {
  return (
    <>
      <rect
        x="2.5"
        y="4"
        width="11"
        height="8"
        rx="1.6"
        fill="none"
        stroke="white"
        strokeWidth="1.1"
      />
      <path d="M2.5 6.7h11" stroke="white" strokeWidth="1.1" />
      <path
        d="M5 9.6l1.1 1.1L8.4 8.4"
        fill="none"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function QulayPayGlyph() {
  return (
    <>
      <path
        d="M2.8 4.6c0-.66.54-1.2 1.2-1.2h6.4c.66 0 1.2.54 1.2 1.2v.7H4c-.66 0-1.2.54-1.2 1.2v4.9c0 .66.54 1.2 1.2 1.2h7.6c.66 0 1.2-.54 1.2-1.2v-4.9"
        fill="none"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.6" cy="8.6" r="0.9" fill="white" />
    </>
  );
}

const GLYPHS: Record<PaymentProviderName, () => React.JSX.Element> = {
  click: ClickGlyph,
  payme: PaymeGlyph,
  qulay_pay: QulayPayGlyph,
};

export function PaymentProviderIcon({
  provider,
  size = 20,
}: {
  provider: PaymentProviderName;
  size?: number;
}) {
  const { background } = PROVIDER_STYLE[provider];
  const Glyph = GLYPHS[provider];

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size * 0.6}
        height={size * 0.6}
        aria-hidden="true"
      >
        <Glyph />
      </svg>
    </span>
  );
}
