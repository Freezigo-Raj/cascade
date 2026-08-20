// Cascade Part A — repeats that the calendar walked past.
//
// HIS CALL, session 125, on the three options: step it forward on open.
//
// THE DEFECT IT CLOSES. A repeat spawns its next occurrence when this one is
// marked done, and only then. Nothing marks it done if the alarm rang out
// unanswered, and `syncAlarms()` never arms an instant that has already gone —
// so a weekly task slept through once sat overdue for ever, silent, with no
// next occurrence anywhere and nothing on any screen able to say when it would
// next ring. One missed chain ended a series.
//
// WHAT THIS DOES, AND ONLY THIS. On app open, an occurrence whose own date plus
// one whole interval has passed is CLOSED AS CANCELLED, and the schedule's next
// future date is spawned. Cancelled and not done, because it was not done: a
// cancelled row carries `closed_at` and shows on the Done tab beside the
// finished ones (`cards.js` reads both states), so the miss stays visible and
// countable rather than being quietly deleted.
//
// ONE INTERVAL, NOT ONE MINUTE. A weekly task an hour late is still this week's
// task. The test is in `overtaken()` and it asks whether the NEXT scheduled
// date has itself arrived.
//
// WHAT IT DOES NOT DO:
//   - It never touches a one-off task. No date the person typed is moved; the
//     only dates it writes are ones the recurrence rule already implied.
//   - It never runs on a done, cancelled or archived row.
//   - It takes NO UNDO SLOT. Undo holds one entry and it belongs to the last
//     thing a PERSON did; spending it on a write nobody asked for would mean
//     opening the app silently discarded the undo they were about to use.
//     Cost accepted, and stated: this write cannot be undone by pressing Undo.
//     The cancelled row is still there to reopen.
//
// TWO DEVICES OPENING AT ONCE both roll the same task forward and both add an
// occurrence, because `add` writes a fresh id and nothing dedupes. The id is
// derived from the task and its new date instead, so both devices compute the
// SAME id and newest-wins collapses them into one row. That is the same rule
// the rest of the store lives under.

const v = new URL(import.meta.url).search;
const { overtaken, spawn } = await import(`./repeat.js${v}`);
const { alarmCleared } = await import(`./alarm.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);

/**
 * A uuid-shaped id derived from the closed occurrence and the date it hands
 * on, so two devices doing this at the same moment write one row rather than
 * two. Not a v4: it is a function of its inputs on purpose, which is the whole
 * point of it.
 */
function derivedId(seed) {
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
 * Called once at start, before the alarms are armed, so the arming pass sees
 * the occurrence that is actually next rather than the one time forgot.
 *
 * THE STORE IS HANDED IN, NOT IMPORTED (session 127). While this file imported
 * `store.select.js`, no check could import this file — and a write path no
 * check can reach is exactly what cost four lost lock-screen outcomes in
 * session 123. `check_writes.mjs` hands in a store that records the shape of
 * every call.
 *
 * @param {object} store  the four-call task store: all / add / update / remove.
 * @returns {number} how many series were moved on, for the caller to say or
 *                   ignore. It says nothing itself: a screen is the screen's
 *                   question.
 */
export async function catchUpRepeats(store) {
  const all = await store.all();
  const now = nowLocal();
  let moved = 0;
  for (const task of all) {
    if (!overtaken(task, now)) continue;
    const closed = alarmCleared({
      ...task,
      task_state: "cancelled",
      closed_at: now,
      updated_at: now,
    });
    const next = spawn({ ...closed }, derivedId(`${task.id}:${task.due_at}`), now);
    // No next date means a rule that cannot step — a malformed interval. The
    // occurrence is left exactly as it was rather than being closed with
    // nothing to replace it, which would delete a commitment to fix a bug.
    if (!next) continue;
    await store.update(task.id, closed);
    await store.add(next);
    moved++;
  }
  return moved;
}
