const CACHE_NAME = 'rotmg-stash-cache-v2';
const TRACE_FETCH = true;

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
      console.log('[Service Worker][install] start');

      try {
        const response = await fetch('/assets-config.json');
        const cfg = response.ok ? await response.json() : null;
        ASSETS_BASE_URL = cfg?.ASSETS_BASE_URL || DEFAULT_ASSETS_BASE_URL;
        console.log('[Service Worker][install] loaded assets config', {
          responseOk: response.ok,
          assetsBaseUrl: ASSETS_BASE_URL
        });
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
      console.log('[Service Worker][install] cache warm-up complete', {
        cacheName: CACHE_NAME,
        count: CACHE_URLS.length
      });
      await self.skipWaiting();
      console.log('[Service Worker][install] skipWaiting complete');
    })()
  );
});

// Fetch event: Prefer network for fresh data, fallback to cache when offline
self.addEventListener('fetch', (event) => {
  const shouldHandle = CACHE_URLS.some((url) => event.request.url.includes(url));

  if (
    TRACE_FETCH &&
    (event.request.url.includes('sheets.json') ||
      event.request.url.includes('constants.json') ||
      event.request.url.includes('renders.png'))
  ) {
    console.log('[Service Worker][fetch] request observed', {
      url: event.request.url,
      shouldHandle,
      cacheUrls: CACHE_URLS
    });
  }

  if (shouldHandle) {
    console.log('[Service Worker][fetch] intercepted asset request', {
      url: event.request.url,
      method: event.request.method,
      destination: event.request.destination || 'unknown'
    });

    event.respondWith(
      (async () => {
        try {
          console.log('[Service Worker][fetch] trying network first', event.request.url);
          const networkResponse = await fetch(event.request);
          console.log('[Service Worker][fetch] network response received', {
            url: event.request.url,
            ok: networkResponse?.ok,
            status: networkResponse?.status,
            type: networkResponse?.type
          });

          const isCacheableResponse =
            !!networkResponse && (networkResponse.ok || networkResponse.type === 'opaque');

          if (isCacheableResponse) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
            console.log('[Service Worker] Cache updated for:', event.request.url, {
              status: networkResponse.status,
              type: networkResponse.type
            });
          } else {
            console.warn('[Service Worker][fetch] network response not cached', {
              url: event.request.url,
              status: networkResponse?.status,
              type: networkResponse?.type
            });
          }

          return networkResponse;
        } catch (error) {
          console.warn('[Service Worker] Network fetch failed, serving cache if available:', error);
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('[Service Worker][fetch] cache hit fallback', event.request.url);
            return cachedResponse;
          }

          console.warn('[Service Worker][fetch] cache miss fallback', event.request.url);
          throw error;
        }
      })()
    );
  }
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      console.log('[Service Worker][activate] start', { cacheName: CACHE_NAME });
      const cacheNames = await caches.keys();
      console.log('[Service Worker][activate] existing caches', cacheNames);
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      await self.clients.claim();
      console.log('[Service Worker][activate] clients claimed');
    })()
  );
});
