const CACHE_NAME = 'offline-image-cache-v1';

// Listen for network requests
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only intercept image files
  if (url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // 1. If it's in our permanent cache, return it instantly (No network needed!)
          if (cachedResponse) {
            return cachedResponse;
          }

          // 2. Otherwise, fetch it from the network, cache it, and return it
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
