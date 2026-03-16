const CACHE_NAME = "qalia-v3";

// Assets to cache on install — only truly static files.
// Do NOT include routes like / or /dashboard that go through
// middleware redirects (locale prefix, auth) — cache.addAll()
// rejects on opaque/redirect responses and breaks SW install.
const STATIC_ASSETS = [
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith("http")) return;

    // For navigation requests (HTML pages)
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // For static assets (images, fonts, etc.) - cache first
    if (
        request.destination === "image" ||
        request.destination === "font" ||
        request.url.includes("/icons/")
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;

                return fetch(request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // For API requests - network only (don't cache)
    if (request.url.includes("/api/")) {
        return;
    }
});
