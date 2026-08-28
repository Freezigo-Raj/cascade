// Cascade Part A — pushing a task, and what a day is already holding.
//
// A push moves a task's date without opening it. It sets the date field and
// touches no words: once a task is added its typed line is gone from the screen
// and only `title` is shown, so there are no date words left in view to keep in
// step. `raw_text` is provenance, kept and never drawn.
//
// Two rules decide what a push offers.
//
// **The targets come from `date_precision`.** Push at the granularity that was
// given. A task said `this morning` is pushed to an afternoon, not to a Tuesday
// at 09:00, which would claim a precision nobody offered. Same principle as
// `due_phrase`: the finest granularity that is TRUE.
//
// **The notes come from load.** Each target says what the day it lands on is
// already holding, because pushing into a fuller day is the mistake the whole
// control exists to prevent.

const v = new URL(import.meta.url).search;
const { isOpen } = await import(`./cards.js${v}`);

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Local midnight of the instant, in the same offset the record carries. */
function midnightOf(iso) {
  const t = Date.parse(iso.slice(0, 19) + "Z");
  return Math.floor(t / DAY) * DAY;
}

const offsetOf = (iso) => iso.slice(-6);

function write(t, offset) {
  const d = new Date(t);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${offset}`
  );
}

/**
 * What a day already holds: how many open tasks are due in it and how many
 * minutes they add up to.
 *
 * The minutes are a sum of guesses. `est_duration_min` is a default per verb,
 * not a measurement, so eight tasks at thirty minutes is four hours of
 * assumption. The note this produces says `6 tasks, roughly 4h` rather than a
 * figure to the minute, because precision nobody earned is worse than none.
 */
export function dayLoad(existing, dayStart) {
  let tasks = 0, minutes = 0;
  for (const t of existing ?? []) {
    if (!isOpen(t) || !t.due_at) continue;
    if (midnightOf(t.due_at) !== dayStart) continue;
    tasks++;
    minutes += t.est_duration_min ?? 0;
  }
  return { tasks, minutes };
}

/**
 * The load is never drawn. It decides which days are offered and in what order,
 * and the reader sees three labels and no arithmetic.
 *
 * A quiet field is one collected so the app can suggest better, not so the
 * reader can check its working: `est_duration_min`, `push_count`,
 * `first_due_at`, and the day's load built from the first of them. That is a
 * deliberate trade. What it costs is stated in spec.md, because a suggestion
 * nobody can see the reason for is a suggestion nobody can correct.
 */
function isFull(load, capacity) {
  return load.minutes >= capacity;
}

/**
 * The targets, by the precision the person gave. Each is an offset from the
 * task's own date rather than from `now`, so pushing twice moves twice.
 */
/** The wall-clock day an instant sits in. */
const dayOf = (ms) => Math.floor(ms / DAY) * DAY;

/**
 * The `Later today` rung, or nothing.
 *
 * IT MOVES BY BANDS, NOT BY HOURS (session 136, his rule): morning goes to
 * afternoon, afternoon to evening, evening to tonight. Four hours was a number
 * that landed in the next band from some starting points and in the middle of
 * the same one from others — 09:00 became 13:00, which is the afternoon by
 * accident, and 12:30 became 16:30, which is the afternoon it was already in.
 * Session 132 clamped it to 21:00 so it stopped crossing midnight; the clamp
 * was right about the day and still wrong about the unit.
 *
 * The rule is the FIRST BAND THAT STARTS AFTER IT, read from
 * `config.time_bands`. That gives his three moves exactly and also answers the
 * case his sentence does not reach: 07:00 goes to 09:00, the morning, because
 * that is the first band ahead of it.
 *
 * Nothing when the day has no band left, which is his other half: do not offer
 * it when it cannot move later in the same day.
 *
 * COUNTED FROM THE LATER OF THE TASK AND THE CLOCK (session 140). It read the
 * task's own time alone, so a task due at 09:00 that was still sitting there at
 * 14:00 offered `Later today` at 12:00 — a rung two hours in the past, which is
 * the exact fault this rung has now been fixed for three times. The band it
 * names has to be ahead of BOTH.
 */
function laterToday(at, nowMs, config) {
  const from = Math.max(at, nowMs);
  const midnight = dayOf(from);
  const starts = Object.values(config?.time_bands ?? {})
    .map((b) => String(b?.start ?? ""))
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      return midnight + h * 60 * 60 * 1000 + m * 60 * 1000;
    })
    .sort((a, b) => a - b);
  const next = starts.find((t) => t > from);
  return next === undefined ? [] : [{ label: "Later today", at: next }];
}

/**
 * A rung that leaves the day it started in (session 136, his rule, applied to
 * the hour rungs as well).
 *
 * `+4 hours` on a task at 22:00 is a true label for an instant that is tomorrow
 * morning, and a person pressing it at a lock screen is not doing arithmetic
 * about midnight. Any rung offered as a move WITHIN today is dropped when it
 * lands on another day. The day rungs below — Tomorrow, +2 days, Next week —
 * say which day they mean and are left alone.
 */
const sameDay = (at) => (rung) => dayOf(rung.at) === dayOf(at);

/**
 * A DAY RUNG NAMES A DAY, AND THE DAY IT NAMES IS COUNTED FROM TODAY (session
 * 140, his rule: "Today and Tomorrow should not be relative to the current task
 * date. It should be absolute.").
 *
 * Every rung below was `task.due_at + n days`. On a task due next Friday,
 * `Tomorrow` meant Saturday and `+2 days` meant Sunday — labels that name a day
 * and land on a different one. Only the OVERDUE branch counted from today, and
 * only because it was written separately for that reason; that branch is gone
 * now, because with the rungs absolute it said exactly what this says.
 *
 * `Today` at the task's own clock time. If that hour has already gone, an hour
 * from now, because a pull-forward that arrives overdue is a trap rather than a
 * favour — and dropped entirely when an hour from now is tomorrow, which is the
 * same rule session 136 gave `Later today` and the hour rungs.
 *
 * The rungs that do NOT name a day are still relative and still should be:
 * `+1 hour` on a task due tomorrow at 09:00 means tomorrow at 10:00, and that
 * is what the words say. `Later today` is the exception among them, because it
 * names today while being computed from the task's own day: it is offered only
 * when the task is actually due today.
 */
function targetsFor(task, now, config) {
  const at = Date.parse(task.due_at.slice(0, 19) + "Z");
  const nowMs = Date.parse(now.slice(0, 19) + "Z");
  const today = Math.floor(nowMs / DAY) * DAY;
  const clock = ((at % DAY) + DAY) % DAY;

  const dayRung = (label, days) => {
    const landing = today + days * DAY;
    let t = landing + clock;
    if (days === 0 && t <= nowMs) t = nowMs + HOUR;
    if (dayOf(t) !== landing) return [];
    return [{ label, at: t }];
  };
  const TODAY = dayRung("Today", 0);
  const TOMORROW = dayRung("Tomorrow", 1);
  const D2 = dayRung("+2 days", 2);
  const W1 = dayRung("Next week", 7);
  const W2 = dayRung("+2 weeks", 14);
  const M1 = dayRung("Next month", 28);
  const M2 = dayRung("+2 months", 56);
  const M3 = dayRung("+3 months", 84);

  // `Later today` is computed from the task's own day, so on a task due later
  // in the week it named today and landed on a Thursday. It is a rung about
  // today; it is offered when the task is due today.
  const later = dayOf(at) === today ? laterToday(at, nowMs, config) : [];

  // Each set is a STANDARD LADDER at the precision the person gave (session
  // 119): the row scrolls sideways, so four or five rungs cost no height and a
  // push no longer has to be made twice to reach a fortnight. The coarsest rung
  // is still one step beyond the precision, and the load still drops full days.
  const ladder = (() => {
    switch (task.date_precision) {
      case "time":
        return [...TODAY,
          // FOUR HOURS, ONE RUNG EACH (session 128, his slide on the lock
          // screen: "give more options with scroll like +1hr, +2hrs, +3hrs,
          // +4hrs"). An exact time is the precision where an hour is a real
          // answer, and +1 then +4 made the middle two reachable only by pushing
          // twice. These stay RELATIVE: they name an interval, not a day.
          ...[
            { label: "+1 hour", at: at + HOUR },
            { label: "+2 hours", at: at + 2 * HOUR },
            { label: "+3 hours", at: at + 3 * HOUR },
            { label: "+4 hours", at: at + 4 * HOUR },
          ].filter(sameDay(at)),
          ...TOMORROW, ...D2, ...W1];
      case "band":
        return [...TODAY, ...later, ...TOMORROW, ...D2, ...W1, ...W2];
      case "day":
        return [...TODAY, ...TOMORROW, ...D2, ...W1, ...W2, ...M1];
      case "span":
      case "week":
        // NO `Today` AND NO `Tomorrow` HERE, and that is not an oversight: a
        // task said `next week` was given at week precision, and a rung naming
        // a single day claims an exactness nobody offered. The rungs are
        // absolute now like the rest — `Next week` was the task's own date plus
        // seven days, so on a task three months out it meant three months and a
        // week.
        return [...W1, ...W2, ...M1, ...M2];
      case "month":
        return [...M1, ...M2, ...M3];
      default:
        return [...TODAY, ...TOMORROW, ...D2, ...W1, ...W2];
    }
  })();

  // IN THE ORDER THEY HAPPEN. With the day rungs absolute and the hour rungs
  // relative, the two can interleave: on a task due Friday at 15:00, `+1 hour`
  // is Friday and `Tomorrow` is Wednesday, and the ladder listed them in the
  // order the branch happened to write them. A row of dates out of order reads
  // as a defect whatever each label says on its own.
  //
  // A RUNG THAT CHANGES NOTHING IS NOT A RUNG. With the day rungs counted from
  // today, a task already due today grows a `Today` that lands exactly where it
  // already is, and a press on it would write a record identical to the one on
  // screen. Dropped here rather than in each branch, because every branch has
  // the same answer.
  return ladder
    .filter((r) => write(r.at, offsetOf(task.due_at)) !== task.due_at)
    .sort((a, b) => a.at - b.at);
}

/**
 * @param {object} task     the stored task being pushed
 * @param {Array} existing  every stored task, for the load on each target day
 * @param {object} config   `capacity_min_per_day` is read here
 * @param {string} now      the clock, handed in
 * @returns {Array} `[{ push_label, push_to }]`, empty for a dateless task
 */
export function readPushOptions(task, existing, config, now) {
  // A task with no date has nothing to push. It is on the Ideas list, where the
  // question is what it is rather than when.
  if (!task || !task.due_at) return [];
  const offset = offsetOf(task.due_at);
  const capacity = config.capacity_min_per_day;
  const all = targetsFor(task, now, config).map((t) => ({
    push_label: t.label,
    push_to: write(t.at, offset),
    full: isFull(dayLoad(existing, Math.floor(t.at / DAY) * DAY), capacity),
  }));
  // A day already over its capacity is not offered while a lighter one further
  // out is available. Offering a full day is the mistake this control exists to
  // prevent, and saying so on the button was the version he did not want.
  const open = all.filter((t) => !t.full);
  // Everything ahead is full: offer them anyway rather than an empty row. A
  // press with nowhere to land is worse than a press into a busy day.
  const kept = open.length ? open : all;
  return kept.map(({ push_label, push_to }) => ({ push_label, push_to }));
}

/**
 * The record after a push. `push_count` is what nothing knew before: everything
 * else in the record is a snapshot, and this is the only history. A task pushed
 * once met a busy day; a task pushed six times has something wrong with it that
 * a seventh push will not fix.
 */
export function pushed(task, to, now) {
  return {
    ...task,
    due_at: to,
    first_due_at: task.first_due_at || task.due_at,
    push_count: (task.push_count ?? 0) + 1,
    // A push is the later and more considered statement about when to be told,
    // so it clears what the alarm left behind: a snooze that would otherwise
    // ring tonight about a task now due tomorrow, and the unanswered marker
    // holding it at the top of the list. `reminder_fatigue` is untouched,
    // because that one is history rather than a live marker.
    alarm_snoozed_until: null,
    alarm_unanswered_at: null,
    updated_at: now,
  };
}
