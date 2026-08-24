// Cascade Part A — an outcome becomes a record.
//
// IT LEFT `alarm.bridge.js` IN SESSION 127 AND THE REASON IS THE DEFECT ITSELF.
// Session 123: every branch of `apply()` called `update(record)` where the
// store's contract is `update(id, record)`. The store threw, the throw landed
// in a catch, and lock-screen Done, Push, Snooze and the unanswered escalation
// all wrote NOTHING. Four outcomes, silently lost, for four days.
//
// `check_alarm.mjs` walked straight past it, and could not have done otherwise:
// the bridge imports the real store at module load, so no check could import
// the bridge at all, and every assertion it made was about pure functions that
// were all perfectly correct. The bug was in the CALL, not in the values.
//
// So this file takes the store as an argument and imports none. That is the
// whole seam, and it is what lets `check_writes.mjs` hand in a store that
// records the shape of every call it receives — which is the only kind of check
// that could ever have caught what happened.
//
// Nothing else moved. The rules below are the ones the bridge has held since
// session 111, comments included.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { snoozed, unanswered } = await import(`./alarm.js${v}`);
const { pushed } = await import(`./push.js${v}`);
const { spawn } = await import(`./repeat.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);

/**
 * A stored instant as epoch milliseconds, OFFSET INCLUDED.
 *
 * IT USED TO DROP THE OFFSET (session 130, his report: "Revive works, but after
 * syncing it comes back to Done"). `Date.parse(iso.slice(0,19) + "Z")` reads a
 * local wall clock as if it were UTC, which for +05:30 lands five and a half
 * hours LATE. `DONE` stamps `updated_at` with
 * `max(tsMs, ms(updated_at) + 1000, Date.now())`, so every lock-screen Done
 * wrote a timestamp five and a half hours in the future — and `schema.sql`'s
 * `cascade_task_newer_wins` trigger drops any later write carrying a smaller
 * one. The revive was correct, reached the server, and was silently returned as
 * OLD; the next pull put the task back in Done. Every write to that task was
 * blocked until the clock caught up, and each Done pushed the wall further out.
 *
 * The bridge and the alarms screen have always read the offset. This file was
 * the one place that did not, and it is the one place whose number goes into a
 * comparison the database makes.
 */
const ms = (iso) => {
  const off = iso.slice(-6);
  const sign = off[0] === "-" ? -1 : 1;
  const mins = sign * (Number(off.slice(1, 3)) * 60 + Number(off.slice(4, 6)));
  return Date.parse(iso.slice(0, 19) + "Z") - mins * 60000;
};

/**
 * A press, or the end of a chain, becomes a record.
 *
 * DONE is stamped past whatever the local copy carries, so newest-wins cannot
 * resurrect a task somebody finished at the lock screen. That is the one place
 * this app writes a time that is not the clock, and the reason is that the
 * alternative is a completed task coming back.
 *
 * SNOOZE and UNANSWERED are ordinary writes at the outcome's own instant. If
 * another device moved the task's date in between, the push cleared the snooze
 * and the marker, and newest-wins settles which of the two happened last. That
 * is the same rule everything else in the store lives under.
 */
/**
 * @param {object} store  the four-call task store — `all`, `add`, `update`,
 *                        `remove`. Handed in, never imported (see above).
 * @param {string} newId  a fresh id for a spawned occurrence. Handed in for the
 *                        same reason: `crypto.randomUUID()` inside made the one
 *                        interesting branch unassertable.
 */
export async function applyOutcome(store, id, verb, tsMs, newId) {
  const all = await store.all();
  const task = all.find((t) => t.id === id);
  // A task deleted while its alarm was pending. Nothing to write, and the
  // ringing already stopped.
  if (!task) return;
  const now = isoAt(tsMs, task);

  if (verb === "DONE") {
    const stamp = isoAt(Math.max(tsMs, ms(task.updated_at ?? now) + 1000, Date.now()), task);
    // update(id, record) — every branch here once passed the record alone, the
    // store threw `is not here` into a catch, and lock-screen Done, Push,
    // Snooze and the unanswered escalation all wrote NOTHING (session 123).
    await store.update(task.id, {
      ...task,
      task_state: "done",
      closed_at: now,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      updated_at: stamp,
    });
    // A LOCK-SCREEN DONE IS A DONE: a repeat spawns its next occurrence here
    // exactly as it does from the list (session 123 — before this, only the
    // in-app press spawned, so a weekly task closed from the alarm screen
    // silently ended its series).
    const next = spawn({ ...task, task_state: "done" }, newId, now);
    if (next) await store.add(next);
    return;
  }
  if (verb.startsWith("PUSH:")) {
    // The target travels whole, offset included, because a due date is a local
    // instant and rebuilding one from epoch milliseconds would drop the zone.
    const to = verb.slice("PUSH:".length);
    await store.update(task.id, pushed(task, to, now));
    return;
  }
  if (verb.startsWith("SNOOZE")) {
    const mins = Number(verb.split(":")[1]) || partAConfig.alarm_defaults.auto_snooze_min;
    await store.update(task.id, snoozed(task, mins, now));
    return;
  }
  if (verb === "UNANSWERED") {
    await store.update(task.id, unanswered(task, now));
    return;
  }
  // CANCEL THIS ONE (session 128, his slide: "a button to cancel task instance
  // — repeat instances of the task will still stay"). It is the catch-up's
  // move made by hand: the occurrence is closed as CANCELLED, not done, because
  // it was not done — and a repeat immediately gets the next one, so cancelling
  // tonight's run does not end the habit. A one-off simply closes.
  if (verb === "CANCEL") {
    const stamp = isoAt(Math.max(tsMs, ms(task.updated_at ?? now) + 1000, Date.now()), task);
    const closed = {
      ...task,
      task_state: "cancelled",
      closed_at: now,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      updated_at: stamp,
    };
    await store.update(task.id, closed);
    const next = spawn({ ...closed }, newId, now);
    if (next) await store.add(next);
    return;
  }
  // CANCEL THE ALARM, NOT THE TASK (session 128, his slide: "add option to
  // cancel alarm — repeat instances of task with alarm still ring"). It stops
  // THIS ring and touches nothing else: not `alarm_type`, which would end the
  // series, and not the date, which would move a commitment to silence a noise.
  // The shell cancels the pending alarm; the next occurrence arms itself on the
  // next sync, because a repeat's ring follows its rule (session 126).
  if (verb === "DISMISS") {
    await store.update(task.id, {
      ...task,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      updated_at: isoAt(Math.max(tsMs, Date.now()), task),
    });
  }
}

/** An epoch instant written at the task's own offset, so a local day survives. */
function isoAt(t, task) {
  const off = (task.due_at ?? task.created_at ?? nowLocal()).slice(-6);
  const sign = off[0] === "-" ? -1 : 1;
  const mins = sign * (Number(off.slice(1, 3)) * 60 + Number(off.slice(4, 6)));
  const d = new Date(t + mins * 60000);
  return d.toISOString().slice(0, 19) + off;
}

