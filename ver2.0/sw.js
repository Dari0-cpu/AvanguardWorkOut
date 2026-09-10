/* ============================================================
   AVANGUARD 2.0 — SERVICE WORKER (offline-first)
   Strategia: precache dell'app shell, cache-first.
   I dati NON passano mai dal SW: vivono in localStorage.
   ============================================================ */

const CACHE = 'avanguard-v2.0.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/data.js',
  './js/charts.js',
  './js/ui.js',
  './js/views.js',
  './js/session.js',
  './js/pwa.js',
  './fonts/ArchivoBlack-400.woff2',
  './fonts/BarlowSemiCondensed-400.woff2',
  './fonts/BarlowSemiCondensed-500.woff2',
  './fonts/BarlowSemiCondensed-600.woff2',
  './fonts/BarlowSemiCondensed-700.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './favicon.svg'
];

// Installazione: precarica tutto l'app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Attivazione: ripulisce cache vecchie
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first per l'app shell; network solo per CDN esterne (sync cloud)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Solo GET, ignora richieste cross-origin (Supabase gestite online dal client)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        // metti in cache le risposte ok dello stesso scope
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
