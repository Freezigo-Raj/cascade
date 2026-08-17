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
import { canAlarm, alarmOffered, alarmAt, ringAt, readAlarmView, snoozed, unanswered, alarmCleared } from "./alarm.js";
import { rankKeyFor, readCards } from "./cards.js";
import { pushed } from "./push.js";
import { spawn } from "./repeat.js";

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
say(view.alarm_actions.length === 5, "Done and four snooze buttons");
say(view.alarm_actions[0] === "[Done]", "Done first");
say(!view.alarm_actions.some((a) => a.includes("Push")), "no Push on the lock screen: moving a date needs the app");
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

console.log(`\n${bad === 0 ? "CHECK ALARM: PASS" : `CHECK ALARM: ${bad} FAILED`}\n`);
process.exit(bad ? 1 : 0);
