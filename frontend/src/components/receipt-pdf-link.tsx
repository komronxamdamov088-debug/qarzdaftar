"use client";

export function ReceiptPdfLink({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      // Not inside the Mini App — a plain new-tab download works fine.
      return;
    }
    // Inside Telegram's WebView, target="_blank" often can't open/download a
    // file reliably — WebApp.openLink() is Telegram's documented way to
    // hand a URL off to the device's real browser instead.
    event.preventDefault();
    webApp.openLink(url);
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="font-medium text-primary"
    >
      {label}
    </a>
  );
}
