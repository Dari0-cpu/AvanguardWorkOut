// Service Worker v3 - Offline Ready & Auto-Cleanup
const CACHE_NAME = 'avanguard-cache-v3';

const CORE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './pdfexp.js',
    './manifest.json',
    './logo.png'
];

const CDN_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(CORE_ASSETS);
            // I CDN li mettiamo in cache singolarmente così un errore esterno non blocca l'installazione
            await Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

if (req.url.includes('/api/') || req.url.includes('supabase.co') || req.method !== 'GET') return;

self.addEventListener('fetch', event => {
    const req = event.request;
    // Non intercettare chiamate API Supabase
    if (req.url.includes('supabase.co') || req.method !== 'GET') return;

    const isLocal = req.url.startsWith(self.location.origin);

    if (isLocal) {
        // Network-first per i file locali (così gli aggiornamenti arrivano subito, ma funziona offline)
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req))
        );
    } else {
        // Cache-first per librerie esterne
        event.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, copy));
                return res;
            }))
        );
    }
    
});