// Cascade Part A — a record into a row, and a row back into a record.
//
// PURE, AND THAT IS THE WHOLE REASON THIS FILE EXISTS SEPARATELY (session 152).
// It lived inside `store.supabase.js`, which imports the Supabase client, which
// imports an npm package — so no check could read it, and the one thing in this
// app that decides WHAT REACHES THE SERVER was the one thing nothing could
// assert. That is the same seam session 127 cut for the alarm's write path, and
// it is the same lesson arriving a second time: a path a check cannot reach is
// a path that stays green while it is broken.
//
// The defect that forced it: `toRow` was `{ ...task, owner }`, so whatever the
// engine happened to put on a record went to Postgres. `fromEvent` put
// `due_phrase` on one — a working value with no column — PostgREST refused the
// whole row, and because the outbox stops at the first failure to keep its
// order, ONE imported task blocked every write behind it for hours, typed ones
// included. `check_writes.mjs` reads `schema.sql` and this file together now.
//
// Nothing here imports anything.

/** The eight instant fields, each stored as a `timestamptz` and an offset. */
const INSTANTS = ["due_at", "earliest_start", "first_due_at", "created_at", "updated_at", "closed_at",
                  "alarm_snoozed_until", "alarm_unanswered_at"];

export const offsetOf = (iso) => (iso ? iso.slice(-6) : null);

/**
 * EVERY COLUMN `cascade_task` HAS, and the only fields a row is built from.
 *
 * A SECOND INVENTORY, DELIBERATELY, and the same answer as the `sw.js`
 * pre-cache list in session 142: a list that duplicates another list is fine
 * exactly when a check holds the two together, and `check_writes.mjs` reads
 * `schema.sql` and fails if this one drifts from it in either direction.
 *
 * WHY IT EXISTS AT ALL (session 152). `toRow` was `{ ...task, owner }`, so
 * whatever the engine happened to put on a record went to Postgres. `fromEvent`
 * put `due_phrase` on one — a working value, with no column — PostgREST refused
 * the whole row, and because the outbox stops at the first failure to keep its
 * order, ONE imported task blocked every write behind it for hours. Typed ones
 * included. The only sign on the phone was a pill reading `5 waiting`, in green.
 *
 * It is not here to let fields be dropped quietly. It is here so that a field
 * with no column fails a CHECK on this machine instead of a phone's outbox:
 * the list cannot gain a column the schema lacks, and the engine cannot gain a
 * field this list lacks, without a check going red.
 */
export const TASK_COLUMNS = [
  "id", "owner",
  "raw_text", "chip_spans", "config_version",
  "title", "normalised", "verb_phrase", "action_verb",
  "commitment_type", "type_source", "context",
  "significance", "est_duration_min", "duration_source",
  "date_phrase", "date_spans", "date_hedge", "date_marker",
  "date_precision", "date_anchor", "date_firmness", "has_time",
  "due_at", "due_at_offset", "earliest_start", "earliest_start_offset",
  "task_state", "archived", "pinned", "notes", "recurrence",
  "alarm_type", "alarm_lead_min",
  "alarm_snoozed_until", "alarm_snoozed_until_offset",
  "alarm_unanswered_at", "alarm_unanswered_at_offset",
  "reminder_fatigue",
  "blocked", "blocker_reason", "blocker_ref", "project_id",
  "push_count", "first_due_at", "first_due_at_offset", "spawned_from",
  "calendar_uid", "calendar_detached",
  "created_at", "created_at_offset", "updated_at", "updated_at_offset",
  "closed_at", "closed_at_offset",
];
const COLUMN_SET = new Set(TASK_COLUMNS);

/**
 * A record into a row. The instant goes to Postgres as an absolute moment,
 * which is what comparing wants; the offset goes beside it, which is what
 * reading it back as the person meant wants. Dropping the offset would move
 * every band boundary, because `deadline_band` is a local calendar day.
 */
export function toRow(task, owner) {
  const row = { owner };
  // BUILT FROM THE COLUMN LIST, not from whatever the record happens to carry.
  for (const k of Object.keys(task)) if (COLUMN_SET.has(k)) row[k] = task[k];
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
