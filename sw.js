const CACHE_NAME = "india-tempmail-shell-v2";
const APP_BASE = new URL("./", self.location.href).pathname;
const SHELL = [APP_BASE, `${APP_BASE}manifest.webmanifest`, `${APP_BASE}icon-192.png`, `${APP_BASE}icon-512.png`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("india-tempmail-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache inbox APIs, email contents, or URLs carrying a private inbox token.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith(`${APP_BASE}api/`) ||
    url.searchParams.has("inbox") ||
    !SHELL.includes(url.pathname)
  ) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, response.clone()));
        return response;
      })
      .catch(async () => (await caches.match(url.pathname)) || caches.match(APP_BASE))
  );
});
