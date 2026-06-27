/* Certavo service worker — minimal offline shell cache.
 * Network-first for navigations (always fresh app/code), cache-first only for
 * hashed static assets. Bump CACHE to invalidate everything. */
const CACHE = 'certavo-v3';
const SHELL = ['/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r || caches.match('/')),
      ),
    );
    return;
  }

  // Cache-first ONLY for immutable, content-hashed assets — everything else
  // (HTML, API, OG, etc.) is network-first so a deploy is never served stale.
  const immutable =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/flags/');

  if (immutable) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
