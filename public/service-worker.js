const CACHE_NAME = 'rotmg-stash-cache-v1';
const CACHE_URLS = [
  'https://rotmgstash.pages.dev/renders-april-fools.png',
  'https://rotmgstash.pages.dev/renders.png',
  'https://rotmgstash.pages.dev/items.json',
  'https://rotmgstash.pages.dev/april-fools-items.json'
];

// Install event: Cache the images and JSON files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching resources during install');
      return cache.addAll(CACHE_URLS);
    })
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
