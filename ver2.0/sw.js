// Service Worker v13 - Restyling UI + rimozione Chart.js
const CACHE_NAME = 'avanguard-cache-v14';

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
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(CORE_ASSETS);
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

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.url.includes('/api/') || req.url.includes('supabase.co') || req.method !== 'GET') return;

    const isLocal = req.url.startsWith(self.location.origin);

    if (isLocal) {
        event.respondWith(
            fetch(req)
                .then(res => {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then(c => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(req))
        );
    } else {
        event.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                if (res && (res.ok || res.type === 'opaque')) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                }
                return res;
            }))
        );
    }
});