// Cascade Part A — the store.
//
// Four calls and nothing else: `all`, `add`, `update`, `remove`. Every caller
// goes through them, so the day Supabase arrives it replaces four function
// bodies and no calling code changes. That is the whole point of the file.
//
// All four are async today even though the browser answers instantly, because
// Supabase will not, and a synchronous seam would mean rewriting every call
// site later rather than four bodies.
//
// One row per record, keyed `cascade:<namespace>:<id>`, which is the shape
// Postgres wants. A single JSON blob would have been fewer lines here and a
// rewrite there.
//
// `makeStore` is namespaced so the undo entry lives in the same seam as the
// tasks: a real delete removes the row, and the only copy of it is the undo
// entry, which would die with the tab if it were held in a variable.

const PREFIX = "cascade";

function backing() {
  // Kept behind a function so a browser that refuses storage (private mode,
  // disabled cookies) degrades to memory rather than throwing on boot. A
  // session that loses its tasks on refresh is worse than one that does not;
  // a session that will not start at all is worse than both.
  try {
    const probe = `${PREFIX}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const mem = new Map();
    return {
      get length() { return mem.size; },
      key: (i) => [...mem.keys()][i] ?? null,
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, v),
      removeItem: (k) => mem.delete(k),
      persistent: false,
    };
  }
}

export function makeStore(namespace) {
  const db = backing();
  const key = (id) => `${PREFIX}:${namespace}:${id}`;
  const mine = (k) => k.startsWith(`${PREFIX}:${namespace}:`);

  return {
    namespace,
    /** True when a refresh keeps the rows. False is a real answer, not an error. */
    persistent: db.persistent !== false,

    /** Every row, in no order. Callers sort; the store does not rank. */
    async all() {
      const out = [];
      for (let i = 0; i < db.length; i++) {
        const k = db.key(i);
        if (!k || !mine(k)) continue;
        const raw = db.getItem(k);
        if (raw === null) continue;
        try {
          out.push(JSON.parse(raw));
        } catch {
          // A row that will not parse is a row written by something else, or a
          // half-written one. Skipping it loses a task; throwing loses all of
          // them. It is named in the console so it is not silent.
          console.warn(`store: ${k} is not readable JSON and was skipped`);
        }
      }
      return out;
    },

    async add(record) {
      if (!record || !record.id) throw new Error("store.add: a record needs an id");
      if (db.getItem(key(record.id)) !== null) {
        throw new Error(`store.add: ${record.id} already exists; use update`);
      }
      db.setItem(key(record.id), JSON.stringify(record));
      return record;
    },

    async update(id, record) {
      if (db.getItem(key(id)) === null) throw new Error(`store.update: ${id} is not here`);
      db.setItem(key(id), JSON.stringify(record));
      return record;
    },

    /** Real removal. The row goes. What holds the copy is the undo entry. */
    async remove(id) {
      const raw = db.getItem(key(id));
      if (raw === null) return null;
      db.removeItem(key(id));
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  };
}

export const tasks = makeStore("task");
export const undo = makeStore("undo");

/** One entry at a time, superseded rather than stacked. From the contract. */
export const UNDO_ID = "current";
