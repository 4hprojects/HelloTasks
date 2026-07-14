const CACHE_NAME = 'hellotasks-qr-v2';
const STATIC_ASSETS = [
  '/css/base.css', '/css/theme.css', '/css/layout.css', '/css/forms.css', '/css/buttons.css',
  '/css/components.css', '/css/tasks.css', '/css/responsive.css', '/js/main.js',
  '/qr/css/qr-creator.css', '/qr/js/qr-payload-builder.js', '/qr/js/qr-creator.js',
  '/qr/js/qr-pwa.js', '/qr/vendor/qr-code-styling.js', '/qr/manifest.webmanifest',
  '/qr/images/icon-180.png', '/qr/images/icon-192.png', '/qr/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    for (const path of ['/qr', '/qr/help']) {
      const response = await fetch(path, { credentials: 'omit' });
      if (response.ok) await cache.put(path, response);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('hellotasks-qr-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
    return;
  }
  if (!url.pathname.startsWith('/qr')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response) return response;
      } catch (_) {
        // Network failures fall through to the privacy-safe public shell cached at install time.
      }
      return caches.match(url.pathname === '/qr/help' ? '/qr/help' : '/qr');
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
