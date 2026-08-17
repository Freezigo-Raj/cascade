// Cascade Part A — what an alarm is, when it rings, and what a press to it means.
//
// Part A still fires nothing. A browser cannot wake itself, so the thing that
// makes a noise is the Android shell (`shell/alarm.bridge.js` and the Kotlin
// plugin behind it). What is decided here is the content, the instant, and the
// three records a press produces, because all of those are properties of the
// task and none of them should be invented by whatever ends up ringing.
//
// **An alarm needs a stated time**, and that is the whole gate. A task due
// "Friday" resolves to 23:59:59, so a lead from that instant would ring at a
// quarter to midnight, which is not a reminder about Friday. So the toggle in
// the advanced panel appears only while the line carries a time and disappears
// with it: a control that cannot work is not drawn.
//
// **The lead is suggested by type and changed per task.** The chain is
// `alarm_lead_min`, then `alarm_lead_by_type[commitment_type]`, then
// `alarm_defaults.lead_min`. Every entry in that table is the same number
// today, deliberately: the shape exists so a correction is a number change
// rather than a structural one, and no guess is recorded as if it were
// evidence. While they are all equal the table changes nothing.
//
// The cost of that is worth naming once, and it is in spec.md: fifteen minutes
// is short for a job that takes thirty. Being told at 4:45 about a half-hour
// thing due at 5 is being told too late to start it, and the app will not say
// so, because duration is a quiet field. Moving the number is the answer and
// the person has to know to move it.
//
// TWO HOMES FOR A SNOOZE, and this file owns the one that is the truth.
// `alarm_snoozed_until` is on the task, so a snooze survives a reinstall and
// reaches the other devices. The shell keeps its own copy so it can re-ring
// with the WebView dead. They are allowed to disagree for as long as it takes
// an outcome to drain, which is why `alarm_armed_for` exists: it names the
// derived instant the shell armed against, so a diff can tell a snoozed alarm
// from a stale one. Without it, opening the app during a snooze cancels it.
//
// SNOOZE MOVES THE TELLING, PUSH MOVES THE TASK. That has been the rule since
// the alarm was first written down and it is why Push is not on the lock
// screen: moving a due date reads the day's load off every other task, which a
// dead WebView cannot do, so it needs the app and therefore an unlock. What is
// on the lock screen is Done and the four snooze buttons.

const MIN = 60 * 1000;

const at = (iso) => Date.parse(iso.slice(0, 19) + "Z");
const offsetOf = (iso) => iso.slice(-6);

function write(t, offset) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${offset}`
  );
}

/**
 * The gate. A stated time, an open task, and an alarm asked for. The limit on
 * timeless dates is recorded rather than worked around: the alternative is a
 * second rule inventing a time of day the person never gave, which is the thing
 * this project refuses everywhere else.
 */
export function canAlarm(task) {
  return Boolean(task && task.due_at && task.has_time && task.task_state === "ready" && !task.archived);
}

/** Whether the toggle is drawn at all. The panel asks this, not `alarm_type`. */
export function alarmOffered(task) {
  return Boolean(task && task.due_at && task.has_time);
}

/** When it fires: the due instant less the lead. Derived, never stored. */
export function alarmAt(task, config) {
  if (!canAlarm(task) || task.alarm_type === "none") return null;
  const lead = task.alarm_lead_min
    ?? config.alarm_lead_by_type?.[task.commitment_type]
    ?? config.alarm_defaults.lead_min;
  return write(at(task.due_at) - lead * MIN, offsetOf(task.due_at));
}

/**
 * When it will actually ring. A pending snooze wins while it is still ahead of
 * the clock; a spent one is ignored rather than cleared, because clearing it
 * would be a write from a render and two devices rendering would write twice.
 */
export function ringAt(task, config, now) {
  const derived = alarmAt(task, config);
  if (!derived) return null;
  const s = task.alarm_snoozed_until;
  if (s && at(s) > at(now)) return s;
  return derived;
}

/**
 * What it says and what it offers.
 *
 * A notification is the smallest screen there is, so it draws the mobile
 * sentence: no trailing clause, an overdue lead collapsed to one word, and no
 * minutes anywhere. The buttons are Done and the four snooze intervals, each
 * carrying its own number, because a snooze is the one action whose effect the
 * person cannot otherwise see.
 */
export function readAlarmView(task, shortReason, config, now) {
  if (!canAlarm(task) || task.alarm_type === "none") return null;
  const derived = alarmAt(task, config);
  return {
    alarm_at: derived,
    alarm_ring_at: ringAt(task, config, now),
    alarm_armed_for: derived,
    alarm_title: task.title,
    alarm_reason: shortReason,
    alarm_actions: ["[Done]", ...config.alarm_snooze_options.map((m) => `[Snooze ${m}m]`)],
    alarm_ring_sec: config.alarm_defaults.ring_sec,
    alarm_auto_snooze_min: config.alarm_defaults.auto_snooze_min,
    alarm_auto_max: config.alarm_defaults.auto_max,
  };
}

/**
 * The record after a snooze, manual or automatic. It moves one instant and
 * nothing else: `due_at` is untouched, which is what makes Snooze and Push two
 * buttons rather than one.
 *
 * An unanswered marker is cleared here, because a person who pressed a button
 * answered the alarm. The count in `reminder_fatigue` is not cleared, ever.
 */
export function snoozed(task, minutes, now) {
  return {
    ...task,
    alarm_snoozed_until: write(at(now) + minutes * MIN, offsetOf(task.due_at ?? now)),
    alarm_unanswered_at: null,
    updated_at: now,
  };
}

/**
 * The record after the chain rang itself out with nothing pressed.
 *
 * Two fields and they are not the same kind of thing. `alarm_unanswered_at` is
 * the live marker the ranking reads, and a push, a Done or a date edit clears
 * it. `reminder_fatigue` is history and nothing clears it: a task whose alarm
 * has failed three times has something wrong with it that a fourth alarm will
 * not fix. The same pair as `first_due_at` and `push_count`.
 *
 * Part A writes `reminder_fatigue` now. The contract had it reserved for Part
 * B's `notification_history`, which will add to it and does not own it.
 */
export function unanswered(task, now) {
  return {
    ...task,
    alarm_snoozed_until: null,
    alarm_unanswered_at: now,
    reminder_fatigue: (task.reminder_fatigue ?? 0) + 1,
    updated_at: now,
  };
}

/**
 * Everything a snooze and an unanswered chain left behind. A push, a completion
 * and a date edit all call this: each of them is a later and more considered
 * statement about when to be told than the alarm that rang, so the alarm's
 * leftovers do not outlive it.
 *
 * It does NOT touch `reminder_fatigue`. That is the point of there being two.
 */
export function alarmCleared(task) {
  return { ...task, alarm_snoozed_until: null, alarm_unanswered_at: null };
}

/** The tier-1 term. A marker that is set, and nothing about the clock. */
export function isUnanswered(task) {
  return Boolean(task && task.alarm_unanswered_at);
}
