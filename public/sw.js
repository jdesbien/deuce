/**
 * Cards4Couples service worker.
 *
 * Strategy:
 *  - Precache the shell + every game's rules and scoreboard HTML so the
 *    library works with no signal (rules read fine even before JS loads).
 *  - Navigations: network-first, falling back to cache, then /offline.
 *  - Static assets (_next/static, images, fonts): cache-first.
 *  - Never touches non-GET, cross-origin (Supabase), /api, /auth, /admin.
 *
 * Bump VERSION when the game list changes (a deploy alone re-precaches
 * because the SW byte-diff triggers an update).
 */
const VERSION = "c4c-v1";
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;

const GAME_SLUGS = [
  "gin-rummy",
  "cribbage-six-card",
  "spite-and-malice",
  "escoba",
  "cuttle",
  "schnapsen",
  "sedma",
  "twenty",
  "james-bond",
  "porrazo",
  "yaniv",
  "durak-perevodnoy",
  "oceans-eleven",
  "panjpar",
  "casino-swazi",
  "all-fives",
  "go-stop",
  "tartli",
  "clobyosh",
  "piquet",
];

const PRECACHE_URLS = [
  "/",
  "/games",
  "/offline",
  ...GAME_SLUGS.map((slug) => `/games/${slug}`),
  ...GAME_SLUGS.map((slug) => `/play/${slug}`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const BYPASS_PREFIXES = ["/api/", "/auth/", "/admin"];

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return;
  }

  // Page navigations: fresh when online, cached when not.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(PAGE_CACHE)
            .then((cache) => cache.put(url.pathname, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(url.pathname)
            .then((cached) => cached ?? caches.match("/offline"))
            .then(
              (cached) =>
                cached ??
                new Response("Offline", {
                  status: 503,
                  headers: { "Content-Type": "text/plain" },
                }),
            ),
        ),
    );
    return;
  }

  // Hashed build assets, images, fonts: cache-first.
  const isStaticAsset =
    url.pathname.startsWith("/_next/") ||
    /\.(css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(ASSET_CACHE)
                .then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
