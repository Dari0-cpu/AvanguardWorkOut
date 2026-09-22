// Service Worker

const CACHE_NAME = 'avanguard-cache-v2';
// Aggiungiamo i file principali da scaricare e usare offline
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './pdfexp.js',       // <-- Aggiunto
    './manifest.json',   // <-- Aggiunto
    './logo.jpg',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web'
];
// Installa il service worker e salva i file in cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Intercetta le richieste di rete
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Ritorna la versione in cache se esiste, altrimenti usa la rete
                return response || fetch(event.request);
            })
    );
});