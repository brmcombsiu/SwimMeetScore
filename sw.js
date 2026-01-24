// SwimMeetScore Service Worker
const CACHE_NAME = 'swimmeetscore-v5';

// Files to cache for offline use
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon16x16.png',
  './favicon32x32.png',
  './favicon192x192.png',
  './favicon512x512.png',
  './apple-touch-icon.png'
];

// External CDN resources to cache
const CDN_CACHE = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
  'https://cdn.tailwindcss.com'
];

// Install event - cache all static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SwimMeetScore: Caching app files for offline use');
        // Cache local files first
        return cache.addAll(CACHE_FILES)
          .then(() => {
            // Try to cache CDN resources (don't fail if these fail)
            return Promise.allSettled(
              CDN_CACHE.map(url => 
                fetch(url, { mode: 'cors' })
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                  })
                  .catch(() => {
                    console.log('SwimMeetScore: Could not cache CDN resource:', url);
                  })
              )
            );
          });
      })
      .then(() => {
        // Activate immediately without waiting
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versions of our cache
            if (cacheName !== CACHE_NAME && cacheName.startsWith('swimmeetscore-')) {
              console.log('SwimMeetScore: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip Google Analytics and Clarity
  if (url.hostname.includes('google') || url.hostname.includes('clarity')) {
    return;
  }

  // For CDN resources and local files, try cache first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Also fetch from network to update cache in background (for local files only)
          if (url.origin === location.origin) {
            fetchAndCache(event.request);
          }
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Helper function to fetch and update cache
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // Don't cache bad responses
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone the response since it can only be consumed once
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseToCache);
        });

      return response;
    });
}
