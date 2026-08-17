// Cascade Part A — tasks that collide, in the two ways they can.
//
// Two tasks clash when both name a time and their windows overlap. The window
// is `due_at` to `due_at + est_duration_min`, which means the check runs on a
// guess: `est_duration_min` is a per-verb default, not a measurement. `call
// kushan at 5pm` and `meet supplier at 5:15pm` clash only because `call`
// defaults to fifteen minutes and nobody said so.
//
// That is his call, taken over the alternative of clashing on stated times
// alone, and the cost is recorded in spec.md. What follows from it here is the
// wording: the quiet-fields rule says duration is never shown, so the warning
// names the other task and its time and never the overlap. A warning that
// cannot state its own arithmetic is the shape this decision produces.

const MIN = 60 * 1000;
const at = (iso) => Date.parse(iso.slice(0, 19) + "Z");

/**
 * Only a task anchored at a point can collide. An `end` anchor is 23:59:59, a
 * deadline rather than an occupied slot, and treating one as a booking would
 * make every task due today clash with every other.
 */
function occupies(t) {
  return Boolean(
    t && t.task_state === "ready" && !t.archived &&
    t.has_time && t.due_at && t.date_anchor === "point"
  );
}

/** `5pm` / `5:30pm`, the same clock the card sentence uses. */
function clock(iso) {
  const d = new Date(at(iso));
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

/**
 * Every stored task whose window overlaps this one's. Half-open, like every
 * other window in this project: a task ending exactly when another starts does
 * not clash, because back to back is not a collision.
 *
 * @param {object} task      the task being added, edited or pushed
 * @param {Array} existing   every stored task
 * @returns {Array} the tasks it collides with, earliest first
 */
export function readClashes(task, existing) {
  if (!occupies(task) || !Array.isArray(existing)) return [];
  const start = at(task.due_at);
  const end = start + (task.est_duration_min ?? 0) * MIN;
  return existing
    .filter((t) => t.id !== task.id && occupies(t))
    .filter((t) => {
      const s = at(t.due_at), e = s + (t.est_duration_min ?? 0) * MIN;
      return start < e && s < end;
    })
    .sort((a, b) => at(a.due_at) - at(b.due_at));
}

/**
 * `"meet supplier" is at 5pm.` / `"meet supplier" and 2 others are at 5pm.`
 *
 * No minutes, no overlap length, no "for 30 minutes": duration is the engine's
 * and the reader never sees it, so the sentence names the collision and not the
 * arithmetic behind it.
 */
export function readClashDialog(clashes) {
  if (!clashes.length) return null;
  const first = clashes[0];
  const rest = clashes.length - 1;
  const others = rest ? ` and ${rest} other${rest === 1 ? "" : "s"}` : "";
  const verb = rest ? "are" : "is";
  return `"${first.title}"${others} ${verb} at ${clock(first.due_at)}.`;
}

// ------------------------------------------------- two hard deadlines, one day
//
// A hard deadline does not occupy a slot, so the check above can never see one:
// an `end` anchor is 23:59:59 and treating it as a booking would make every task
// due today clash with every other. That is right for a meeting and wrong for a
// promise. Two things promised by Friday are a collision whether or not either
// one names an hour, and the collision is the DAY.
//
// So this is a second check with a different shape, not a widening of the first.
// It runs on the local calendar day, ignores times entirely, and fires only
// where both tasks are hard: a normal date is a plan and may be moved, and
// warning about two of those would fire on an ordinary Tuesday.

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight of the instant, as a number. The offset is already in the string. */
const midnight = (iso) => Math.floor(at(iso) / DAY_MS) * DAY_MS;

/**
 * `today` / `tomorrow` / `Friday` / `20 Aug`, the same rule the card sentence
 * uses inside `readDuePhrase`.
 *
 * This is the SECOND copy of that rule, and it is a copy on purpose rather than
 * by accident: `readDuePhrase` names a day inside a phrase it also builds a
 * clock and a hedge for, and pulling the day out of it is a change to a function
 * six key sections depend on. The two must be merged the first time they
 * disagree, and this comment is where the third copy gets refused.
 */
export function dayWord(iso, nowIso) {
  const start = midnight(iso), today = midnight(nowIso);
  if (start === today) return "today";
  if (start === today + DAY_MS) return "tomorrow";
  const d = new Date(at(iso));
  // Inside the coming week the weekday is unambiguous; past that it is not.
  const untilMonday = (7 - ((new Date(today).getUTCDay() + 6) % 7)) * DAY_MS;
  if (start > today && start < today + untilMonday) return DAYS[d.getUTCDay()];
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** A promise, rather than a plan: hard, open, and carrying a date. */
function promises(t) {
  return Boolean(
    t && t.task_state === "ready" && !t.archived &&
    t.due_at && t.date_firmness === "hard"
  );
}

/**
 * Every open hard deadline already due on this one's day, earliest first.
 *
 * @param {object} task      the task being added, edited or pushed
 * @param {Array} existing   every stored task
 */
export function readDeadlineClashes(task, existing) {
  if (!promises(task) || !Array.isArray(existing)) return [];
  const day = midnight(task.due_at);
  return existing
    .filter((t) => t.id !== task.id && promises(t) && midnight(t.due_at) === day)
    .sort((a, b) => at(a.due_at) - at(b.due_at));
}

/**
 * `"file GSTR-1" is also due Friday.` / `"file GSTR-1" and 2 others are also
 * due Friday.`
 *
 * `also` is the whole of the warning: it says another promise already sits on
 * that day and says nothing about whether the day can hold both. It cannot say
 * that — the day's load is a sum of `est_duration_min`, which is a per-verb
 * default, and the quiet-fields rule means the reader never sees it.
 */
export function readDeadlineDialog(clashes, nowIso) {
  if (!clashes.length) return null;
  const first = clashes[0];
  const rest = clashes.length - 1;
  const others = rest ? ` and ${rest} other${rest === 1 ? "" : "s"}` : "";
  const verb = rest ? "are" : "is";
  return `"${first.title}"${others} ${verb} also due ${dayWord(first.due_at, nowIso)}.`;
}
