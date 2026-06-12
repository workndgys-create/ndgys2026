// Bumped: any device that previously poisoned its cache with a redirected
// /dashboard/ticket response gets a clean cache on next activate.
const CACHE = "ndgys-v2";

// Only cache truly static, non-personalised assets at install time.
// Auth-gated pages (/dashboard, /dashboard/ticket) must NEVER be in this
// list: pre-fetching them before login captures a 307 redirect to the
// login page, and Cache.put() either rejects on a redirected response
// (poisoning the whole addAll) or — worse — stores a response that has
// nothing to do with the eventual logged-in user.
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Only cache a response if it's a "real" same-origin, OK, non-redirected
// response. Anything else (redirects to /dashboard/login, 401/403/5xx,
// opaque responses) must never be written to the cache.
function isCacheable(res) {
  return res && res.ok && !res.redirected && res.type === "basic";
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The delegate ticket + QR: cache-first so it opens offline at the venue,
  // but only ever cache (and serve) a genuinely successful, non-redirected
  // response — never a login redirect or error page.
  const cacheFirst = url.pathname === "/dashboard/ticket" || url.pathname === "/api/delegate/ticket" || url.pathname.startsWith("/api/delegate/calendar");
  if (cacheFirst) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => {
            if (isCacheable(res)) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => hit);
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (isCacheable(res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
