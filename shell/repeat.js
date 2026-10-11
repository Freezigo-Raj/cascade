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
//
// MINUTES AND HOURS ARE UNITS TOO (session 160, his words: "I need repeat in
// minutes as well instead of just days, weeks, etc."). Two words in a list, and
// one real consequence: every walk through this schedule was written while the
// smallest step was a day, and a count guard was allowed to stand in for a
// clock guard because 500 days is longer than anything anybody would leave a
// task open. At five-minute steps that guard is 42 hours, and both walks —
// `nextDue` here and `nextRing` in `alarm.js` — returned NOTHING past it: a
// series that stopped producing occurrences and an alarm that stopped saying
// when it would ring, from a repeat left alone over a weekend. `advanceTo`
// below lands on the answer instead of walking to it, so there is no count to
// outlive.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * THE UNITS THAT ARE A FIXED NUMBER OF MILLISECONDS, and the reason the two
 * kinds are kept apart. A week is always 7 days; a month is 28, 29, 30 or 31
 * and a year is 365 or 366, so those two have to be stepped through the
 * calendar one at a time and cannot be multiplied.
 *
 * `week` was already arithmetic in `step`. Naming the set is what lets
 * `advanceTo` know which half it is in.
 */
const FIXED = { minute: MINUTE, hour: HOUR, day: DAY, week: 7 * DAY };

// For the sentence at the bottom of this file. Spelt out rather than taken from
// `toLocaleString`, which would make what the app says depend on the phone's
// language setting while every other word in it is English.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const nth = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

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
 * 1 Mar by the same Date.UTC rollover months already rely on).
 *
 * `minute` and `hour` joined `day` and `week` in session 160 by joining
 * `FIXED`, and this function did not otherwise change: the arithmetic for an
 * interval of fixed length was already one multiplication. */
export function step(at, rule) {
  const n = rule.every ?? 1;
  const fixed = FIXED[rule.unit];
  if (fixed) return at + n * fixed;
  const d = new Date(at);
  const months = rule.unit === "year" ? n * 12 : n;
  return Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()
  );
}

/**
 * THE FIRST INSTANT OF THE SCHEDULE THAT IS PAST `limit`, AND AT LEAST ONE STEP
 * ON FROM `start`. The one piece of arithmetic both walks now share.
 *
 * WHAT IT REPLACES, and why the shape of the old code was the defect rather
 * than any value in it. `nextDue` and `alarm.js`'s `nextRing` each held a loop
 * that took one step at a time until the date was ahead of the clock, capped at
 * 500 and 5000 steps. Each cap was written as a guard against a malformed rule
 * — `every 0 months` would step nowhere and spin — and each was a count where
 * the thing being guarded is a duration. While the smallest unit was a day that
 * distinction cost nothing. `every 5 minutes` makes 500 steps 42 hours, and
 * past the cap both functions returned `null`: no next occurrence, and no next
 * ring, for a repeat nobody had touched since Friday.
 *
 * So the number of steps is computed rather than counted. For a unit of fixed
 * length it is one division: the first multiple of the interval that clears the
 * limit. A month and a year have no fixed length, so those are still walked —
 * but a walk through months cannot be outlived by a clock, because the cap of
 * 1200 is a hundred years.
 *
 * AT LEAST ONE STEP, ALWAYS, which is the rule the comment on `nextDue` below
 * explains and the reason this takes `start` and `limit` rather than asking
 * which is larger. A monthly rent paid on the 28th and due the 1st must step to
 * next month, not stay where it is.
 *
 * @returns {number|null} milliseconds, or null if the rule cannot move.
 */
export function advanceTo(start, rule, limit) {
  if (!rule || !rule.unit) return null;
  const n = rule.every ?? 1;
  const fixed = FIXED[rule.unit];
  if (fixed) {
    const size = n * fixed;
    // `!(size > 0)` and not `size <= 0`: it also refuses NaN, which is what
    // `every: "soon"` out of a jsonb column arrives as.
    if (!(size > 0)) return null;
    // Minimal, and provably so: `floor(d / size)` steps leave the date at or
    // before the limit and one more clears it. When `start` is already past
    // the limit the quotient is negative and the `max` makes it the one step
    // the rule above demands.
    const steps = Math.max(1, Math.floor((limit - start) / size) + 1);
    return start + steps * size;
  }
  let at = start;
  for (let i = 0; i < 1200; i++) {
    at = step(at, rule);
    if (at > limit) return at;
  }
  return null;
}

/**
 * THE REPEAT AS ONE SENTENCE — `every week on Tuesday at 3pm` (session 123, his
 * slide) — and it lives here rather than on the screen that shows it.
 *
 * It was `repeatSentence` inside `mvp.panel.js` until session 160, which is the
 * one layer no check can reach. Two things made moving it the cheaper option:
 * the detail panel was writing its own second version, `every 2 day`, with no
 * plural and no reading of the anchor; and minutes made the wording a decision
 * rather than a formatting job. The rule for READING a recurrence belongs
 * beside the rule for STEPPING one, and this file imports nothing, so a check
 * can now assert the words.
 *
 * `at 3pm` NAMES THE ONLY TIME IT HAPPENS, which is true of a week, a month and
 * a year and false of anything shorter than a day. `every 30 minutes at 3pm`
 * would read as a single daily event. The anchor is where the chain starts, so
 * it says `from`.
 *
 * `dueAt` is read as the wall clock it is written as, with no offset applied —
 * the same reading the rest of the app gives a stored instant.
 */
export function sentenceFor(rule, dueAt, hasTime) {
  if (!rule || !rule.unit) return null;
  const n = rule.every ?? 1;
  const base = n === 1 ? `every ${rule.unit}` : `every ${n} ${rule.unit}s`;
  // A repeat set before a date is the panel's own order of events: the chip
  // that wears this sentence would otherwise be blank, which is the one state
  // a control explaining itself must not have.
  if (!dueAt) return base;
  const d = new Date(dueAt.slice(0, 19));
  let when = "";
  if (rule.unit === "week") when = ` on ${WEEKDAYS[d.getDay()]}`;
  if (rule.unit === "month") when = ` on the ${nth(d.getDate())}`;
  if (rule.unit === "year") when = ` on ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const clock = hasTime
    ? `${((d.getHours() + 11) % 12) + 1}${d.getMinutes() ? ":" + String(d.getMinutes()).padStart(2, "0") : ""}${d.getHours() < 12 ? "am" : "pm"}`
    : "";
  const within = rule.unit === "minute" || rule.unit === "hour";
  return base + when + (clock ? `${within ? " from " : " at "}${clock}` : "");
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
  // THE WALK IS GONE (session 160). It was a 500-step loop, which is 500 days
  // at the smallest unit this file had and 42 hours at the smallest it has now.
  // `advanceTo` computes the landing point and carries the at-least-one-step
  // rule the paragraph above is about.
  const at = advanceTo(parse(anchor), rule, parse(now));
  return at == null ? null : write(at, offset);
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
