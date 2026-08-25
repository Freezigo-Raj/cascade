// Cascade — the alarm and the third override, checked.
//
// WHY THIS IS NOT IN THE ANSWER KEY. The key runs `resolve()` over a typed line.
// Cards are built from `existing_tasks` and not from the line being typed, and
// an alarm's ring time is a property of a stored task, so neither is reachable
// from a typed line. That is the same reason no key case has ever named
// `rank_key`: not an oversight, a shape mismatch. This file is the check that
// surface has been owed since session 81, and the ranking change in this session
// is what made it overdue — `ranking.overrides` grew a third member, and every
// list in the app reorders on that with all five other checks green.
//
// Run: node shell/check_alarm.mjs

import { partAConfig as config } from "./config.js";
import { canAlarm, alarmOffered, alarmAt, ringAt, nextRing, readAlarmView, snoozed, unanswered, alarmCleared } from "./alarm.js";
import { rankKeyFor, readCards } from "./cards.js";
import { pushed } from "./push.js";
import { spawn, overtaken } from "./repeat.js";
import { readPushOptions } from "./push.js";
import { resolve, lemmaReady } from "./resolve.js";
await lemmaReady; // the model loads lazily; a check must not race it

let bad = 0;
const say = (ok, what) => {
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
};

const NOW = "2026-08-17T16:00:00+05:30";

/** A whole task, so nothing is passing because a field was absent. */
function task(over = {}) {
  return {
    id: "t1", title: "Pay the vendor", raw_text: "Pay the vendor at 5pm",
    normalised: "pay the vendor", compare_key: "pay the vendor",
    commitment_type: "deadline", type_source: "rule", significance: 30,
    due_at: "2026-08-17T17:00:00+05:30", earliest_start: null, has_time: true,
    date_precision: "time", date_firmness: "hard", date_anchor: "point",
    est_duration_min: 30, duration_source: "default",
    recurrence: null, alarm_type: "on", alarm_lead_min: null,
    alarm_snoozed_until: null, alarm_unanswered_at: null, reminder_fatigue: 0,
    blocked: false, blocker_reason: "none", blocker_ref: null, project_id: null,
    task_state: "ready", archived: false, pinned: false, closed_at: null,
    notes: "", push_count: 0, first_due_at: null, spawned_from: null,
    created_at: NOW, updated_at: NOW, config_version: config.version,
    ...over,
  };
}

console.log("\nthe gate");
say(canAlarm(task()), "a timed, open task with the alarm on can ring");
say(!canAlarm(task({ has_time: false })), "a timeless date cannot ring");
say(!canAlarm(task({ task_state: "done" })), "a finished task cannot ring");
say(!canAlarm(task({ archived: true })), "an archived task cannot ring");
say(alarmOffered(task({ alarm_type: "none" })), "the toggle is offered while there is a time");
say(!alarmOffered(task({ has_time: false })), "the toggle is not drawn without a time");
say(alarmAt(task({ alarm_type: "none" }), config) === null, "alarm off means no instant");

console.log("\nwhen it rings");
say(alarmAt(task(), config) === "2026-08-17T16:45:00+05:30", "due 17:00 less the 15 min lead is 16:45");
say(alarmAt(task({ alarm_lead_min: 60 }), config) === "2026-08-17T16:00:00+05:30", "a per-task lead wins over the table");
say(ringAt(task(), config, NOW) === "2026-08-17T16:45:00+05:30", "with no snooze it rings at the derived instant");
say(
  ringAt(task({ alarm_snoozed_until: "2026-08-17T17:45:00+05:30" }), config, "2026-08-17T16:50:00+05:30")
    === "2026-08-17T17:45:00+05:30",
  "a pending snooze wins, and it is allowed to be past the due time",
);
say(
  ringAt(task({ alarm_snoozed_until: "2026-08-17T15:00:00+05:30" }), config, NOW)
    === "2026-08-17T16:45:00+05:30",
  "a spent snooze is ignored, not obeyed",
);

console.log("\nwhat it offers");
const view = readAlarmView(task(), "Due at 5:00pm.", config, NOW);
say(view.alarm_actions.length === 5, "Done and four snooze buttons when no target was handed in");
say(view.alarm_actions[0] === "[Done]", "Done first");
say(view.alarm_push_targets.length === 0, "no target handed in means no push button, never an invented date");
const withPush = readAlarmView(task(), "Due at 5:00pm.", config, NOW, [
  { push_label: "+1 hour", push_to: "2026-08-17T18:00:00+05:30" },
  { push_label: "Tomorrow", push_to: "2026-08-18T17:00:00+05:30" },
]);
say(withPush.alarm_actions.length === 7, "Done, four snoozes and two push targets");
say(withPush.alarm_actions[5] === "[+1 hour]", "the target keeps the label the row would have used");
say(withPush.alarm_push_targets[1].push_to === "2026-08-18T17:00:00+05:30",
  "the whole local-with-offset instant travels, not an epoch");
say(view.alarm_ring_sec === 120 && view.alarm_auto_max === 5, "the ring length and the auto limit travel with it");
say(view.alarm_armed_for === view.alarm_at, "armed_for is the derived instant, so a diff can tell a snooze from a stale alarm");

console.log("\nwhat a press writes");
const s = snoozed(task({ alarm_unanswered_at: NOW }), 30, "2026-08-17T16:46:00+05:30");
say(s.alarm_snoozed_until === "2026-08-17T17:16:00+05:30", "snooze 30 moves the telling half an hour");
say(s.due_at === task().due_at, "snooze does not move the task");
say(s.alarm_unanswered_at === null, "a press answers the alarm, so the marker clears");
say(s.reminder_fatigue === 0, "a press does not add to the history");

const u = unanswered(task({ reminder_fatigue: 2 }), "2026-08-17T17:22:00+05:30");
say(u.alarm_unanswered_at === "2026-08-17T17:22:00+05:30", "the chain running out sets the marker");
say(u.reminder_fatigue === 3, "and adds one to the count that is never cleared");
say(u.due_at === task().due_at, "an unanswered alarm does not move the task either");
say(u.alarm_snoozed_until === null, "and leaves no snooze behind");

const c = alarmCleared(u);
say(c.alarm_unanswered_at === null && c.reminder_fatigue === 3, "clearing takes the marker and leaves the history");

console.log("\nwhat clears it");
const p = pushed(u, "2026-08-18T17:00:00+05:30", "2026-08-17T18:00:00+05:30");
say(p.alarm_snoozed_until === null && p.alarm_unanswered_at === null, "a push clears both markers");
say(p.reminder_fatigue === 3, "a push does not clear the count");
const sp = spawn({ ...u, recurrence: { every: 1, unit: "day" }, task_state: "done" }, "t2", "2026-08-17T18:00:00+05:30");
say(sp && sp.alarm_unanswered_at === null && sp.reminder_fatigue === 0,
  "the next occurrence inherits the schedule and not the history");

console.log("\nthe third override");
const band = (t) => (t.due_at ? "today" : "none");
const keyNames = rankKeyFor(task(), config, band).map(([n]) => n);
say(keyNames[0] === "pinned" && keyNames[1] === "is_hard" && keyNames[2] === "alarm_unanswered",
  "pinned, then hard, then unanswered");
say(keyNames.length === 12, "three overrides and nine factors");

const order = (list) => readCards(list, config, () => "Due at 5:00pm", band, null).cards.map((c) => c.card_id);

// A hard task whose alarm was slept through, against a hard task with nothing
// wrong. Same band, same weight, same everything the nine factors read.
const slept = { ...task(), id: "slept", alarm_unanswered_at: NOW, reminder_fatigue: 1 };
const fine = { ...task(), id: "fine" };
say(order([fine, slept])[0] === "slept", "a slept-through hard task outranks an answered one");

// A soft task with a missed alarm must not jump a hard task without one. This is
// the whole reason the override sits third rather than second.
const softMissed = { ...task(), id: "soft", date_firmness: "soft", alarm_unanswered_at: NOW, reminder_fatigue: 1 };
say(order([softMissed, fine])[0] === "fine", "hard still beats a soft task with a missed alarm");

// A pin is still absolute.
const pin = { ...task(), id: "pin", pinned: true, date_firmness: "normal" };
say(order([slept, pin])[0] === "pin", "a pin outranks everything, unanswered alarm included");

console.log("\nwhat the row says");
const sentence = readCards([slept, fine], config, () => "Due at 5:00pm", band, null)
  .cards.find((c) => c.card_id === "slept");
say(/rang unanswered/i.test(sentence.card_reason), "the row says why it jumped");
say(!/rang unanswered/i.test(sentence.card_reason_short), "and mobile does not: no trailing clauses there");

// The three warnings against the task being edited. Not in the answer key for
// the same reason the ranking is not: the key hands `resolve()` a typed line and
// these need a stored record with an id, which a typed line cannot produce.
console.log("\nediting is not a collision with yourself");
{
  const stored = {
    ...task(), id: "aaa", due_at: "2026-08-21T23:59:59+05:30", has_time: false,
    date_firmness: "hard", date_anchor: "end", date_precision: "day",
    alarm_type: "none", title: "file gstr", normalised: "file gstr", compare_key: "file gstr",
    raw_text: "file gstr friday",
  };
  const call = (bound) => resolve({
    typed_line: "file gstr", chip_spans: [], type_chip_tap: null, significance_tap: null,
    duration_tap: null, firmness_tap: null, notes_text: "", bound_task_id: bound,
    row_action: null, now: NOW, new_id: "22222222-2222-7222-8222-222222222222",
    config, existing_tasks: [stored],
  }).capture;
  const editing = call("aaa");
  say(editing.duplicate_dialog === null, "an edit is not a duplicate of itself");
  say(editing.deadline_dialog === null, "an edit does not share its own deadline day");
  say(editing.clash_dialog === null, "an edit does not clash with itself");
  // The same line typed fresh MUST still warn, or the exclusion has gone too far.
  const adding = call(null);
  say(adding.duplicate_dialog !== null, "the same line typed fresh still warns");
}

console.log("\na length of time, spaced either way");
{
  const at = (line) => resolve({
    typed_line: line, chip_spans: [], type_chip_tap: null, significance_tap: null,
    duration_tap: null, firmness_tap: null, notes_text: "", bound_task_id: null,
    row_action: null, now: NOW, new_id: "33333333-3333-7333-8333-333333333333",
    config, existing_tasks: [],
  }).task.due_at;
  say(at("pay vendor in 5 mins") === "2026-08-17T16:05:00+05:30", "in 5 mins, three words");
  say(at("pay vendor in 5mins") === "2026-08-17T16:05:00+05:30", "in 5mins, joined");
  say(at("pay vendor in 2hours") === "2026-08-17T18:00:00+05:30", "in 2hours, joined");
  say(at("pay vendor in 5 minutes") === "2026-08-17T16:05:00+05:30", "the long unit still reads");
}

// --------------------------------------------------------------- session 125
//
// THE THREE BEHAVIOUR CHANGES THIS SESSION MADE, each with the defect it
// closes named, so a later session cannot reintroduce one with every check
// still green. Session 123 recorded that this file proves pure functions only
// and never calls `apply()`; that is still true, and these are pure.
{
  // A PUSH MUST NOT MOVE THE SERIES. `nextDue()` stepped from `due_at`, which
  // `pushed()` overwrites, so rent due the 1st and paid on the 4th repeated on
  // the 4th for ever — the exact drift repeat.js says it prevents.
  const monthly = task({
    due_at: "2026-09-01T10:00:00+05:30", recurrence: { every: 1, unit: "month" },
  });
  const moved = pushed(monthly, "2026-09-04T10:00:00+05:30", "2026-09-01T11:00:00+05:30");
  const next = spawn({ ...moved, task_state: "done" }, "t9", "2026-09-04T12:00:00+05:30");
  say(next.due_at === "2026-10-01T10:00:00+05:30", "a pushed occurrence repeats on the SCHEDULE, not the push");
  say(moved.first_due_at === "2026-09-01T10:00:00+05:30", "the push records where the occurrence started");

  // An occurrence never pushed still counts from its own date.
  const clean = spawn({ ...monthly, task_state: "done" }, "t10", "2026-09-01T12:00:00+05:30");
  say(clean.due_at === "2026-10-01T10:00:00+05:30", "an unpushed occurrence steps from its due date");

  // A DONE MUST LEAVE NO SNOOZE BEHIND, wherever it was pressed. The list
  // screen wrote three fields by hand and missed these two, so an Undone
  // brought a spent snooze and an unanswered marker back to the top tier.
  const stale = task({
    alarm_snoozed_until: "2026-08-17T17:30:00+05:30",
    alarm_unanswered_at: "2026-08-17T15:00:00+05:30", reminder_fatigue: 2,
  });
  const closed = alarmCleared({ ...stale, task_state: "done", closed_at: NOW, updated_at: NOW });
  say(closed.alarm_snoozed_until === null && closed.alarm_unanswered_at === null,
      "alarmCleared() empties both markers");
  say(closed.reminder_fatigue === 2, "and never touches the history count");
}

// -------------------------------------------------- session 125, the catch-up
//
// A REPEAT THE CALENDAR WALKED PAST (his call). The pure half is `overtaken()`;
// the write half lives in `catchup.js` and is driven from `start()`, which no
// check reaches — the same honest gap `apply()` had until session 123 and it is
// recorded here rather than implied.
{
  const weekly = (over) => task({
    due_at: "2026-08-10T09:00:00+05:30",
    recurrence: { every: 1, unit: "week" }, ...over,
  });
  say(overtaken(weekly(), "2026-08-12T09:00:00+05:30") === false,
      "two days late on a weekly repeat is still this week's task");
  say(overtaken(weekly(), "2026-08-17T09:00:00+05:30") === true,
      "past the next scheduled date, the schedule has moved on");
  say(overtaken(weekly({ task_state: "done", closed_at: NOW }), "2026-09-01T09:00:00+05:30") === false,
      "a closed occurrence is never rolled forward");
  say(overtaken(weekly({ archived: true }), "2026-09-01T09:00:00+05:30") === false,
      "nor an archived one");
  say(overtaken(task({ due_at: "2026-01-01T09:00:00+05:30" }), NOW) === false,
      "a one-off task is left where it is, however late");

  // The row it hands on skips every occurrence in between and lands in the
  // future, and the one it closes keeps its own date.
  const stale = weekly();
  const next = spawn({ ...stale, task_state: "cancelled" }, "t11", "2026-09-02T12:00:00+05:30");
  say(next.due_at === "2026-09-07T09:00:00+05:30", "the next occurrence is the next FUTURE one");
  say(next.spawned_from === stale.id, "and it names the occurrence it came from");
}

// -------------------------------------------- session 126, the ring follows on
//
// A REPEAT RINGS ON ITS SCHEDULE (his slide: "people need to know when will it
// ring next"). The occurrence's own instant goes past and the shell never arms
// a past instant, so `every day at 1:39pm` rang once and then never again while
// the screen still said `every day`.
{
  const daily = task({
    due_at: "2026-08-17T17:00:00+05:30", alarm_lead_min: 15,
    recurrence: { every: 1, unit: "day" },
  });
  const after = "2026-08-17T18:00:00+05:30";   // the ring has gone by an hour
  say(alarmAt(daily, config) === "2026-08-17T16:45:00+05:30", "the derived instant is due minus lead");
  say(nextRing(daily, config, after) === "2026-08-18T16:45:00+05:30", "a spent ring steps one interval on");
  say(ringAt(daily, config, after) === "2026-08-18T16:45:00+05:30", "and that is what it will ring at");

  // Untouched: a ring still ahead, and a one-off whose ring has gone.
  say(nextRing(daily, config, NOW) === "2026-08-17T16:45:00+05:30", "a ring still ahead is left alone");
  const once = task({ due_at: "2026-08-17T17:00:00+05:30", alarm_lead_min: 15 });
  say(nextRing(once, config, after) === null, "a one-off has no next ring");
  say(ringAt(once, config, after) === "2026-08-17T16:45:00+05:30",
      "and reports the instant it missed, for the screen to say so");

  // A snooze still outranks both, which is the rule it has had since 111.
  const snoozy = { ...daily, alarm_snoozed_until: "2026-08-17T18:30:00+05:30" };
  say(ringAt(snoozy, config, after) === "2026-08-17T18:30:00+05:30", "a pending snooze still wins");

  // Several intervals late lands in the future, not on the first step.
  say(nextRing(daily, config, "2026-08-25T09:00:00+05:30") === "2026-08-25T16:45:00+05:30",
      "eight days late steps all the way to the next future ring");

  // The record is not touched by any of it.
  say(daily.due_at === "2026-08-17T17:00:00+05:30", "and the task's own date is left exactly where it was");
}

// ------------------------------- sessions 132 and 136, `Later today` in bands
//
// 132: pressing it moved the task to TOMORROW — the rung was `at + 4 hours`
// with nothing stopping it crossing midnight, so a 21:00 task became 01:00 the
// next day under a label saying today.
//
// 136, his rule and the better one: it moves BY BAND. Morning to afternoon,
// afternoon to evening, evening to tonight, and nothing at all when the day has
// no band left. Four hours was a number that reached the next band from some
// starting points and the middle of the same one from others.
{
  const band = (clock) => task({ due_at: `2026-08-25T${clock}:00+05:30`, date_precision: "band" });
  const rungs = (t) => readPushOptions(t, [t], config, "2026-08-25T06:00:00+05:30");
  const later = (t) => rungs(t).find((o) => o.push_label === "Later today");

  say(later(band("09:00")).push_to === "2026-08-25T12:00:00+05:30", "morning goes to the afternoon");
  say(later(band("13:00")).push_to === "2026-08-25T18:00:00+05:30", "afternoon goes to the evening");
  say(later(band("19:00")).push_to === "2026-08-25T21:00:00+05:30", "evening goes to tonight");
  say(later(band("21:30")) === undefined,
      "and at night there is no rung — `Later today` with no later today is a lie");
  say(rungs(band("21:30"))[0].push_label === "Tomorrow", "what is left starts at Tomorrow, which is true");
  // The case his sentence does not reach, answered by the same rule.
  say(later(band("07:00")).push_to === "2026-08-25T09:00:00+05:30",
      "before nine goes to the morning, the first band ahead of it");

  // AN HOUR RUNG THAT LEAVES THE DAY IS NOT OFFERED EITHER (session 136).
  // `+4 hours` on a 22:00 task is a true label for an instant that is tomorrow,
  // and nobody presses it doing arithmetic about midnight.
  const exact = (clock) => task({ due_at: `2026-08-25T${clock}:00+05:30`, date_precision: "time" });
  const labels = (t) => rungs(t).map((o) => o.push_label);
  say(labels(exact("14:00")).slice(0, 4).join() === "+1 hour,+2 hours,+3 hours,+4 hours",
      "an afternoon task keeps all four hour rungs");
  say(labels(exact("22:00")).join().startsWith("+1 hour,Tomorrow"),
      "a 22:00 task keeps only the hour that stays in the day");
  say(labels(exact("23:30"))[0] === "Tomorrow", "and a 23:30 task keeps none of them");
}

console.log(`\n${bad === 0 ? "CHECK ALARM: PASS" : `CHECK ALARM: ${bad} FAILED`}\n`);
process.exit(bad ? 1 : 0);
