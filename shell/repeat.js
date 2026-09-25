// Cascade Part A — repeating tasks.
//
// `recurrence` has been a `Task` field since Stage 2 with nothing writing it.
// It holds an interval and nothing else: `{ every: 1, unit: "month" }`.
//
// Three rules, and each was a choice with a discarded alternative.
//
// **Marking one done spawns the next, and only then.** The alternative was
// rolling one record forward, which breaks two things already built: a weekly
// task done thirty times would show zero times in Done, and `push_count` and
// `first_due_at` would accumulate across occurrences until the drift number
// meant nothing. Spawning on close rather than on schedule means there is never
// more than one open occurrence: three weeks late on a weekly task gives one
// row, not three.
//
// **The next date counts from the schedule, never from when it was done.** Rent
// due the 1st and paid the 4th is next due the 1st. The anchor is the thing the
// repeat is about.
//
// **A push moves one occurrence and leaves the series alone.** Otherwise one
// busy month shifts the rent reminder permanently.

const DAY = 24 * 60 * 60 * 1000;

const parse = (iso) => Date.parse(iso.slice(0, 19) + "Z");
const offsetOf = (iso) => iso.slice(-6);

function write(t, offset) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${offset}`
  );
}

/** One step of the interval, from an instant. Months keep the day of the
 * month; years keep the date (session 123 added `year` — 29 Feb steps to
 * 1 Mar by the same Date.UTC rollover months already rely on). */
export function step(at, rule) {
  const n = rule.every ?? 1;
  if (rule.unit === "day") return at + n * DAY;
  if (rule.unit === "week") return at + n * 7 * DAY;
  const d = new Date(at);
  const months = rule.unit === "year" ? n * 12 : n;
  return Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()
  );
}

/**
 * The next occurrence's due date: the schedule stepped forward from the one
 * just closed until it lands in the future. Stepping from `now` instead would
 * move the anchor every time the task was done late, which is the whole thing
 * the schedule rule exists to prevent.
 *
 * **At least one step, always.** The loop used to run only while the date was
 * in the past, so a repeat finished early — a monthly rent paid on the 28th,
 * due the 1st — took no step at all and spawned a second row on the same date
 * as the one just closed. The next occurrence is the next one; the condition
 * for continuing is that the date is still not in the future, and the condition
 * for starting is nothing.
 */
export function nextDue(task, now) {
  const rule = task.recurrence;
  if (!rule || !rule.unit || !task.due_at) return null;
  // THE SCHEDULE IS THE ANCHOR, AND A PUSH IS NOT THE SCHEDULE (session 125).
  // This function stepped from `due_at`, which `pushed()` had already
  // overwritten, so rent due the 1st and pushed to the 4th repeated on the 4th
  // for ever — the exact drift the paragraph above says this file prevents.
  // `first_due_at` is the date the occurrence was given before any push moved
  // it, so it is the schedule's own date and needs no new field.
  const anchor = task.first_due_at || task.due_at;
  const offset = offsetOf(anchor);
  let at = parse(anchor);
  const limit = parse(now);
  // A guard, not a rule: a malformed interval must not spin here.
  for (let i = 0; i < 500; i++) {
    at = step(at, rule);
    if (at > limit) break;
  }
  return at > limit ? write(at, offset) : null;
}

/**
 * THE ID OF THE OCCURRENCE THIS ONE HANDS ON TO, DERIVED FROM IT (session 143,
 * his report: "repeat tasks get doubled when not responded; I get the same task
 * twice, both overdue, and marking both done gives two more").
 *
 * The id used to be `crypto.randomUUID()` at each call site, and the comment
 * beside one of them said a repeat spawns its next occurrence "here and only
 * here". By session 128 that was false in four places: the list's Done, the
 * lock screen's DONE, the lock screen's CANCEL, and `catchup.js`. Each one
 * closes an occurrence and each one spawns, and with a random id each spawn is
 * a different row.
 *
 * THE DOUBLE HE SAW. An alarm rings, is slept through, and Done is pressed at
 * the lock screen a week later. The outcome sits in the shell's queue. The app
 * opens: `catchUpRepeats` runs FIRST, sees an occurrence the calendar has
 * walked past, cancels it and spawns the next. Then the drain applies the
 * queued DONE to the very same occurrence and spawns again. Two rows, same
 * title, both overdue — and marking each done spawned one more.
 *
 * `catchup.js` already derived its id, so that two devices opening at once
 * would compute the SAME id and newest-wins would collapse them into one row.
 * That reasoning was right and its scope was too small: the race is not between
 * devices, it is between anything that can close the same occurrence. The
 * derivation lives here now and every caller uses it, so ONE CLOSED OCCURRENCE
 * CAN ONLY EVER PRODUCE ONE SUCCESSOR, whoever closes it and however often.
 *
 * Seeded on the occurrence's id and the date it was carrying, which is what
 * `catchup.js` seeded on — so rows it has already created keep their ids.
 *
 * Not a v4. It is a function of its inputs on purpose, which is the whole point
 * of it.
 */
export function successorId(task) {
  const seed = `${task.id}:${task.due_at}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 1), 2654435761) >>> 0;
  }
  const hex = (n) => n.toString(16).padStart(8, "0");
  // `>>> 0` on both: an XOR in JavaScript returns a SIGNED 32-bit integer, and
  // a negative one renders as `-1a2b3c4d` — a minus sign inside a uuid, which
  // the column would refuse and no test that only checked determinism would
  // have caught.
  const a = hex(h1), b = hex(h2);
  const c = hex((h1 ^ 0x9e3779b9) >>> 0), d = hex((h2 ^ 0x7f4a7c15) >>> 0);
  // Version 7 nibble and the variant bits, so it satisfies the same shape
  // `crypto.randomUUID()` produces and the schema's uuid column accepts.
  return `${a}-${b.slice(0, 4)}-7${b.slice(5, 8)}-8${c.slice(1, 4)}-${c.slice(4)}${d}`;
}

/**
 * Add the successor, unless it is already there. The guard is the other half of
 * a derived id: two closers now compute the SAME id, and `store.add` throws on
 * an id that exists, so without this the second closer would throw instead of
 * doubling — which is quieter and no more correct.
 *
 * @returns {boolean} whether a row was written.
 */
export async function addSuccessor(store, next, existing) {
  if (!next) return false;
  const here = existing ?? (await store.all());
  if (here.some((t) => t && t.id === next.id)) return false;
  await store.add(next);
  return true;
}

/**
 * The record for the next occurrence. A fresh id, no history: `push_count` and
 * `first_due_at` describe one occurrence, not the series, which is what makes
 * "pushed six times" mean something.
 *
 * `spawned_from` names the completion that produced it, so pressing Undone on
 * that completion can take it away again. Without it, undoing a done leaves two
 * rows: the one that came back and the one that was created.
 */
export function spawn(closed, newId, now) {
  const due = nextDue(closed, now);
  if (!due) return null;
  return {
    ...closed,
    id: newId,
    due_at: due,
    task_state: "ready",
    closed_at: null,
    push_count: 0,
    first_due_at: null,
    // The next occurrence inherits the schedule and not the history. Without
    // these three, a Tuesday whose alarm was slept through would hold every
    // Wednesday after it at the top of the list for ever.
    alarm_snoozed_until: null,
    alarm_unanswered_at: null,
    reminder_fatigue: 0,
    spawned_from: closed.id,
    created_at: now,
    updated_at: now,
  };
}

/**
 * THE SCHEDULE HAS ALREADY MOVED ON. True when this occurrence's own date plus
 * one interval has passed, which means the series has produced a later
 * occurrence while this one sat open.
 *
 * WHY THIS EXISTS (session 125, his call). A repeat that is never marked done
 * never advances, and `syncAlarms()` never arms an instant that has gone — so
 * one slept-through chain ended a weekly series in silence. Nothing in the app
 * could say when the next ring was, because there was no next occurrence.
 *
 * ONE INTERVAL AND NOT ONE MINUTE. A weekly task overdue by an hour is still
 * this week's task, and moving it would take away a row a person meant to
 * clear. Only when the NEXT scheduled date has itself arrived is this
 * occurrence a thing the schedule has left behind.
 */
export function overtaken(task, now) {
  const rule = task?.recurrence;
  if (!rule || !rule.unit || !task.due_at) return false;
  // The same open test the rest of the engine uses, written out: this file
  // is imported BY `cards.js`'s consumers and by `alarm.js`, and an import back
  // into `cards.js` would be the graph's one cycle. One line, and named here.
  if (task.task_state !== "ready" || task.archived) return false;
  const anchor = task.first_due_at || task.due_at;
  return step(parse(anchor), rule) <= parse(now);
}
