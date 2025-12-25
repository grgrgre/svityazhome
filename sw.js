const CACHE_NAME = 'svityazhome-v12';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/404.html',
  '/about/',
  '/about/index.html',
  '/gallery/',
  '/gallery/index.html',
  '/rooms/',
  '/rooms/index.html',
  '/booking/',
  '/booking/index.html',
  '/privacy-policy.html',
  '/terms.html',
  '/robots.txt',
  '/sitemap.xml',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/partials/header.html',
  '/assets/partials/footer.html',
  '/favicon.ico',
  '/assets/images/favicon/apple-touch-icon.png',
  '/assets/images/favicon/favicon-32x32.png',
  '/assets/images/favicon/favicon-16x16.png',
  '/assets/images/favicon/favicon.ico',
  '/assets/images/favicon/android-chrome-192x192.png',
  '/assets/images/favicon/android-chrome-512x512.png',
  '/assets/images/favicon/site.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })()
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}






