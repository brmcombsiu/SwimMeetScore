// SwimMeetScore Service Worker
const CACHE_NAME = 'swimmeetscore-v18';

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
  './apple-touch-icon.png',
  './app.js',
  './app.css'
];

// External CDN resources to cache
const CDN_CACHE = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
];

// Minimal offline fallback page (used only if cache is completely empty)
const OFFLINE_FALLBACK = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Swim Meet Score</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c1929;color:#e0f7fa;font-family:system-ui,sans-serif;text-align:center}
.c{padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem}p{opacity:.7;margin-bottom:1.5rem}
button{background:#00d4aa;color:#0c1929;border:none;padding:.75rem 1.5rem;border-radius:.5rem;font-size:1rem;cursor:pointer;font-weight:600}</style>
</head><body><div class="c"><h1>Swim Meet Score</h1><p>The app could not load offline.<br>Please connect to the internet and reload.</p>
<button onclick="location.reload()">Reload</button></div></body></html>`;

// Install event - cache all static files (resilient to individual failures)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SwimMeetScore: Caching app files for offline use');
        // Cache files individually so one failure doesn't break everything
        return Promise.allSettled(
          CACHE_FILES.map(url =>
            cache.add(url).catch((err) => {
              console.log('SwimMeetScore: Could not cache:', url, err);
            })
          )
        ).then(() => {
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

  // Skip Google Analytics and Clarity (but allow Google Fonts)
  if ((url.hostname.includes('google') && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) || url.hostname.includes('clarity')) {
    return;
  }

  // Navigation requests (index.html): network-first, with guaranteed fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchAndCache(event.request)
        .catch(() => {
          // Offline — try every possible cache match for the HTML
          return caches.match(event.request, { ignoreSearch: true, ignoreVary: true })
            .then((cached) => cached || caches.match('./index.html', { ignoreVary: true }))
            .then((cached) => cached || caches.match('./', { ignoreVary: true }))
            .then((cached) => {
              // ALWAYS return a response - use synthetic fallback if cache is empty
              return cached || new Response(OFFLINE_FALLBACK, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
        })
    );
    return;
  }

  // App JS/CSS: network-first so refreshes always get the latest version
  if (url.origin === location.origin && (url.pathname.endsWith('/app.js') || url.pathname.endsWith('/app.css'))) {
    event.respondWith(
      fetchAndCache(event.request)
        .catch(() => caches.match(event.request, { ignoreVary: true }))
    );
    return;
  }

  // All other resources (CDN scripts, icons, manifest): cache-first for speed
  event.respondWith(
    caches.match(event.request, { ignoreVary: true })
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background for local files (stale-while-revalidate)
          if (url.origin === location.origin) {
            fetchAndCache(event.request);
          }
          return cachedResponse;
        }
        // Not in cache - fetch from network
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Offline and not in cache - return empty response for non-critical resources
        return new Response('', { status: 408, statusText: 'Offline' });
      })
  );
});

// Helper function to fetch and update cache
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // Don't cache bad responses
      // Allow 'basic' (same-origin) and 'cors' (CDN with CORS headers) responses
      // Block 'opaque' responses since we can't verify their status
      if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
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
