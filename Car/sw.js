const CACHE_NAME = 'fit-fuel-v1';
const urlsToCache = [
  './',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cpaizo.github.io/Car/fit.jpg'
];

// 安裝 Service Worker 並快取必要資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求以提供離線支援
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
