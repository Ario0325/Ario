const CACHE_NAME = 'ario-shop-v1';
const STATIC_ASSETS = [
    '/',
    '/static/assets/css/bootstrap.min.css',
    '/static/assets/css/bootstrap-rtl.min.css',
    '/static/assets/css/style.css',
    '/static/assets/css/demos/demo-12.css',
    '/static/assets/css/navbar-modern.css',
    '/static/assets/css/ui-animations.css',
    '/static/assets/css/mobile-overrides.css',
    '/static/assets/js/jquery.min.js',
    '/static/assets/js/bootstrap.bundle.min.js',
    '/static/assets/js/main.js',
    '/static/assets/js/demos/demo-12.js',
    '/static/assets/js/navbar-modern.js',
    '/static/assets/images/icons/android-chrome-192x192.png',
    '/static/assets/images/icons/android-chrome-256x256.png',
    '/static/assets/images/icons/icon-512x512.png',
    '/static/assets/images/icons/apple-touch-icon.png',
    '/static/assets/images/icons/favicon-32x32.png',
    '/static/assets/images/icons/favicon-16x16.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/accounts/') || url.pathname.startsWith('/cart/')) {
        return;
    }

    if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/media/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('آفلاین', { status: 503, statusText: 'Offline' });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/');
    }
}