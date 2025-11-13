// Use timestamp-based cache name that changes on each deploy
// This ensures cache is always reset when new version is deployed
const CACHE_VERSION = 'v' + Date.now();
const CACHE_NAME = 'planner-cache-' + CACHE_VERSION;

self.addEventListener('install', (event) => {
  // Force activation of new service worker immediately
  self.skipWaiting();
  // Don't cache anything on install - always fetch fresh
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((keys) => 
        Promise.all(keys.map((k) => caches.delete(k)))
      ),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first strategy for everything - always try network first
  event.respondWith((async () => {
    try {
      // Always fetch from network with no-cache headers
      const networkResponse = await fetch(req, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      // Update cache in background (don't wait for it)
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, networkResponse.clone()).catch(() => {});
      }
      
      return networkResponse;
    } catch (error) {
      // Only use cache if network completely fails
      const cached = await caches.match(req);
      if (cached) {
        return cached;
      }
      // If no cache and network fails, return error
      return new Response('Network error and no cache available', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});


