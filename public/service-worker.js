const CACHE_NAME = 'rotmg-stash-cache-v1';

// Default base url for assets (used as a fallback)
const DEFAULT_ASSETS_BASE_URL = 'https://rotmgstash.pages.dev';

let ASSETS_BASE_URL = DEFAULT_ASSETS_BASE_URL;
let CACHE_URLS = [
  `${ASSETS_BASE_URL}/renders.png`,
  `${ASSETS_BASE_URL}/constants.json`,
  `${ASSETS_BASE_URL}/sheets.json`
];

// Install event: Cache the images and JSON files (read runtime config if available)
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch('/assets-config.json');
        const cfg = response.ok ? await response.json() : null;
        ASSETS_BASE_URL = cfg?.ASSETS_BASE_URL || DEFAULT_ASSETS_BASE_URL;
      } catch (err) {
        // Use default if config isn't reachable
        ASSETS_BASE_URL = DEFAULT_ASSETS_BASE_URL;
        console.warn('[Service Worker] Could not load assets-config.json, using default', err);
      }

      CACHE_URLS = [
        `${ASSETS_BASE_URL}/renders.png`,
        `${ASSETS_BASE_URL}/constants.json`,
        `${ASSETS_BASE_URL}/sheets.json`
      ];
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching resources during install', CACHE_URLS);
      await cache.addAll(CACHE_URLS);
    })()
  );
});

// Fetch event: Serve from cache, then update in the background
self.addEventListener('fetch', (event) => {
  if (CACHE_URLS.some((url) => event.request.url.includes(url))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update the cache with the latest version
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              console.log('[Service Worker] Cache updated for:', event.request.url);
            });
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Network fetch failed:', error);
          });

        // Return cached response immediately, update in the background
        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
