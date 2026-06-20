const CACHE_NAME = 'unicah-pwa-v2';
const urlsToCache = [
  './index.html',
  './index.html?pass=1106',
  './moodle-icon.png'
];

// Instala el Service Worker y guarda en caché los archivos básicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Intercepta las peticiones para que la app pueda abrirse sin internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
