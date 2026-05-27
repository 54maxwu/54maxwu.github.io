// Minimum service worker for PWA installability.
// No caching — all requests pass through to the network. The browser still
// uses HTTP cache as usual, so static assets aren't re-fetched on every load.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Chrome requires a fetch handler to count the SW as PWA-eligible, even if
// it's just a passthrough.
self.addEventListener('fetch', () => {});
