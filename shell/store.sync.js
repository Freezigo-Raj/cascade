// Cascade Part A — the store that syncs.
//
// The same four calls again: `all`, `add`, `update`, `remove`. Three stores now
// answer to them and nothing above any of them has changed, which is what the
// seam was for.
//
// **The account is the sync.** There is no pairing, no device list and no share
// code. Signing in on a second device is the whole of it.
//
// **Local first, always.** `all` answers from localStorage and never waits on a
// network. A write lands in the cache before it is sent, so the list redraws at
// the speed of the machine it is on and a lost connection changes nothing about
// what typing feels like. What a connection changes is when the other device
// finds out.
//
// **The outbox is what makes offline real.** A write that cannot be sent is
// queued in its own namespace and drained in order on reconnect. It holds
// actions, never a flag on a Task: the record written to Postgres from this
// device is byte-identical to the one written from any other, and no sync
// bookkeeping leaked into the contract's shape.
//
// **Newest wins, decided in Postgres.** Two devices editing one task is settled
// by `updated_at`, by a trigger in `schema.sql` rather than by a query written
// here. A stale write drained an hour late is dropped by the database, so no
// client can get the rule wrong by being written wrong.
//
// **Absence is the tombstone.** A pull fetches every row and deletes anything
// in the cache the server no longer has, minus whatever this device has queued
// and not yet sent. That is why there is no fourth table: a task deleted on the
// laptop disappears from the phone because it stopped being in the answer.
//
// **Undo does not sync, and this reverses a decision from session 92.** The
// undo entry is the previous state of a task on the device that changed it, and
// it has to work with the aeroplane mode on, which a row fetched over a network
// cannot. Syncing it is also wrong on its own terms: pressing Undo on a phone
// would reverse something done on a laptop an hour ago. `cascade_undo` stays in
// the schema and the shell stops writing to it.

// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { makeStore } = await import(`./store.js${v}`);
const { toRow, fromRow } = await import(`./store.supabase.js${v}`);

const OUTBOX = "outbox";

/** Told to whoever is drawing, because a redraw is not this file's job. */
function announce(what) {
  window.dispatchEvent(new CustomEvent("cascade:store-changed", { detail: what }));
}

export function makeSyncStore(db, config) {
  const cache = makeStore("task");
  const queue = makeStore(OUTBOX);

  let me = null;
  let draining = false;
  let online = true;

  async function owner() {
    if (me) return me;
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user) throw new Error("store: not signed in");
    me = data.user.id;
    return me;
  }

  /**
   * The config in force, stored once, so `config_version` points at something.
   *
   * Written and then read back, because the write can be refused without
   * saying so: `ignoreDuplicates` sends `on conflict do nothing`, and a row
   * that no policy admits is not distinguishable from a row that was already
   * there. What surfaced instead was every task insert failing on the foreign
   * key, three layers away from the cause. The check turns that into one
   * sentence naming the thing to fix.
   */
  let configOk = false;
  async function ensureConfig() {
    if (configOk) return;
    const { error } = await db
      .from("cascade_config")
      .upsert({ version: config.version, body: config }, { onConflict: "version", ignoreDuplicates: true });
    if (error) throw error;
    const { data } = await db
      .from("cascade_config").select("version").eq("version", config.version).maybeSingle();
    if (!data) {
      throw new Error(
        `store.sync: cascade_config has no row for ${config.version} after writing one. ` +
        `The insert policy on cascade_config is missing, so every task insert will fail ` +
        `on cascade_task_config_version_fkey.`
      );
    }
    configOk = true;
  }

  // ------------------------------------------------------------- the outbox

  // Ordered by `seq` rather than by insertion, because localStorage hands rows
  // back in no order at all and a delete overtaking its own add would leave a
  // task that exists on one device and not the other.
  let seq = 0;
  const nextSeq = () => `${Date.now()}-${String(seq++).padStart(4, "0")}`;

  async function enqueue(action, id, record) {
    await queue.add({ id: nextSeq(), action, task_id: id, record: record ?? null });
  }

  async function pending() {
    return (await queue.all()).sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  /**
   * Send what is waiting, oldest first, and stop at the first failure so the
   * order survives. An entry leaves the queue only once its write is confirmed.
   */
  async function drain() {
    if (draining) return;
    draining = true;
    try {
      const items = await pending();
      if (!items.length) return;
      const who = await owner();
      // Before anything else, because `cascade_task.config_version` is a
      // foreign key into `cascade_config`. Fired and forgotten at `add` time it
      // lost the race and every insert came back a constraint violation.
      try {
        await ensureConfig();
      } catch (e) {
        online = false;
        console.warn("store.sync: the config row is not there, so nothing can be sent", {
          version: config.version,
          code: e.code, message: e.message, details: e.details, hint: e.hint,
        });
        return;
      }
      for (const item of items) {
        try {
          if (item.action === "remove") {
            const { error } = await db.from("cascade_task").delete().eq("id", item.task_id).eq("owner", who);
            if (error) throw error;
          } else {
            // Upsert rather than insert, because a retry after a failure that
            // may or may not have landed must not fail on a duplicate key.
            const { error } = await db.from("cascade_task").upsert(toRow(item.record, who));
            if (error) throw error;
          }
          await queue.remove(item.id);
        } catch (e) {
          online = false;
          // `message` alone says "violates foreign key constraint" and stops.
          // `details`, `hint` and `code` say which one, which is the answer.
          console.warn("store.sync: queued and waiting", {
            action: item.action, task: item.task_id,
            code: e.code, message: e.message, details: e.details, hint: e.hint,
          });
          return;
        }
      }
      online = true;
    } finally {
      draining = false;
    }
  }

  // --------------------------------------------------------------- the pull

  /**
   * Every row, into the cache. Anything the cache holds that the server does
   * not is gone, unless this device is still carrying it in the outbox, in
   * which case the server has simply not been told yet.
   */
  async function pull() {
    const who = await owner();
    const { data, error } = await db.from("cascade_task").select("*").eq("owner", who);
    if (error) {
      online = false;
      return false;
    }
    online = true;

    const server = new Map((data ?? []).map((r) => [r.id, fromRow(r)]));
    const held = new Set((await pending()).map((p) => p.task_id));
    const local = await cache.all();

    for (const t of local) {
      if (!server.has(t.id) && !held.has(t.id)) await cache.remove(t.id);
    }
    for (const [id, record] of server) {
      if (held.has(id)) continue;              // ours is newer than what came back
      const mine = local.find((t) => t.id === id);
      if (!mine) await cache.add(record);
      else if (mine.updated_at !== record.updated_at) await cache.update(id, record);
    }
    announce("pull");
    return true;
  }

  // ------------------------------------------------------------ live, or not

  function listen() {
    // Realtime is the fast path and never the only one. A dropped socket is
    // silent, so the three ordinary signals a browser gives — coming back
    // online, the tab being looked at again, and a minute passing — each pull.
    db.channel("cascade_task_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cascade_task" }, async (payload) => {
        try {
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id) { await cache.remove(id); announce("remote-delete"); }
            return;
          }
          const record = fromRow(payload.new);
          const held = new Set((await pending()).map((p) => p.task_id));
          if (held.has(record.id)) return;
          const mine = (await cache.all()).find((t) => t.id === record.id);
          if (!mine) await cache.add(record);
          else await cache.update(record.id, record);
          announce("remote-write");
        } catch (e) {
          console.warn("store.sync: live update skipped —", e.message ?? e);
        }
      })
      .subscribe();

    window.addEventListener("online", () => { drain().then(pull); });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") drain().then(pull);
    });
    setInterval(() => { drain().then(pull); }, 60_000);
  }

  // ------------------------------------------------------------- four calls

  const tasks = {
    namespace: "task",
    persistent: cache.persistent,
    mode: "sync",

    /** The cache, never the network. This is why the screen never waits. */
    all() {
      return cache.all();
    },

    async add(record) {
      if (!record || !record.id) throw new Error("store.add: a record needs an id");
      await cache.add(record);
      await enqueue("add", record.id, record);
      drain();
      return record;
    },

    async update(id, record) {
      await cache.update(id, record);
      await enqueue("update", id, record);
      drain();
      return record;
    },

    /** Real removal, as everywhere else: the row goes and undo holds the copy. */
    async remove(id) {
      const prior = await cache.remove(id);
      await enqueue("remove", id, null);
      drain();
      return prior;
    },
  };

  /** Local, for the reason written at the top of this file. */
  const undo = makeStore("undo");

  /**
   * The account's own numbers over config's. An account with no row gets the
   * config value rather than nothing, so signing up is not a form to fill in.
   */
  async function settings() {
    const { data, error } = await db
      .from("cascade_settings").select("*").eq("owner", await owner()).maybeSingle();
    if (error) return config;
    return {
      ...config,
      capacity_min_per_day: data?.capacity_min_per_day ?? config.capacity_min_per_day,
      duplicate: { ...config.duplicate, threshold: data?.duplicate_threshold ?? config.duplicate.threshold },
    };
  }

  /** Everything that is not yet on the server, for a line on the screen. */
  async function status() {
    const waiting = (await pending()).length;
    return { online, waiting };
  }

  /**
   * Signing out empties the cache. One account's tasks are on this machine and
   * the next person to sign in on it is not necessarily the same person.
   */
  async function forget() {
    for (const t of await cache.all()) await cache.remove(t.id);
    for (const u of await undo.all()) await undo.remove(u.id);
    for (const q of await queue.all()) await queue.remove(q.id);
    me = null;
  }

  async function start() {
    await owner();
    await drain();
    await pull();
    listen();
  }

  return { tasks, undo, settings, status, forget, start, pull, drain, UNDO_ID: "current" };
}
