// Cascade Part A — the calendar rules, checked.
//
//   node shell/check_calendar.mjs
//
// IT READS `calendar.js` AND NOTHING ELSE, which is the whole reason that file
// imports nothing. The write path is `calendar.bridge.js`, and that one imports
// the real store, so no check can reach it — the same shape as the alarm, and
// the same reason session 127 cut `alarm.apply.js` out of its bridge.
//
// What this cannot see, stated rather than left to be discovered: whether the
// Kotlin inserts the row, whether an all-day banner lands on the right day in a
// +05:30 zone, and whether Google's sync adapter carries any of it up. Those
// are phone answers. Nothing here compiles Kotlin either.

import { partAConfig as config } from "./config.js";
import { wantsEvent, eventFor, desiredEvents, sameEvent, dateOf } from "./calendar.js";
import { importedId, isOurs, declined, nextPerSeries, notReady, planImport, windowFor } from "./calendar.import.js";

let failed = 0;
const say = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
  if (!ok) failed += 1;
};

const task = (over = {}) => ({
  id: "t1",
  title: "call kushan",
  due_at: "2026-10-15T17:00:00+05:30",
  earliest_start: "",
  has_time: true,
  task_state: "ready",
  archived: false,
  ...over,
});

console.log("\nWHICH TASKS GET AN EVENT — his answer 2: everything with a date.");
{
  say(wantsEvent(task()), "a timed task with a date");
  say(wantsEvent(task({ has_time: false, due_at: "2026-10-15T23:59:59+05:30" })),
      "and a dated one with no time");
  say(!wantsEvent(task({ due_at: "", earliest_start: "" })),
      "an Idea gets nothing — there is no day to draw it on");
  say(wantsEvent(task({ due_at: "", earliest_start: "2026-10-15T09:00:00+05:30" })),
      "a start with no due date is still a date, which is what the Default list says too");
  say(dateOf(task({ due_at: "", earliest_start: "2026-10-15T09:00:00+05:30" }))
        === "2026-10-15T09:00:00+05:30",
      "and the start is the instant it sits at");

  // HIS ANSWER 5: a delete travels. None of these is open, so none is wanted,
  // and the sync's second loop is what takes the event away.
  say(!wantsEvent(task({ task_state: "done" })), "a done task loses its event");
  say(!wantsEvent(task({ task_state: "cancelled" })), "so does a cancelled one");
  say(!wantsEvent(task({ archived: true })), "and an archived one");
  say(!wantsEvent(undefined), "and a row that is not there at all");
}

console.log("\nWHAT THE EVENT SAYS.");
{
  const timed = eventFor(task(), config);
  say(timed.id === "t1", "the id is the TASK's, never the provider's row id");
  say(timed.allDay === false, "a task with a time is a timed event");
  say(timed.endMs - timed.startMs === config.calendar.block_min * 60000,
      "and it is `calendar.block_min` long, not `est_duration_min` — the duration is a quiet field");
  say(timed.startMs === Date.parse("2026-10-15T17:00:00+05:30"),
      "the start is the stored instant, offset and all");
  say(timed.date === null, "a timed event carries no date string");
  say(timed.description.includes("cascade:t1"),
      "the description carries the task id, so a lost map cannot become a second copy");

  const banner = eventFor(task({ has_time: false, due_at: "2026-10-15T23:59:59+05:30" }), config);
  say(banner.allDay === true, "a task with no time is an all-day banner");
  say(banner.date === "2026-10-15", "on the day the stored instant names in its own offset");
  say(banner.startMs === null && banner.endMs === null,
      "and carries no instant — an all-day row is a DATE, and building a midnight here would build it in the wrong zone");

  say(eventFor(task({ title: "" }), config).title === "(untitled)",
      "an empty title still draws something rather than a blank row");
  say(eventFor(task({ due_at: "", earliest_start: "" }), config) === null,
      "and a dateless task makes no event at all");
}

console.log("\nTHE DURATION IS NOT LEAKED.");
{
  const long = eventFor(task({ est_duration_min: 240 }), config);
  const short = eventFor(task({ est_duration_min: 5 }), config);
  say(long.endMs - long.startMs === short.endMs - short.startMs,
      "two tasks the engine guessed very differently draw the same block");
}

console.log("\nTHE SET, AND THE DIFF.");
{
  const all = [
    task(),
    task({ id: "t2", has_time: false, due_at: "2026-10-16T23:59:59+05:30" }),
    task({ id: "t3", due_at: "", earliest_start: "" }),
    task({ id: "t4", task_state: "done" }),
  ];
  const want = desiredEvents(all, config);
  say(want.length === 2, "two of the four belong on the calendar");
  say(want.map((e) => e.id).join() === "t1,t2", "the Idea and the done one are not among them");

  const e = eventFor(task(), config);
  say(sameEvent({ ...e }, e), "an event that already says this is left alone");
  say(!sameEvent({ ...e, title: "call markan" }, e), "a renamed task is rewritten");
  say(!sameEvent({ ...e, startMs: e.startMs + 60000 }, e), "a pushed task is rewritten");
  say(!sameEvent({ ...e, allDay: true }, e), "a task that lost its time is rewritten");
  say(!sameEvent(undefined, e), "and one that is not there yet is written");

  const b = eventFor(task({ has_time: false, due_at: "2026-10-16T23:59:59+05:30" }), config);
  say(sameEvent({ ...b, startMs: 0, endMs: 0 }, b),
      "an all-day row is compared on its DATE, so the zeroes Kotlin sends for the unused fields change nothing");
  say(!sameEvent({ ...b, date: "2026-10-17" }, b), "and a banner moved a day is rewritten");

  // The description carries the id and the marker and neither ever changes, so
  // comparing it could only rewrite a row to change nothing.
  say(sameEvent({ ...e, description: "anything" }, e), "the description is not compared");
}

// ===========================================================================
// THE IMPORT (session 148). Every rule below is one of his five answers.

const NOW = "2026-10-08T12:00:00+05:30";
const NOW_MS = Date.parse(NOW);
const DAY = 86400000;
const ev = (over = {}) => ({
  uid: "e1", title: "standup with raj", description: "", allDay: false,
  startMs: NOW_MS + DAY, endMs: NOW_MS + DAY + 1800000, selfStatus: 1, calendarId: "7",
  ...over,
});

console.log("\nTHE LOOP GATE — two lines, each useless without the other.");
{
  say(isOurs(ev({ description: "From Cascade\ncascade:t1" })),
      "an event this app wrote is recognised by the marker it already carried");
  say(!isOurs(ev()), "and somebody else's event is not");
  say(!wantsEvent({ ...task(), calendar_uid: "e1" }),
      "a task that came FROM an event is never pushed back — the other half of the gate");
  say(wantsEvent(task()), "while a typed task still is");
}

console.log("\nWHAT IS SKIPPED.");
{
  say(declined(ev({ selfStatus: 2 })), "a meeting he declined is not a commitment");
  say(!declined(ev({ selfStatus: 1 })), "and one he accepted is");
  const plan = planImport([ev({ selfStatus: 2 }), ev({ uid: "e2", description: "cascade:t9" })],
                          [], { now: NOW, nowMs: NOW_MS, config });
  say(plan.add.length === 0, "neither reaches the store");
}

console.log("\nTHE ID IS DERIVED, NEVER INVENTED.");
{
  say(importedId("e1", 100) === importedId("e1", 100), "the same event gives the same id twice");
  say(importedId("e1", 100) !== importedId("e1", 200),
      "and two occurrences of one series are two different tasks");
  say(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(importedId("e1", 100)),
      "shaped like the uuid the column accepts, with no minus sign inside it");
}

console.log("\nONE TASK PER SERIES, THE NEXT ONE — his rule.");
{
  const week = [0, 7, 14, 21].map((d) => ev({ startMs: NOW_MS + d * DAY }));
  const first = nextPerSeries(week, []);
  say(first.length === 1, "a weekly standup is ONE row, not four");
  say(first[0].startMs === NOW_MS, "and it is the earliest one in the window");

  // Mark that one done. The next occurrence becomes the live one, exactly as a
  // Cascade repeat does when its occurrence closes.
  const done = { id: importedId("e1", NOW_MS), task_state: "done", archived: false, calendar_uid: "e1" };
  const second = nextPerSeries(week, [done]);
  say(second.length === 1 && second[0].startMs === NOW_MS + 7 * DAY,
      "closing this week's hands over next week's, and only then");

  const allDone = week.map((e) => ({ id: importedId("e1", e.startMs), task_state: "done", archived: false }));
  say(nextPerSeries(week, allDone).length === 0,
      "a series he has finished with for now is not a task at all");

  // An overdue occurrence is still this one's turn.
  const late = [ev({ startMs: NOW_MS - 3 * DAY }), ev({ startMs: NOW_MS + 4 * DAY })];
  say(nextPerSeries(late, [])[0].startMs === NOW_MS - 3 * DAY,
      "a standup missed on Monday is still Monday's, overdue, until he closes it");
}

console.log("\nWHAT AN IMPORTED TASK LOOKS LIKE.");
{
  const plan = planImport([ev()], [], { now: NOW, nowMs: NOW_MS, config });
  const t = plan.add[0];
  say(t.calendar_uid === "e1", "it names the event it came from");
  say(t.calendar_detached === false, "and starts out following it");
  say(t.recurrence === null,
      "NO Cascade repeat rule, even on a repeating event — the calendar hands over the next one itself");
  say(t.task_state === "ready" && t.alarm_type === "none", "open, with no alarm until he asks for one");
  say(t.has_time === true && t.date_precision === "time", "a timed event is an exact time");
  const banner = planImport([ev({ allDay: true, uid: "e9", title: "diwali" })], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  say(banner.has_time === false && banner.date_precision === "day", "an all-day event is a day");
  say(planImport([ev({ title: "lunch with raj friday" })], [], { now: NOW, nowMs: NOW_MS, config })
        .add[0].title === "lunch with raj friday",
      "the title is NEVER parsed for dates — the event already carries the date");
}

console.log("\nFOLLOWING, AND DETACHED.");
{
  const mine = planImport([ev()], [], { now: NOW, nowMs: NOW_MS, config }).add[0];

  // Google moved it. A following task follows.
  const moved = ev({ startMs: NOW_MS + 2 * DAY, title: "standup with raj and divyal" });
  const p1 = planImport([{ ...moved, uid: "e1" }], [{ ...mine, id: importedId("e1", NOW_MS + 2 * DAY) }],
                        { now: NOW, nowMs: NOW_MS, config });
  say(p1.update.length === 1, "a following task takes Google's new title and date");

  // He corrected it himself. Google stops touching it.
  const his = { ...mine, calendar_detached: true, title: "standup, moved" };
  const p2 = planImport([ev()], [his], { now: NOW, nowMs: NOW_MS, config });
  say(p2.update.length === 0, "a DETACHED task is his, and the import leaves it alone");

  // Everything that is his on every task survives a follow.
  const withAlarm = { ...mine, alarm_type: "on", pinned: true, notes: "ask about the pump" };
  const p3 = planImport([ev({ title: "standup, now at ten" })], [withAlarm], { now: NOW, nowMs: NOW_MS, config });
  const after = p3.update[0];
  say(after.alarm_type === "on" && after.pinned === true && after.notes === "ask about the pump",
      "and following only ever rewrites the title and the date — the alarm, the pin and the notes are his");
}

console.log("\nHIS STATE IS NEVER GOOGLE'S.");
{
  const mine = planImport([ev()], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  const closed = { ...mine, task_state: "done", closed_at: NOW };
  const p = planImport([ev()], [closed], { now: NOW, nowMs: NOW_MS, config });
  say(p.update.length === 0 && p.add.length === 0,
      "a task he closed is never reopened by an import, whatever the calendar still holds");
}

console.log("\nGOOGLE DELETES IT — his answer 4, narrowed.");
{
  const mine = planImport([ev()], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  const following = { ...mine };
  const p1 = planImport([], [following], { now: NOW, nowMs: NOW_MS, config });
  say(p1.remove.length === 1, "a task still following goes with the event");

  const edited = { ...following, calendar_detached: true };
  const p2 = planImport([], [edited], { now: NOW, nowMs: NOW_MS, config });
  say(p2.remove.length === 0 && p2.cancel.length === 1,
      "a task he edited is CANCELLED rather than deleted — his work does not vanish because somebody tidied a calendar");
  say(p2.cancel[0].task_state === "cancelled" && Boolean(p2.cancel[0].closed_at),
      "so it shows on the Done tab with Revive");

  // A typed task is not the import's business at all.
  const typed = { ...task(), id: "typed", calendar_uid: "" };
  const p3 = planImport([], [typed], { now: NOW, nowMs: NOW_MS, config });
  say(p3.remove.length === 0 && p3.cancel.length === 0, "and a typed task is never touched by any of this");

  // Outside the window that was read is not the same as missing.
  const far = { ...following, id: "far", due_at: "2027-06-01T09:00:00+05:30" };
  const p4 = planImport([], [far], { now: NOW, nowMs: NOW_MS, config });
  say(p4.remove.length === 0,
      "a task in June is not missing because today's window ended in December");
}

console.log("\nTHE WINDOW — his numbers.");
{
  const w = windowFor(NOW_MS, config);
  say(Math.round((NOW_MS - w.fromMs) / DAY) === 10, "10 days back");
  say(Math.round((w.toMs - NOW_MS) / DAY) === 60, "and 60 forward");
}

// ===========================================================================
// AN EVENT WITH NO STABLE ID (session 149, his first import: `syncid, rowid`).
//
// The same row number is a good identity on a calendar that does not sync and a
// temporary one on a calendar that does, so the rule reads the calendar rather
// than the event alone.

console.log("\nNOT READY — a row number on a syncing calendar is not an identity.");
{
  const google = new Set(["7"]);
  const rowid = ev({ uid: "row:812", uidFrom: "rowid" });

  say(notReady(rowid, google),
      "an event with only a row id, on a GOOGLE calendar, is not ready");
  say(!notReady(rowid, new Set(["9"])),
      "the same event on a calendar that does not sync IS ready — a row id there is as stable as the event");
  say(!notReady(ev({ uidFrom: "syncid" }), google),
      "a Google event id is the same on every device, so it is ready");
  say(!notReady(ev({ uidFrom: "uid2445" }), google), "and so is an iCalendar UID");
  say(!notReady(rowid, undefined),
      "with no calendar list handed in nothing is held — the behaviour before this rule, and the safe direction when the answer is unknown");

  const held = planImport([rowid], [], { now: NOW, nowMs: NOW_MS, config, googleCalendars: google });
  say(held.add.length === 0, "it is not imported");
  say(held.notReady === 1, "and it is COUNTED, because an event that never appears cannot be told from one the window missed");

  const taken = planImport([rowid], [], { now: NOW, nowMs: NOW_MS, config, googleCalendars: new Set(["9"]) });
  say(taken.add.length === 1, "on a non-syncing calendar the same event becomes a task");
  say(taken.notReady === 0, "and nothing is counted as waiting");

  // A build-64 import already wrote some `row:` tasks. Deleting one the moment
  // this rule starts holding its event would be the same harm by the other door.
  const old = { ...task(), id: importedId("row:812", NOW_MS + DAY), calendar_uid: "row:812", due_at: ev().startMs ? "2026-10-09T12:00:00+05:30" : "" };
  const kept = planImport([rowid], [old], { now: NOW, nowMs: NOW_MS, config, googleCalendars: google });
  say(kept.remove.length === 0 && kept.cancel.length === 0,
      "a task whose event is HELD is left alone, not read as gone");

  // And once Google answers, the swap happens in ONE pass: the proper task is
  // added and the `row:` one becomes genuinely missing at the same time.
  const real = ev({ uid: "ical-99", uidFrom: "uid2445" });
  const swap = planImport([real], [old], { now: NOW, nowMs: NOW_MS, config, googleCalendars: google });
  say(swap.add.length === 1 && swap.remove.length === 1,
      "when the real id arrives the proper task is added and the row: one goes, in the same pass");

  // The declined and ours gates still come first, so a held event that is also
  // ours is not counted twice over.
  const mineRow = ev({ uid: "row:9", uidFrom: "rowid", description: "cascade:t4" });
  const neither = planImport([mineRow], [], { now: NOW, nowMs: NOW_MS, config, googleCalendars: google });
  say(neither.notReady === 0 && neither.add.length === 0,
      "an event this app wrote is ours before it is anything else, and is not counted as waiting");
}

console.log(failed ? `\nCHECK CALENDAR: ${failed} FAILED\n` : "\nCHECK CALENDAR: PASS\n");
process.exit(failed ? 1 : 0);
