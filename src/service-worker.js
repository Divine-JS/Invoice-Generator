const CACHE_NAME = 'invoice-generator-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/landing.html',
  '/assets/css/styles.css',
  '/assets/css/landing.css',
  '/assets/css/dashboard.css',
  '/assets/css/invoice.css',
  '/assets/css/loading.css',
  '/assets/js/dashboard.js',
  '/assets/js/invoice.js',
  '/assets/js/invoice-history.js',
  '/assets/js/loading.js',
  '/assets/js/navigation.js',
  '/assets/js/notifications.js',
  '/assets/js/pdfGenerator.js',
  '/assets/js/printer.js',
  '/assets/js/themeManager.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});