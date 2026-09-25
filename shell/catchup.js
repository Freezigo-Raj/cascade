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
// derived from the task and its date instead, so both devices compute the SAME
// id and newest-wins collapses them into one row.
//
// THAT REASONING WAS RIGHT AND ITS SCOPE WAS TOO SMALL (session 143). The race
// is not between devices; it is between anything that can close the same
// occurrence, and by session 128 there were four of those. `successorId()` and
// `addSuccessor()` live in `repeat.js` now and every closer uses them, so one
// closed occurrence can produce only one successor. The derivation is the same,
// so rows this file has already created keep their ids.

const v = new URL(import.meta.url).search;
const { overtaken, spawn, successorId, addSuccessor } = await import(`./repeat.js${v}`);
const { alarmCleared } = await import(`./alarm.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);

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
    const next = spawn({ ...closed }, successorId(task), now);
    // No next date means a rule that cannot step — a malformed interval. The
    // occurrence is left exactly as it was rather than being closed with
    // nothing to replace it, which would delete a commitment to fix a bug.
    if (!next) continue;
    await store.update(task.id, closed);
    await addSuccessor(store, next, all);
    moved++;
  }
  return moved;
}
