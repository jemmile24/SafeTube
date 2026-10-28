/**
 * SafeTube Service Worker
 *
 * Implements an offline application shell.
 * Caches static core assets while bypassing YouTube video streams
 * and private credentials.
 */

const CACHE_NAME = 'safetube-v1.0.0';

const APP_SHELL_ASSETS = [
  '/SafeTube/',
  '/SafeTube/index.html',
  '/SafeTube/manifest.webmanifest',
  '/SafeTube/favicon.svg',
  '/SafeTube/icons/icon-192.svg',
  '/SafeTube/icons/icon-512.svg',
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never cache POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never cache YouTube video streams, YouTube iframe API, or googlevideo.com
  if (
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('ytimg.com')
  ) {
    // Pass directly to network
    return;
  }

  // 3. Network-first for Google Sheets API / CSV to ensure catalog freshness
  if (url.hostname.includes('docs.google.com') || url.hostname.includes('sheets.googleapis.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate for local app shell assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/SafeTube/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
