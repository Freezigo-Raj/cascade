// Cascade — the service worker.
//
// It exists for one thing: opening with no signal. The store was local-first
// from session 96, so a running app already survives a lost connection; what it
// could not survive was being closed and opened again, because the files
// themselves came off the network.
//
// **Network first, cache second — except a URL that states its own version,
// which is immutable and served from the cache (see `versioned` below).** The usual
// advice is cache-first, which is faster and is the wrong trade here. A
// cache-first worker keeps serving a version of the app that is no longer in the
// repository, on someone else's phone, with nothing on screen saying so. This
// project has already been bitten twice by the soft version of that — a browser
// serving a module from cache, which read as a fix that did not work rather than
// a file that was never fetched — and a service worker is that made permanent.
// The cost is that every cold start waits on the network. That is the right way
// round: slow and correct beats fast and lying.
//
// **It is also written to evict its own predecessor.** A dead Cascade lived at
// this address for three weeks with a cache-first worker in it. `skipWaiting`
// and `clients.claim` mean this one takes over on first sight rather than
// waiting for every tab to close, and activation drops every cache it did not
// make itself.

const STORE = "cascade-shell";

self.addEventListener("install", (e) => {
  // No pre-cache list. The app is a few dozen small modules whose names change
  // as it is built, and a list of them here would be a second inventory to keep
  // in step with the first. What is cached is what has actually been fetched.
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name !== STORE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

/**
 * Two kinds of URL live here now (session 119).
 *
 * A VERSIONED one carries `?v=<number>`. The number is the shell version, it
 * changes when the file changes, and the gate holds every one of them to
 * SHELL_VERSION — so a versioned URL names immutable content and is cached
 * under its FULL address, query included. Serving it cache-first is not the
 * stale-copy trap the header warns about: a new version is a new address, and
 * the address comes from a document that is always fetched fresh.
 *
 * Everything else keeps the old rule: cached under the bare address,
 * network-first, cache only as the offline answer.
 */
const versioned = (url) => /[?&]v=\d+/.test(new URL(url).search);
const key = (url) => {
  if (versioned(url)) return url;
  const u = new URL(url);
  u.search = "";
  return u.href;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Supabase is data, not files. The store has its own answer for being offline
  // — a local cache and an outbox — and a stale reply served from here would be
  // a second answer disagreeing with it.
  if (url.hostname.endsWith(".supabase.co")) return;

  // THE PAGE ITSELF IS FETCHED PAST THE BROWSER'S OWN CACHE.
  //
  // Network-first was not enough, and the reason took two builds to see. Every
  // module carries a fresh `?v=`, so those are always new URLs and always come
  // off the network. `index.html` cannot carry one: it is the address. GitHub
  // Pages serves it with a ten-minute lifetime, and `fetch()` in here goes
  // through the browser's HTTP cache, so for ten minutes after a push this
  // worker is handed the previous page without a request leaving the phone. The
  // page's `<link>` then loads the previous version's stylesheet while the
  // modules are current, which is exactly the mismatch the app was reporting:
  // new JavaScript, old HTML, and a stylesheet behind by exactly one.
  //
  // `cache: "reload"` skips the HTTP cache on the way out. Only for the document,
  // because everything else already has a unique URL and would gain nothing.
  const document_ = req.mode === "navigate" || req.destination === "document";

  e.respondWith((async () => {
    // A versioned file already in the cache is the file: same number, same
    // bytes. Every launch used to pay one network round trip per module to
    // learn that nothing had changed; the version already says so.
    if (!document_ && versioned(req.url)) {
      const hit = await caches.match(key(req.url));
      if (hit) return hit;
    }
    try {
      const fresh = document_
        ? await fetch(req.url, { cache: "reload", credentials: "same-origin" })
        : await fetch(req);
      // Only a real answer is worth keeping. A 404 cached here would outlive the
      // deploy that fixed it.
      if (fresh && fresh.ok) {
        const store = await caches.open(STORE);
        await store.put(key(req.url), fresh.clone());
      }
      return fresh;
    } catch (err) {
      const hit = await caches.match(key(req.url));
      if (hit) return hit;
      throw err;
    }
  })());
});
