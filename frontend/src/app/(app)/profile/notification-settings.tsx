"use client";

import { useEffect, useState, useTransition } from "react";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
  updateNotificationPreferencesAction,
} from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function NotificationSettings({
  pushEnabled,
  telegramEnabled,
}: {
  pushEnabled: boolean;
  telegramEnabled: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      const isSupported =
        "serviceWorker" in navigator && "PushManager" in window;
      if (cancelled) return;
      setSupported(isSupported);
      if (!isSupported) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled) {
        setSubscribed(!!subscription);
      }
    }

    checkSupport();
    return () => {
      cancelled = true;
    };
  }, []);

  function enablePush() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Bildirishnoma ruxsati berilmadi.");
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setError("Push bildirishnoma hali sozlanmagan.");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setError("Obuna ma'lumotlari to'liq emas.");
          return;
        }

        const result = await subscribeToPushAction({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setSubscribed(true);
      } catch {
        setError("Push bildirishnomani yoqishda xatolik yuz berdi.");
      }
    });
  }

  function disablePush() {
    setError(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await unsubscribeFromPushAction(endpoint);
        }
        setSubscribed(false);
      } catch {
        setError("O'chirishda xatolik yuz berdi.");
      }
    });
  }

  function togglePreference(
    key: "pushEnabled" | "telegramEnabled",
    value: boolean,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        [key]: value,
      });
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">
        Bildirishnomalar
      </h2>

      {supported ? (
        <div className="flex items-center justify-between text-sm">
          <span>Ushbu qurilmada push bildirishnoma</span>
          {subscribed ? (
            <button
              type="button"
              onClick={disablePush}
              disabled={isPending}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
            >
              O&apos;chirish
            </button>
          ) : (
            <button
              type="button"
              onClick={enablePush}
              disabled={isPending}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              Yoqish
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ushbu qurilma/brauzer push bildirishnomalarni qo&apos;llab-quvvatlamaydi.
        </p>
      )}

      <label className="flex items-center justify-between text-sm">
        Web Push orqali eslatmalar
        <input
          type="checkbox"
          defaultChecked={pushEnabled}
          disabled={isPending}
          onChange={(event) =>
            togglePreference("pushEnabled", event.target.checked)
          }
        />
      </label>

      <label className="flex items-center justify-between text-sm">
        Telegram orqali eslatmalar
        <input
          type="checkbox"
          defaultChecked={telegramEnabled}
          disabled={isPending}
          onChange={(event) =>
            togglePreference("telegramEnabled", event.target.checked)
          }
        />
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}
    </section>
  );
}
