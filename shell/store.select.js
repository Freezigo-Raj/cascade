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
if (db && (await account.session())) {
  sync = makeSyncStore(db, partAConfig);
  tasks = sync.tasks;
  undo = sync.undo;
  mode = "sync";
  // The first pull happens here so the list is right before it is first drawn.
  // A failure is not fatal: the cache already holds the last known answer, and
  // the outbox holds anything typed since.
  try {
    await sync.start();
  } catch (e) {
    console.warn("store: started offline —", e.message ?? e);
  }
}

export { tasks, undo, mode, sync };
export const UNDO_ID = "current";
