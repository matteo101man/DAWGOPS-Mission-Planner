const CACHE_NAME = 'planner-cache-v2';
const ASSETS = [
  './',
  './app.html',
  './index.html',
  './manifest.webmanifest',
  './public/js/app-core.js',
  './symbols/index.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Always try network first for critical changing assets
  const networkFirst = (
    url.pathname.endsWith('/symbols/index.json') ||
    url.pathname.endsWith('/public/js/app-core.js') ||
    url.searchParams.get('v') === 'debug'
  );

  if (networkFirst) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const copy = fresh.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, copy);
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});


