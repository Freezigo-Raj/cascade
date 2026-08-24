// Cascade — the write paths, checked against a store that watches how it is called.
//
// WHY THIS EXISTS, and it is the plainest lesson this project has learned.
//
// Session 123: every branch of the alarm's `apply()` called `update(record)`
// where the store's contract is `update(id, record)`. The store threw, the
// throw landed in a catch, and lock-screen Done, Push, Snooze and the
// unanswered escalation all wrote NOTHING for four days. Six checks were green
// the whole time. They could not have been anything else: every value those
// branches computed was correct, and the bug was in the CALL.
//
// Two things had to change before a check could exist at all. The write paths
// now take the store as an ARGUMENT (`alarm.apply.js`, `catchup.js`, session
// 127) instead of importing it, and this file hands in a store that records the
// shape of every call it receives. An assertion about a returned value could
// never have caught session 123's defect. An assertion about the call can.
//
// WHAT IT COVERS: the four alarm outcomes, and the repeat catch-up. Both were
// listed in spec.md as reached by no check — the first since session 123, the
// second since the session that built it.
//
// Run: node shell/check_writes.mjs

import { partAConfig as config } from "./config.js";
import { applyOutcome } from "./alarm.apply.js";
import { catchUpRepeats } from "./catchup.js";

let bad = 0;
const say = (ok, what) => {
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
};

/**
 * The store, and a witness to how it was called.
 *
 * `update` asserts its own arity, which is the whole point of this file: an id
 * that is not a string, or a second argument that is not a record, is the
 * session-123 defect and it fails HERE rather than silently in a catch three
 * layers up.
 */
function fakeStore(rows) {
  const calls = [];
  const db = new Map(rows.map((r) => [r.id, { ...r }]));
  return {
    calls,
    rows: () => [...db.values()],
    async all() { calls.push(["all"]); return [...db.values()].map((r) => ({ ...r })); },
    async add(rec) {
      calls.push(["add", rec]);
      if (!rec || typeof rec !== "object" || typeof rec.id !== "string") {
        throw new Error("add(record) needs a record carrying an id");
      }
      db.set(rec.id, { ...rec });
    },
    async update(id, rec) {
      calls.push(["update", id, rec]);
      if (typeof id !== "string") throw new Error("update(id, record): id was not a string");
      if (!rec || typeof rec !== "object") throw new Error("update(id, record): record was missing");
      if (!db.has(id)) throw new Error(`update: ${id} is not here`);
      db.set(id, { ...rec });
    },
    async remove(id) {
      calls.push(["remove", id]);
      if (typeof id !== "string") throw new Error("remove(id): id was not a string");
      db.delete(id);
    },
  };
}

const NOW_MS = Date.parse("2026-08-20T17:00:00Z");

function task(over = {}) {
  return {
    id: "t1", title: "Pay the vendor", raw_text: "Pay the vendor at 5pm",
    normalised: "pay the vendor", compare_key: "pay the vendor",
    commitment_type: "deadline", type_source: "rule", significance: 30,
    due_at: "2026-08-20T17:00:00+05:30", earliest_start: null, has_time: true,
    date_precision: "time", date_firmness: "hard", date_anchor: "point",
    est_duration_min: 30, duration_source: "default",
    recurrence: null, alarm_type: "on", alarm_lead_min: null,
    alarm_snoozed_until: null, alarm_unanswered_at: null, reminder_fatigue: 0,
    notes: "", push_count: 0, first_due_at: null, spawned_from: null,
    task_state: "ready", archived: false, pinned: false, closed_at: null,
    created_at: "2026-08-20T09:00:00+05:30", updated_at: "2026-08-20T09:00:00+05:30",
    ...over,
  };
}

const updates = (s) => s.calls.filter((c) => c[0] === "update");
const adds = (s) => s.calls.filter((c) => c[0] === "add");

// ------------------------------------------------------------------ the four
{
  // DONE. The branch that lost the most: a completion, and a repeat's next
  // occurrence, both gone.
  const store = fakeStore([task({ recurrence: { every: 1, unit: "week" } })]);
  await applyOutcome(store, "t1", "DONE", NOW_MS, "t2");
  const [call] = updates(store);
  say(Boolean(call), "DONE writes");
  say(call && call[1] === "t1", "and it passes the id FIRST — the session-123 defect");
  const wrote = store.rows().find((r) => r.id === "t1");
  say(wrote.task_state === "done" && Boolean(wrote.closed_at), "the task is closed");
  say(wrote.alarm_snoozed_until === null && wrote.alarm_unanswered_at === null,
      "and carries no snooze or unanswered marker away with it");
  say(Date.parse(wrote.updated_at.slice(0, 19)) > Date.parse("2026-08-20T09:00:00"),
      "stamped past the local copy, so newest-wins cannot resurrect it");
  say(adds(store).length === 1, "a repeat spawns its next occurrence from the lock screen too");
  const next = adds(store)[0][1];
  say(next.id === "t2" && next.spawned_from === "t1", "and the new row names the one it came from");
}

{
  // PUSH. The target travels whole, offset included.
  const store = fakeStore([task()]);
  await applyOutcome(store, "t1", "PUSH:2026-08-21T17:00:00+05:30", NOW_MS, "t2");
  const [call] = updates(store);
  say(call && call[1] === "t1", "PUSH passes the id first");
  const wrote = store.rows()[0];
  say(wrote.due_at === "2026-08-21T17:00:00+05:30", "and moves the date to the target it was given");
  say(wrote.push_count === 1, "counting the push");
  say(wrote.first_due_at === "2026-08-20T17:00:00+05:30", "and recording where the occurrence started");
}

{
  // SNOOZE. Moves the telling and nothing else.
  const store = fakeStore([task()]);
  await applyOutcome(store, "t1", "SNOOZE:10", NOW_MS, "t2");
  const wrote = store.rows()[0];
  say(updates(store)[0][1] === "t1", "SNOOZE passes the id first");
  say(Boolean(wrote.alarm_snoozed_until), "and sets the snooze");
  say(wrote.due_at === "2026-08-20T17:00:00+05:30", "leaving the task's own date alone");
  say(wrote.alarm_unanswered_at === null, "and clearing any unanswered marker");
}

{
  // UNANSWERED. The end of the auto-snooze chain, which no person ever presses.
  const store = fakeStore([task({ alarm_snoozed_until: "2026-08-20T17:30:00+05:30" })]);
  await applyOutcome(store, "t1", "UNANSWERED", NOW_MS, "t2");
  const wrote = store.rows()[0];
  say(updates(store)[0][1] === "t1", "UNANSWERED passes the id first");
  say(Boolean(wrote.alarm_unanswered_at), "and records that nobody answered");
  say(wrote.alarm_snoozed_until === null, "clearing the spent snooze");
  say(wrote.reminder_fatigue === 1, "and counting it once");
}

{
  // A task deleted while its alarm was pending. Nothing to write, and no throw.
  const store = fakeStore([task()]);
  await applyOutcome(store, "gone", "DONE", NOW_MS, "t2");
  say(updates(store).length === 0 && adds(store).length === 0,
      "an outcome for a task that no longer exists writes nothing and does not throw");
}

// ------------------------------------------------------------- the catch-up
{
  // A weekly repeat the calendar walked past, and one it has not.
  const past = new Date(Date.now() - 20 * 86400000);
  const p = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00:00+05:30`;
  const store = fakeStore([
    task({ id: "old", due_at: iso(past), recurrence: { every: 1, unit: "week" } }),
    task({ id: "fresh", due_at: iso(new Date(Date.now() + 86400000)), recurrence: { every: 1, unit: "week" } }),
    task({ id: "once", due_at: iso(past) }),
  ]);
  const moved = await catchUpRepeats(store);
  say(moved === 1, "one series is moved on, and only the one");
  const closed = store.rows().find((r) => r.id === "old");
  say(closed.task_state === "cancelled" && Boolean(closed.closed_at),
      "the stranded occurrence is CANCELLED, not done — it was not done");
  say(updates(store).every((c) => typeof c[1] === "string"), "every write passes its id first");
  const spawned = adds(store)[0][1];
  say(adds(store).length === 1 && spawned.spawned_from === "old", "and one new occurrence is added");
  say(Date.parse(spawned.due_at.slice(0, 19)) > Date.now(), "dated in the future");
  say(store.rows().find((r) => r.id === "fresh").task_state === "ready",
      "a repeat still inside its interval is untouched");
  say(store.rows().find((r) => r.id === "once").task_state === "ready",
      "and a one-off is left where it is, however late");

  // Twice in a row writes nothing the second time, which is what makes it safe
  // to run on every open.
  store.calls.length = 0;
  const again = await catchUpRepeats(store);
  say(again === 0 && updates(store).length === 0, "running it again on the same store changes nothing");
}

// ------------------------------------------------- session 128, the two cancels
{
  // CANCEL on a repeat: this occurrence closes as cancelled and the next one
  // arrives, so calling off tonight's run does not end the habit.
  const store = fakeStore([task({ recurrence: { every: 1, unit: "day" } })]);
  await applyOutcome(store, "t1", "CANCEL", NOW_MS, "t2");
  const wrote = store.rows().find((r) => r.id === "t1");
  say(updates(store)[0][1] === "t1", "CANCEL passes the id first");
  say(wrote.task_state === "cancelled", "the occurrence is cancelled, not done");
  say(Boolean(wrote.closed_at), "and closed, so it shows on the Done tab");
  say(adds(store).length === 1 && adds(store)[0][1].spawned_from === "t1",
      "and the repeat is handed its next occurrence");
}

{
  // CANCEL on a one-off: it closes, and nothing takes its place.
  const store = fakeStore([task()]);
  await applyOutcome(store, "t1", "CANCEL", NOW_MS, "t2");
  say(store.rows()[0].task_state === "cancelled", "a one-off cancels");
  say(adds(store).length === 0, "and spawns nothing");
}

{
  // DISMISS: the RING ends and the task is untouched. Not `alarm_type`, which
  // would end a series; not the date, which would move a commitment to silence
  // a noise.
  const store = fakeStore([task({
    recurrence: { every: 1, unit: "day" },
    alarm_snoozed_until: "2026-08-20T17:30:00+05:30",
  })]);
  await applyOutcome(store, "t1", "DISMISS", NOW_MS, "t2");
  const wrote = store.rows()[0];
  say(updates(store)[0][1] === "t1", "DISMISS passes the id first");
  say(wrote.alarm_type === "on", "the alarm stays ON, so the series keeps ringing");
  say(wrote.due_at === "2026-08-20T17:00:00+05:30", "the date is not moved");
  say(wrote.task_state === "ready", "and the task is still owed");
  say(wrote.alarm_snoozed_until === null, "the spent snooze is cleared");
  say(adds(store).length === 0, "nothing is spawned");
}

console.log(`\n${bad === 0 ? "CHECK WRITES: PASS" : `CHECK WRITES: ${bad} FAILED`}\n`);
process.exit(bad ? 1 : 0);
