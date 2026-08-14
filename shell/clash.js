// Cascade Part A — timed tasks that collide.
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
