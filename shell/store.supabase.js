// Cascade Part A — the store, against Supabase.
//
// The same four calls as `store.js`: `all`, `add`, `update`, `remove`. That was
// the whole point of building the seam first. Nothing above this file changes.
//
// What this file does that the browser one did not is translate. A record holds
// ISO local-with-offset strings; Postgres holds an instant and an offset in two
// columns. Splitting on write and rejoining on read happens here and nowhere
// else, so no caller ever sees a half-translated record.

// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { client } = await import(`./supabase.js${v}`);
const { account } = await import(`./auth.js${v}`);

/** The six instant fields, each stored as a `timestamptz` and an offset. */
const INSTANTS = ["due_at", "earliest_start", "first_due_at", "created_at", "updated_at", "closed_at"];

export const offsetOf = (iso) => (iso ? iso.slice(-6) : null);

/**
 * A record into a row. The instant goes to Postgres as an absolute moment,
 * which is what comparing wants; the offset goes beside it, which is what
 * reading it back as the person meant wants. Dropping the offset would move
 * every band boundary, because `deadline_band` is a local calendar day.
 */
export function toRow(task, owner) {
  const row = { ...task, owner };
  for (const f of INSTANTS) {
    const v = task[f];
    row[f] = v || null;
    row[`${f}_offset`] = offsetOf(v);
  }
  return row;
}

/** A row back into a record: the offset rejoins its instant. */
export function fromRow(row) {
  const task = { ...row };
  delete task.owner;
  for (const f of INSTANTS) {
    const at = row[f], off = row[`${f}_offset`];
    delete task[`${f}_offset`];
    // Postgres hands back UTC. The offset says what local reading produced it,
    // so the record is rebuilt in the zone it was written in rather than in the
    // zone of whatever machine is reading.
    task[f] = at && off ? shift(at, off) : null;
  }
  return task;
}

/** An ISO instant re-expressed at a stated offset, to the second. */
export function shift(iso, offset) {
  const sign = offset[0] === "-" ? -1 : 1;
  const mins = sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
  const local = new Date(Date.parse(iso) + mins * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}${offset}`
  );
}

export function makeSupabaseStore(config) {
  // The client is made once in `supabase.js` and shared, so the store and the
  // account screen read one session rather than two copies of it.
  const db = client();
  if (!db) throw new Error("store.supabase: shell/env.js has no project in it");

  /** The signed-in account. Every call needs it; nothing here runs signed out. */
  async function owner() {
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user) throw new Error("store: not signed in");
    return data.user.id;
  }

  /**
   * The config in force, stored once so a record's `config_version` stamp
   * points at something. Until this existed the stamp was decoration: a row
   * saying `a.13` could not be checked against anything after a.14 shipped.
   */
  async function ensureConfig() {
    const { error } = await db
      .from("cascade_config")
      .upsert({ version: config.version, body: config }, { onConflict: "version", ignoreDuplicates: true });
    if (error) throw error;
  }

  const tasks = {
    namespace: "task",
    persistent: true,

    async all() {
      const { data, error } = await db.from("cascade_task").select("*").eq("owner", await owner());
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },

    async add(record) {
      if (!record || !record.id) throw new Error("store.add: a record needs an id");
      await ensureConfig();
      const { error } = await db.from("cascade_task").insert(toRow(record, await owner()));
      if (error) throw error;
      return record;
    },

    async update(id, record) {
      const { error } = await db
        .from("cascade_task").update(toRow(record, await owner())).eq("id", id).eq("owner", await owner());
      if (error) throw error;
      return record;
    },

    /** Real removal, as on the browser store: the row goes and undo holds the copy. */
    async remove(id) {
      const me = await owner();
      const { data, error } = await db
        .from("cascade_task").delete().eq("id", id).eq("owner", me).select();
      if (error) throw error;
      return data?.[0] ? fromRow(data[0]) : null;
    },
  };

  // One entry at a time, superseded rather than stacked, which is why the table
  // is keyed by owner and `add` is an upsert rather than an insert.
  const undo = {
    namespace: "undo",
    persistent: true,
    async all() {
      const { data, error } = await db.from("cascade_undo").select("*").eq("owner", await owner());
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: "current", action: r.action, task_id: r.task_id,
        prior_state: r.prior_state, created_at: shift(r.created_at, r.created_at_offset),
      }));
    },
    async add(entry) {
      const { error } = await db.from("cascade_undo").upsert({
        owner: await owner(), action: entry.action, task_id: entry.task_id,
        prior_state: entry.prior_state, created_at: entry.created_at,
        created_at_offset: offsetOf(entry.created_at),
      });
      if (error) throw error;
      return entry;
    },
    update(_id, entry) { return this.add(entry); },
    async remove() {
      const { error } = await db.from("cascade_undo").delete().eq("owner", await owner());
      if (error) throw error;
      return null;
    },
  };

  /**
   * The account's own numbers, merged over config. An account with no row gets
   * the config value rather than nothing, so signing up is not a form to fill
   * in before the app works.
   */
  async function settings() {
    const { data, error } = await db
      .from("cascade_settings").select("*").eq("owner", await owner()).maybeSingle();
    if (error) throw error;
    return {
      ...config,
      capacity_min_per_day: data?.capacity_min_per_day ?? config.capacity_min_per_day,
      duplicate: { ...config.duplicate, threshold: data?.duplicate_threshold ?? config.duplicate.threshold },
    };
  }

  // The account moved to `auth.js` when it grew a sign-up, a reset and a
  // confirmation resend. It is re-exported here so nothing that already reads
  // `store.account` had to change.
  return { tasks, undo, settings, account, db, UNDO_ID: "current" };
}
