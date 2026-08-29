const CACHE_NAME = "qarzdaftar-shell-v2";
// Only the public landing page is cached — authenticated pages carry private
// financial data and must always be fetched fresh (CLAUDE.md section 21).
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!SHELL_URLS.includes(url.pathname)) return;

  // Network-first, cache as a fallback for offline use only. The previous
  // cache-first strategy served the shell's very first cached response
  // forever — including the Telegram Mini App's login-bootstrap script on
  // "/" — with no way for a returning user to ever see a newer deploy
  // short of manually clearing site data. That silently broke live login
  // for real users after unrelated deploys and went undetected because
  // build/lint/curl checks never exercise a warm service-worker cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "QarzDaftar", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "QarzDaftar", {
      body: payload.body,
      data: { url: payload.url || "/dashboard" },
      icon: "/icon.svg",
      badge: "/icon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
