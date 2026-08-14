// Cascade Part A — what an alarm is, and when.
//
// Part A records the alarm and fires nothing. A browser cannot wake itself, so
// the scheduler and the push that would make one sound belong to Part B. What
// is decided here is the content and the instant, because both are properties
// of the record and neither should be invented by whatever ends up sending it.
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
 * An alarm needs a stated time. A task due "Friday" resolves to 23:59:59, so a
 * lead from that instant would ring at a quarter to midnight, which is not a
 * reminder about Friday. The limit is recorded rather than worked around: the
 * alternative is a second rule inventing a time of day the person never gave,
 * which is the thing this project refuses everywhere else.
 */
export function canAlarm(task) {
  return Boolean(task && task.due_at && task.has_time && task.task_state === "ready" && !task.archived);
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
 * What it says and what it offers.
 *
 * A notification is the smallest screen there is, so it draws the mobile
 * sentence: no trailing clause, an overdue lead collapsed to one word, and no
 * minutes anywhere. Three actions, and Push and Snooze are not the same thing
 * — Push moves the task, Snooze moves the telling.
 */
export function readAlarmView(task, shortReason, config) {
  if (!canAlarm(task) || task.alarm_type === "none") return null;
  const snooze = task.alarm_repeat_min ?? config.alarm_defaults.repeat_min;
  return {
    alarm_at: alarmAt(task, config),
    alarm_title: task.title,
    alarm_reason: shortReason,
    // `Snooze` carries its own number because it is the one action whose effect
    // the person cannot otherwise see: Done and Push say what they do.
    alarm_actions: ["[Done]", "[Push]", `[Snooze ${snooze}m]`],
  };
}
