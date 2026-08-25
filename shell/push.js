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
 */
function laterToday(at, config) {
  const midnight = dayOf(at);
  const starts = Object.values(config?.time_bands ?? {})
    .map((b) => String(b?.start ?? ""))
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      return midnight + h * 60 * 60 * 1000 + m * 60 * 1000;
    })
    .sort((a, b) => a - b);
  const next = starts.find((t) => t > at);
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

function targetsFor(task, now, config) {
  const at = Date.parse(task.due_at.slice(0, 19) + "Z");
  const today = Math.floor(Date.parse(now.slice(0, 19) + "Z") / DAY) * DAY;
  // Overdue is the one case that does not push further out. A task already late
  // is not helped by being later; bringing it back to a day you will see it on
  // is what the press means.
  if (at < Date.parse(now.slice(0, 19) + "Z")) {
    return [
      { label: "Today", at: today + (at % DAY) },
      { label: "Tomorrow", at: today + DAY + (at % DAY) },
      { label: "+2 days", at: today + 2 * DAY + (at % DAY) },
      { label: "Next week", at: today + 7 * DAY + (at % DAY) },
    ];
  }
  // A TASK ON A LATER DAY CAN COME TO TODAY (session 124, his ask): the
  // ladders only ever pushed outward, so a tomorrow that freed up could not
  // be pulled in. The rung lands on today at the task's own clock time; if
  // that instant has already gone, one hour from now, because a pull-forward
  // that arrives overdue is a trap, not a favour.
  const nowMs = Date.parse(now.slice(0, 19) + "Z");
  const pullIn = [];
  if (at - (at % DAY) > today && ["time", "band", "day"].includes(task.date_precision)) {
    const atToday = today + (at % DAY);
    // The pull-in has to land today as well (session 136). `now + 1 hour` at
    // 23:30 is tomorrow, wearing a label that says Today — the same fault the
    // rungs above were carrying, in the one rung that names the day outright.
    const pulled = atToday > nowMs ? atToday : nowMs + HOUR;
    if (dayOf(pulled) === today) pullIn.push({ label: "Today", at: pulled });
  }
  // Each set is a STANDARD LADDER at the precision the person gave (session
  // 119): the row scrolls sideways, so four or five rungs cost no height and a
  // push no longer has to be made twice to reach a fortnight. The rules under
  // them are unchanged — offsets from the task's own date, the coarsest rung
  // one step beyond the precision, and the load still drops full days.
  switch (task.date_precision) {
    case "time":
      return [...pullIn,
        // FOUR HOURS, ONE RUNG EACH (session 128, his slide on the lock
        // screen: "give more options with scroll like +1hr, +2hrs, +3hrs,
        // +4hrs"). An exact time is the precision where an hour is a real
        // answer, and +1 then +4 made the middle two reachable only by pushing
        // twice. The rows scroll, so rungs cost no height.
        ...[
          { label: "+1 hour", at: at + HOUR },
          { label: "+2 hours", at: at + 2 * HOUR },
          { label: "+3 hours", at: at + 3 * HOUR },
          { label: "+4 hours", at: at + 4 * HOUR },
        ].filter(sameDay(at)),
        { label: "Tomorrow", at: at + DAY },
        { label: "+2 days", at: at + 2 * DAY },
        { label: "Next week", at: at + 7 * DAY },
      ];
    case "band":
      // `Later today` HAS TO LAND TODAY (session 132, his report: pressing it
      // moved the task to tomorrow).
      //
      // It was `at + 4 hours` and nothing stopped that crossing midnight. A
      // task in the evening band sits at 18:00 and four hours later is 22:00,
      // which is fine; one in the night band sits at 21:00 and four hours later
      // is 01:00 the next day, wearing a label that says today. The rung read
      // as a small delay and was a whole day.
      //
      // It is clamped to the last band the day has — `time_bands.night.start`,
      // the same 21:00 every other screen means by tonight — and DROPPED
      // ENTIRELY when the task is already at or past it, because `Later today`
      // with nothing later today left is not a smaller lie than the first one.
      return [...pullIn,
        ...laterToday(at, config),
        { label: "Tomorrow", at: at + DAY },
        { label: "+2 days", at: at + 2 * DAY },
        { label: "Next week", at: at + 7 * DAY },
        { label: "+2 weeks", at: at + 14 * DAY },
      ];
    case "day":
      return [...pullIn,
        { label: "Tomorrow", at: at + DAY },
        { label: "+2 days", at: at + 2 * DAY },
        { label: "Next week", at: at + 7 * DAY },
        { label: "+2 weeks", at: at + 14 * DAY },
        { label: "Next month", at: at + 28 * DAY },
      ];
    case "span":
    case "week":
      return [
        { label: "Next week", at: at + 7 * DAY },
        { label: "+2 weeks", at: at + 14 * DAY },
        { label: "Next month", at: at + 28 * DAY },
        { label: "+2 months", at: at + 56 * DAY },
      ];
    case "month":
      return [
        { label: "Next month", at: at + 28 * DAY },
        { label: "+2 months", at: at + 56 * DAY },
        { label: "+3 months", at: at + 84 * DAY },
      ];
    default:
      return [
        { label: "Tomorrow", at: at + DAY },
        { label: "+2 days", at: at + 2 * DAY },
        { label: "Next week", at: at + 7 * DAY },
        { label: "+2 weeks", at: at + 14 * DAY },
      ];
  }
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
