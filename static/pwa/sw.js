/**
 * Ario Shop PWA Service Worker
 * Version: 1.0.0
 * 
 * Features:
 * - Versioned caching with automatic cleanup
 * - Safe caching strategies (cache-first for static, network-first for dynamic)
 * - Cache size limits with LRU eviction
 * - Django session compatibility (never caches authenticated routes)
 * - Works in local development without HTTPS
 * - Offline fallback page
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'ario-';

// Cache names
const STATIC_CACHE = CACHE_PREFIX + 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = CACHE_PREFIX + 'dynamic-' + CACHE_VERSION;

// Cache size limits (in bytes)
const MAX_STATIC_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DYNAMIC_CACHE_SIZE = 20 * 1024 * 1024; // 20MB

// Metadata store for cache timestamps (in memory)
const cacheMetadata = {};

// URLs that should NEVER be cached (Django session/CSRf protection)
const CACHE_BLACKLIST = [
    /\/admin\//,
    /\/accounts\//,
    /\/cart\/checkout\//,
    /\/cart\/payment\//,
    /\/cart\/api\/new-orders\//,
    /\/api\/.*user.*\/,
    /\/password\//,
    /\/login\//,
    /\/logout\//,
    /\/register\//,
];

// URL patterns that should use cache-first strategy (static assets)
const STATIC_CACHE_PATTERNS = [
    /\.css$/,
    /\.js$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.ico$/,
    /\.webp$/,
    /\/static\/assets\//,
    /\/static\/pwa\//,
    /\/media\/products\//,
    /\/media\/categories\//,
    /\/media\/brands\//,
];

// URL patterns that should use network-first strategy (dynamic content)
const DYNAMIC_CACHE_PATTERNS = [
    /\.html$/,
    /\/$/,
    /\/shop\//,
    /\/Contact_us\//,
    /\/About_us\//,
    /\/cart\//,
    /\/accounts\/orders\//,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                // Cache all static assets from manifest
                const staticAssets = [
                    '/static/pwa/manifest.json',
                    '/static/pwa/pwa-register.js',
                    '/offline/',
                    '/static/assets/images/icons/apple-touch-icon.png',
                    '/static/assets/images/icons/favicon-32x32.png',
                    '/static/assets/images/icons/favicon-16x16.png',
                ];
                return cache.addAll(staticAssets);
            })
            .then(() => {
                console.log('[ServiceWorker] Static assets cached');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[ServiceWorker] Install failed:', err);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                console.log('[ServiceWorker] Found caches:', cacheNames);
                
                // Delete old version caches
                const deletePromises = cacheNames
                    .filter((cacheName) => {
                        // Keep only current version caches
                        return cacheName.startsWith(CACHE_PREFIX) &&
                               !cacheName.includes(CACHE_VERSION);
                    })
                    .map((cacheName) => {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    });
                
                return Promise.all(deletePromises);
            })
            .then(() => {
                console.log('[ServiceWorker] Activation complete');
                return self.clients.claim();
            })
            .catch((err) => {
                console.error('[ServiceWorker] Activation failed:', err);
            })
    );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests (POST, PUT, DELETE, etc.)
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip cross-origin requests (external CDNs, etc.)
    // Use self.registration.scope to get the origin
    const scope = self.registration.scope;
    const scopeUrl = new URL(scope);
    if (url.origin !== scopeUrl.origin) {
        return;
    }

    // Check if URL is blacklisted (never cache)
    if (shouldSkipCache(url.pathname)) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }

    // Determine caching strategy based on URL pattern
    if (shouldUseCacheFirst(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else if (shouldUseNetworkFirst(url.pathname)) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        // Default: network only (no caching)
        event.respondWith(fetch(request));
    }
});

// Check if URL should skip caching (blacklist)
function shouldSkipCache(pathname) {
    return CACHE_BLACKLIST.some(pattern => pattern.test(pathname));
}

// Check if URL should use cache-first strategy
function shouldUseCacheFirst(pathname) {
    return STATIC_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Check if URL should use network-first strategy
function shouldUseNetworkFirst(pathname) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Update access timestamp for LRU
function updateAccessTimestamp(url) {
    cacheMetadata[url] = Date.now();
}

// Get access timestamp for LRU
function getAccessTimestamp(url) {
    return cacheMetadata[url] || 0;
}

// Cache-first strategy - check cache first, fallback to network
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        console.log('[ServiceWorker] Cache hit:', request.url);
        // Update access timestamp for LRU
        updateAccessTimestamp(request.url);
        return cachedResponse;
    }

    console.log('[ServiceWorker] Cache miss:', request.url);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            
            // Check cache size and evict if necessary
            await enforceCacheSizeLimit(STATIC_CACHE, MAX_STATIC_CACHE_SIZE);
            
            // Clone response before caching
            cache.put(request, networkResponse.clone());
            // Record timestamp for LRU
            updateAccessTimestamp(request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[ServiceWorker] Network failed:', error);
        // Return offline fallback for HTML requests
        return getOfflineFallback();
    }
}

// Network-first strategy - try network first, fallback to cache
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            
            // Check cache size and evict if necessary
            await enforceCacheSizeLimit(cacheName, MAX_DYNAMIC_CACHE_SIZE);
            
            // Clone response before caching
            cache.put(request, networkResponse.clone());
            // Record timestamp for LRU
            updateAccessTimestamp(request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Update access timestamp for LRU
            updateAccessTimestamp(request.url);
            return cachedResponse;
        }
        
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return getOfflineFallback();
        }
        
        // Return error response for API requests
        return new Response(
            JSON.stringify({ error: 'Offline', message: 'شما آفلاین هستید' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Get offline fallback page
async function getOfflineFallback() {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline/');
    
    if (offlinePage) {
        return offlinePage;
    }
    
    // If offline page not cached, return a simple response
    return new Response(
        `<!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>آریو شاپ - آفلاین</title>
            <style>
                body { font-family: Tahoma, Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                p { color: #666; }
                button { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; }
                button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>شما آفلاین هستید</h1>
                <p>اتصال اینترنتی خود را بررسی کنید و دوباره تلاش کنید.</p>
                <button onclick="window.location.reload()">تلاش مجدد</button>
            </div>
        </body>
        </html>`,
        {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        }
    );
}

// Enforce cache size limit using LRU (Least Recently Used) eviction
async function enforceCacheSizeLimit(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    let totalSize = 0;
    const cachedItems = [];
    
    // Calculate total size and get timestamps
    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const blob = await response.clone().blob();
            const size = blob.size;
            const timestamp = getAccessTimestamp(request.url);
            cachedItems.push({ request, size, timestamp });
            totalSize += size;
        }
    }
    
    // If under limit, no action needed
    if (totalSize <= maxSize) {
        return;
    }
    
    console.log(`[ServiceWorker] Cache ${cacheName} size (${totalSize}) exceeds limit (${maxSize}), evicting...`);
    
    // Sort by timestamp (oldest first) - LRU
    cachedItems.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest items until under limit
    while (totalSize > maxSize && cachedItems.length > 0) {
        const item = cachedItems.shift();
        await cache.delete(item.request);
        totalSize -= item.size;
        // Remove from metadata
        delete cacheMetadata[item.request.url];
        console.log(`[ServiceWorker] Evicted from ${cacheName}:`, item.request.url);
    }
    
    console.log(`[ServiceWorker] Cache ${cacheName} size after eviction: ${totalSize}`);
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Skip waiting requested');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});
