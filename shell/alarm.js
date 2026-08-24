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
// SNOOZE MOVES THE TELLING, PUSH MOVES THE TASK. Both are on the lock screen
// now, and the cost of that is worth naming once. Choosing a push target reads
// the day's load off every stored task, which the shell does not have, so the
// targets are computed when the alarm is ARMED and carried in the payload. A
// task armed on Monday for Friday offers Friday's targets as Monday saw them.
// They are refreshed every time the app opens, because the diff re-reads them.
//
// The first design had no push here at all and made moving a date an unlock.
// This reverses that, on his instruction, and the staleness is what was bought.

// The one import this file has, and it is a pure function of a date and a rule.
// A repeat's ring follows the rule (see `nextRing`), and re-deriving the step
// here would be a second copy of the thing `repeat.js` exists to own.
//
// IT CARRIES THE VERSION, like every other import in this project (session 129).
// Session 126 wrote it as a plain `import ... from "./repeat.js"` — no `?v=` —
// which is the one thing the whole cache-busting scheme forbids: the browser
// answers that URL from whatever it already had, so a page on build 44 could be
// running a `repeat.js` from build 40, and if that copy has no `step` export the
// module fails to link and everything importing `alarm.js` — the list, the
// editor, the bridge — fails with it. `gate2.py` now refuses a relative import
// in `shell/` that does not carry the version.
const v = new URL(import.meta.url).search;
const { step } = await import(`./repeat.js${v}`);

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
 * A REPEAT RINGS ON ITS SCHEDULE, NOT ONLY ON ITS OPEN OCCURRENCE (session 126,
 * his slide: "people need to know when will it ring next").
 *
 * The defect: an occurrence rings once, and if nobody answers, the instant is in
 * the past. `syncAlarms()` never arms a past instant, and the next occurrence
 * only exists once this one is closed — so `every day at 1:39pm` rang once and
 * then never again, while the screen still said `every day`. A repeat is the
 * one thing in this app a person reads as a promise about the future, and it
 * was the one thing that stopped.
 *
 * So the ring follows the RULE where the record follows the occurrence: the
 * derived instant is stepped forward through the recurrence until it is ahead
 * of the clock. The record is untouched — `due_at` still says when this
 * occurrence was owed, and it still reads as overdue, which is true. Only the
 * ring moves, and only forward.
 *
 * A one-off task is unchanged: its instant has gone, nothing is armed, and the
 * alarms screen says so in three words.
 */
export function nextRing(task, config, now) {
  const derived = alarmAt(task, config);
  if (!derived) return null;
  if (at(derived) > at(now)) return derived;
  const rule = task.recurrence;
  if (!rule || !rule.unit || !task.due_at) return null;
  const offset = offsetOf(task.due_at);
  const lead = at(task.due_at) - at(derived);
  let due = at(task.due_at);
  // A guard on the count rather than on the clock: a rule of `every 0` would
  // step nowhere and spin here for ever, and a malformed one is a bug to
  // survive rather than a case to serve.
  for (let i = 0; i < 5000; i++) {
    // `step` takes and returns milliseconds, not a Date.
    due = step(due, rule);
    if (due - lead > at(now)) return write(due - lead, offset);
  }
  return null;
}

/**
 * When it will actually ring. A pending snooze wins while it is still ahead of
 * the clock; a spent one is ignored rather than cleared, because clearing it
 * would be a write from a render and two devices rendering would write twice.
 * Past that, the schedule answers (above), and a task with no future ring at
 * all returns the instant that has gone — the bridge skips it, and the alarms
 * screen reads it to say when it was missed.
 */
export function ringAt(task, config, now) {
  const derived = alarmAt(task, config);
  if (!derived) return null;
  const s = task.alarm_snoozed_until;
  if (s && at(s) > at(now)) return s;
  return nextRing(task, config, now) ?? derived;
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
export function readAlarmView(task, shortReason, config, now, pushTargets = []) {
  if (!canAlarm(task) || task.alarm_type === "none") return null;
  const derived = alarmAt(task, config);
  return {
    alarm_at: derived,
    alarm_ring_at: ringAt(task, config, now),
    alarm_armed_for: derived,
    alarm_title: task.title,
    alarm_reason: shortReason,
    alarm_actions: [
      "[Done]",
      ...config.alarm_snooze_options.map((m) => `[Snooze ${m}m]`),
      ...pushTargets.map((t) => `[${t.push_label}]`),
    ],
    alarm_push_targets: pushTargets,
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
