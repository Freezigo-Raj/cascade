// Cascade service worker.
// Navigations are network-first so a freshly uploaded index.html shows up on the
// next open when online; it falls back to the cached copy offline. Other same-
// origin assets (icons, manifest) are cache-first. Cross-origin (Supabase,
// Google Fonts) passes straight through to the network.
const CACHE = "cascade-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Supabase / fonts: normal network
  if (e.request.mode === "navigate") {         // the app page: fresh when online
    e.respondWith(
      fetch(e.request).then((res) => { caches.open(CACHE).then((c) => c.put("./index.html", res.clone())); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
