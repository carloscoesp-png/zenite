// Service worker: guarda os arquivos do app para funcionar sem internet.
// Ao adicionar ou remover arquivos da lista, aumente a versão.
const VERSION = 'lifequest-v0.2.0';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/store.js',
  'js/calc.js',
  'js/ui.js',
  'js/foods.js',
  'js/taco.js',
  'js/portions.js',
  'js/views/onboarding.js',
  'js/views/profile-form.js',
  'js/views/today.js',
  'js/views/add.js',
  'js/views/progress.js',
  'js/views/profile.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro (o app sempre pega a versão mais nova quando há internet);
// sem internet, usa a cópia guardada.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
