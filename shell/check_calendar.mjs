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
import { importedId, isOurs, declined, nextPerSeries, localOnly, planImport, windowFor } from "./calendar.import.js";
import { fromEvent } from "./resolve.js";

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
// THE CLOCK (session 150, his report: a 7pm meeting read 1:30pm in the app).
//
// THE ONE THING NO CHECK WAS LOOKING AT. Session 148 asserted the shape of an
// imported task in every detail except the only one a person reads off the row.
// Every case below is written as a KNOWN WALL CLOCK rather than as a round
// trip through the same two functions, because a round trip agrees with itself
// whichever way round it is wrong.

console.log("\nTHE CLOCK — a provider instant is not a wall clock.");
{
  // 2026-10-09 19:00 in +05:30 is 13:30 UTC. His case, stated as the number.
  const at7pm = Date.UTC(2026, 9, 9, 13, 30, 0);
  const t = fromEvent(ev({ startMs: at7pm, allDay: false }), { id: "x", now: NOW, config });
  say(t.due_at === "2026-10-09T19:00:00+05:30",
      `a 7pm event reads 7pm and not 1:30pm — got ${t.due_at}`);
  say(t.has_time === true, "and it carries a time");

  // THE NEGATIVE OFFSET, which is where the naive fix breaks. 19:00 in -08:00
  // is 03:00 UTC the NEXT day.
  const NY = "2026-10-09T09:00:00-08:00";
  const atLA = Date.UTC(2026, 9, 10, 3, 0, 0);
  const west = fromEvent(ev({ startMs: atLA, allDay: false }), { id: "x", now: NY, config });
  say(west.due_at === "2026-10-09T19:00:00-08:00",
      `the same rule holds west of UTC — got ${west.due_at}`);

  // ALL-DAY IS NOT SHIFTED. The provider stores it as UTC midnight of the date,
  // so its UTC fields already read as the right day; adding the offset would
  // move a negative-offset phone to the PREVIOUS day.
  const day = Date.UTC(2026, 9, 9, 0, 0, 0);
  const banner = fromEvent(ev({ startMs: day, allDay: true }), { id: "x", now: NOW, config });
  say(banner.due_at.slice(0, 10) === "2026-10-09",
      `an all-day event keeps its date — got ${banner.due_at}`);
  const bannerWest = fromEvent(ev({ startMs: day, allDay: true }), { id: "x", now: NY, config });
  say(bannerWest.due_at.slice(0, 10) === "2026-10-09",
      `and keeps it west of UTC, which is the one way this could be fixed and still be wrong — got ${bannerWest.due_at}`);
  say(banner.has_time === false, "and an all-day event carries no time");

  // THE WINDOW TEST USES A TRUE INSTANT ON BOTH SIDES. A task sitting five
  // hours inside the far edge must not read as outside it.
  const w = windowFor(NOW_MS, config);
  const nearEdge = {
    ...task(), id: "edge", calendar_uid: "e-edge",
    due_at: new Date(w.toMs - 2 * 3600000 + 5.5 * 3600000).toISOString().slice(0, 19) + "+05:30",
  };
  const p = planImport([], [nearEdge], { now: NOW, nowMs: NOW_MS, config });
  say(p.remove.length === 1,
      "a task two hours inside the far edge of the window is inside it");
}

// ===========================================================================
// WHY EACH EVENT WAS NOT IMPORTED (session 150, his ask).

console.log("\nTHE SKIPS ADD UP — read equals the reasons.");
{
  const events = [
    ev({ uid: "a1" }),                                 // imported
    ev({ uid: "a2", description: "cascade:t1" }),      // ours
    ev({ uid: "a3", selfStatus: 2 }),                  // declined
    ev({ uid: "row:4", uidFrom: "rowid", rowId: "4" }),// imported, on a row number
    ev({ uid: "a1", startMs: NOW_MS + 8 * DAY }),      // later in the a1 series
  ];
  const p = planImport(events, [], { now: NOW, nowMs: NOW_MS, config });
  say(p.ours === 1, "one event was ours");
  say(p.declined === 1, "one was declined");
  say(p.considered === 3, "three got past both gates");
  say(p.ours + p.declined + p.considered === events.length,
      "and the three numbers sum to the read count, so nothing is counted twice or lost");
  say(p.unsynced === 1,
      "one of the three is an event Google has never seen, counted but NOT skipped");
  say(p.add.length === 2,
      "two tasks are written: the a1 series and the row-number event");
  say(p.unchanged === 0, "nothing was already right, because the store was empty");
  say(p.considered - p.add.length - p.update.length - p.unchanged === 1,
      "and the difference is what one-task-per-series folded away");

  // A TASK THAT NEEDS NOTHING DONE IS NOT A FOLDED OCCURRENCE (session 151).
  const done = planImport([ev({ uid: "b1" })], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  const again = planImport([ev({ uid: "b1" })], [done], { now: NOW, nowMs: NOW_MS, config });
  say(again.unchanged === 1, "a second import of an unchanged event counts it as already right");
  say(again.add.length === 0 && again.update.length === 0, "and writes nothing");
  say(again.considered - again.add.length - again.update.length - again.unchanged === 0,
      "so the series folded nothing, which is the truth");

  // A CLOSED OCCURRENCE IS A FOLD AND NOT A LEAVE-ALONE. `nextPerSeries` drops
  // it before the loop while it looks for the next live one, so with only that
  // occurrence in the window the series offers nothing at all.
  const shut = { ...done, task_state: "done", closed_at: NOW };
  const after = planImport([ev({ uid: "b1" })], [shut], { now: NOW, nowMs: NOW_MS, config });
  say(after.add.length === 0 && after.update.length === 0, "a closed occurrence writes nothing");
  say(after.unchanged === 0, "and is not counted as a task left alone");
  say(after.considered - after.add.length - after.update.length - after.unchanged === 1,
      "it is counted as folded by the series, which is what the series did with it");
}

// ===========================================================================
// AN EVENT GOOGLE HAS NEVER SEEN (session 153, his second phone).
//
// Session 149 HELD these back, on the reasoning that an event with no id is one
// Google has not carried up yet. That phone's calendar adapter last ran in
// 2025, so held became held for ever and the meeting he was looking for was the
// thing being held. His call: import them, and relink when the id arrives.

console.log("\nNEVER SYNCED — imported on the row number, not held.");
{
  const rowEv = ev({ uid: "row:812", uidFrom: "rowid", rowId: "812" });

  say(localOnly(rowEv), "an event carrying only a row number is recognised as never uploaded");
  say(!localOnly(ev({ uidFrom: "syncid" })), "one with a Google event id is not");
  say(!localOnly(ev({ uidFrom: "uid2445" })), "and nor is one with an iCalendar UID");

  const p = planImport([rowEv], [], { now: NOW, nowMs: NOW_MS, config });
  say(p.add.length === 1, "it is IMPORTED — reversing session 149, which held it");
  say(p.unsynced === 1, "and counted, because a task on a row number is correct on one phone only");
  say(p.add[0].calendar_uid === "row:812", "the task carries the row number as its uid");
  say(p.add[0].calendar_detached === false, "and is attached, because nothing about this is him touching it");
}

console.log("\nTHE RELINK — the row id is the thread when the real uid arrives.");
{
  const rowEv = ev({ uid: "row:812", uidFrom: "rowid", rowId: "812" });
  const first = planImport([rowEv], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  // He set an alarm on it, which is the whole thing a relink protects.
  const mine = { ...first, alarm_type: "on", alarm_lead_min: 15, pinned: true, notes: "ask about the balance" };

  // The adapter finally runs. SAME ROW, now with a real id.
  const synced = ev({ uid: "ical-99", uidFrom: "uid2445", rowId: "812" });
  const p = planImport([synced], [mine], { now: NOW, nowMs: NOW_MS, config });

  say(p.add.length === 0, "no second copy is added");
  say(p.remove.length === 0 && p.cancel.length === 0, "and the task is not read as gone");
  say(p.relinked === 1, "it is relinked, and counted");
  say(p.update.length === 1, "as one update");
  const out = p.update[0];
  say(out.id === mine.id, "the task keeps its own id, so nothing armed against it breaks");
  say(out.calendar_uid === "ical-99", "and carries the real uid from here on");
  say(out.calendar_detached === false, "still attached, his point");
  say(out.alarm_type === "on" && out.alarm_lead_min === 15 && out.pinned && out.notes === "ask about the balance",
      "the alarm, the pin and the notes survive — which is the entire reason not to delete and re-add");

  // Idempotent: a second pass over the same synced event must not relink again.
  const again = planImport([synced], [out], { now: NOW, nowMs: NOW_MS, config });
  say(again.relinked === 0 && again.update.length === 0,
      "a second import relinks nothing, because the task now holds the real uid");

  // A DETACHED task gets its uid corrected too, and keeps his words.
  const edited = { ...mine, calendar_detached: true, title: "collect from asha, confirmed" };
  const d = planImport([synced], [edited], { now: NOW, nowMs: NOW_MS, config });
  say(d.relinked === 1 && d.update.length === 1, "a detached task is relinked as well");
  say(d.update[0].title === "collect from asha, confirmed",
      "and keeps HIS title, because detached means he owns the words");
  say(d.update[0].calendar_uid === "ical-99",
      "while still learning which event it came from, or it could never be told the event was deleted");

  // A CLOSED task is never resurrected by a relink.
  const shut = { ...mine, task_state: "done", closed_at: NOW };
  const c = planImport([synced], [shut], { now: NOW, nowMs: NOW_MS, config });
  say(c.relinked === 0 && c.update.length === 0 && c.add.length === 1,
      "a task he closed is left closed, and the event becomes a new task rather than reopening it");

  // AN OLDER APK RETURNS NO `rowId`, so nothing matches and nothing is worse.
  const noRow = ev({ uid: "ical-99", uidFrom: "uid2445" });
  const old = planImport([noRow], [mine], { now: NOW, nowMs: NOW_MS, config });
  say(old.relinked === 0, "with calendar shell 2 there is no row id, so no relink by row id happens");
  say(old.add.length === 0 && old.adopted === 1,
      "but the same words on the same day relink it anyway — so an APK built before build 3 still works");
  say(old.update[0].id === mine.id && old.update[0].calendar_uid === "ical-99",
      "same task, real uid, alarm intact, with no Kotlin involved at all");
  say(old.remove.length === 0, "and nothing is deleted");
}

// ===========================================================================
// SAME WORDS, SAME DAY (session 154, his rule).

console.log("\nADOPTED, NOT DUPLICATED — and never deleted.");
{
  const typed = {
    ...task(), id: "typed-1", calendar_uid: "", calendar_detached: false,
    title: "collect 57000 from asha", normalised: "collect 57000 from asha",
    due_at: "2026-10-09T13:00:00+05:30", has_time: true,
    notes: "balance before travel", alarm_type: "on", pinned: true,
  };
  const sameDay = ev({ uid: "m1", title: "Collect 57,000 - Asha Achari", startMs: Date.parse("2026-10-09T10:00:00+05:30") });

  const p = planImport([sameDay], [typed], { now: NOW, nowMs: NOW_MS, config });
  say(p.add.length === 0, "no second row is written for one commitment");
  say(p.adopted === 1, "the task he typed is adopted, and counted");
  say(p.update.length === 1, "as one update");
  const out = p.update[0];
  say(out.id === "typed-1", "it keeps its own id");
  say(out.calendar_uid === "m1", "and is linked to the event from now on");
  say(out.calendar_detached === false, "attached, because it is");
  say(out.notes === "balance before travel" && out.alarm_type === "on" && out.pinned,
      "his notes, his alarm and his pin all survive — adoption never throws his work away");

  // ANOTHER DAY IS ANOTHER THING. `call raj` Tuesday and `call raj` Friday are
  // two calls, and a words-only rule would collapse every errand he repeats.
  const otherDay = ev({ uid: "m2", title: "Collect 57,000 - Asha Achari", startMs: Date.parse("2026-10-20T10:00:00+05:30") });
  const q = planImport([otherDay], [typed], { now: NOW, nowMs: NOW_MS, config });
  say(q.adopted === 0 && q.add.length === 1, "the same words on a different day are a different thing");

  // DIFFERENT WORDS, SAME DAY, likewise.
  const otherWords = ev({ uid: "m3", title: "Dentist", startMs: Date.parse("2026-10-09T10:00:00+05:30") });
  const r = planImport([otherWords], [typed], { now: NOW, nowMs: NOW_MS, config });
  say(r.adopted === 0 && r.add.length === 1, "and different words on the same day are too");

  // A TASK ALREADY FROM A CALENDAR IS NOT ADOPTED: it belongs to another event,
  // and two meetings named the same on one day are two meetings.
  const fromCal = { ...typed, id: "cal-1", calendar_uid: "other-event" };
  const u = planImport([sameDay], [fromCal], { now: NOW, nowMs: NOW_MS, config });
  say(u.adopted === 0 && u.add.length === 1, "a task already linked to a different event is left alone");

  // A CLOSED TASK IS NOT ADOPTED EITHER. Finished work is not a future meeting.
  const done = { ...typed, id: "done-1", task_state: "done", closed_at: NOW };
  const w = planImport([sameDay], [done], { now: NOW, nowMs: NOW_MS, config });
  say(w.adopted === 0 && w.add.length === 1, "and a task he has finished is not adopted into a meeting");
}

console.log("\nA LOCAL-ONLY TASK IS DETACHED WHEN ITS EVENT GOES, never deleted.");
{
  // Repairing a stale Google account removes it from the phone and adds it
  // back, which DELETES the events it had never uploaded. Google has no copy
  // to return, so the task is the only record left of the thing.
  const rowEv = ev({ uid: "row:812", uidFrom: "rowid", rowId: "812" });
  const mine = planImport([rowEv], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  const withWork = { ...mine, alarm_type: "on", notes: "take the file" };

  const gone = planImport([], [withWork], { now: NOW, nowMs: NOW_MS, config });
  say(gone.remove.length === 0, "it is NOT deleted");
  say(gone.cancel.length === 0, "and not cancelled either");
  say(gone.detached === 1 && gone.update.length === 1, "it is detached, and counted");
  say(gone.update[0].calendar_detached === true, "so Google never touches it again");
  say(gone.update[0].task_state === "ready", "it stays open, because the work has not gone anywhere");
  say(gone.update[0].notes === "take the file" && gone.update[0].alarm_type === "on",
      "and everything on it survives — which is the whole point of importing before repairing the account");

  // A task from a REAL event still goes with its event, which is his answer 4
  // from session 148 and is unchanged.
  const realEv = ev({ uid: "ical-7", uidFrom: "uid2445", rowId: "7" });
  const following = planImport([realEv], [], { now: NOW, nowMs: NOW_MS, config }).add[0];
  const d = planImport([], [following], { now: NOW, nowMs: NOW_MS, config });
  say(d.remove.length === 1 && d.detached === 0,
      "a task from an event Google DID have still goes when Google deletes it");
}

console.log(failed ? `\nCHECK CALENDAR: ${failed} FAILED\n` : "\nCHECK CALENDAR: PASS\n");
process.exit(failed ? 1 : 0);
