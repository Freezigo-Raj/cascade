// Cascade Part A — which store.
//
// `app.js` imports its four calls from here instead of from `store.js`, and
// that is the only line in it that changed. The choice is made once, at import,
// and nothing above this file can tell which one it got.
//
// Signed in and a project configured: the syncing store. Anything else: the
// browser store, which is what every session up to now ran on. A missing
// project is not an error, it is a shell running local.

// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { client } = await import(`./supabase.js${v}`);
const { account } = await import(`./auth.js${v}`);
const browser = await import(`./store.js${v}`);
const { makeSyncStore } = await import(`./store.sync.js${v}`);

let tasks = browser.tasks;
let undo = browser.undo;
let mode = "local";
let sync = null;

const db = client();
// `sessionSoon` rather than `session`, and the difference is the whole of why
// an offline phone used to show nothing (session 141). See `auth.js`: an
// expired token makes `getSession()` a network call that takes twenty-six
// seconds to fail, and this line is awaited at module load, so every screen in
// the app waited behind it.
if (db && (await account.sessionSoon())) {
  sync = makeSyncStore(db, partAConfig);
  tasks = sync.tasks;
  undo = sync.undo;
  mode = "sync";
  // NOT AWAITED (session 141). It used to be, on the reasoning that the list
  // should be right before it is first drawn — and it is, because `all()` reads
  // the CACHE and never the network, which is the whole design of the syncing
  // store. What awaiting actually bought was nothing, and what it cost was the
  // entire app waiting on `owner()` → `getUser()` → a network call, on a module
  // every screen imports.
  //
  // It runs in the background and announces `cascade:store-changed` when the
  // pull lands, which is how the list learns about anything it did not already
  // hold. Offline it fails quietly and the cache is the answer, which is the
  // same answer it would have given after the wait.
  sync.start().catch((e) => console.warn("store: started offline —", e?.message ?? e));
}

export { tasks, undo, mode, sync };
export const UNDO_ID = "current";
