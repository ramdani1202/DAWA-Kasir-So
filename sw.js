// Naikkan VERSION setiap deploy supaya app yang sedang terbuka
// otomatis reload ke versi baru. (Tanpa dinaikkan, versi baru tetap
// terambil saat app dibuka ulang karena strategi network-first.)
const VERSION = 'v4';
const CACHE_NAME = 'dawa-app-' + VERSION;
const ASSETS = [
  './', './index.html', './theme.css', './manifest.json',
  './kasir/index.html', './kasir/app.js', './kasir/menu-data.js', './kasir/icons.js',
  './so/index.html',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // hanya hapus cache milik app DAWA (origin github.io dipakai bersama app lain)
      .then((keys) => Promise.all(keys
        .filter((k) => k !== CACHE_NAME && (k.startsWith('dawa-') || k === 'so-rempah-cache'))
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isJsPdf = url.hostname === 'cdnjs.cloudflare.com';
  if (!sameOrigin && !isJsPdf) return;

  event.respondWith(
    fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined)
      .then((resp) => {
        if (resp && (resp.ok || resp.type === 'opaque')) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((hit) => hit || (sameOrigin ? caches.match('./index.html') : Response.error())))
  );
});
