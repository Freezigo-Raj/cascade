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

console.log(failed ? `\nCHECK CALENDAR: ${failed} FAILED\n` : "\nCHECK CALENDAR: PASS\n");
process.exit(failed ? 1 : 0);
