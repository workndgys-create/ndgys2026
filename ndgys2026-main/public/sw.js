const CACHE = "ndgys-v1";
const SHELL = ["/", "/dashboard", "/dashboard/ticket", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The delegate ticket + QR: cache-first so it opens offline at the venue.
  const cacheFirst = url.pathname === "/dashboard/ticket" || url.pathname === "/api/delegate/ticket" || url.pathname.startsWith("/api/delegate/calendar");
  if (cacheFirst) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => hit)
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  e.respondWith(
    fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req))
  );
});
