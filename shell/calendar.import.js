// Cascade Part A — calendar events becoming tasks.
//
// PURE, LIKE `calendar.js` BESIDE IT, and for the same reason: every rule here
// is one his answers decided, and `check_calendar.mjs` can assert all of them
// because this file imports nothing but the engine's `fromEvent`.
//
// HIS ANSWERS, session 148, and each one is a rule below:
//
//   1. EVERY EVENT IN A WINDOW, from the calendars he ticks. 10 days back, 60
//      forward. Declined events skipped.
//   2. ONE TASK PER SERIES, THE NEXT OCCURRENCE ONLY. A weekly standup is one
//      row, not sixty.
//   3. FOLLOWING UNTIL HE TOUCHES IT. While a task follows, Google owns its
//      title and date. The first edit to either detaches it and Google never
//      touches it again.
//   4. GOOGLE DELETES IT: deleted if it was still following, CANCELLED if it
//      had been detached — his work does not vanish because somebody else
//      cleared their calendar.
//   5. `task_state` IS ALWAYS CASCADE'S. A task he has closed is never reopened
//      by an import, whatever the calendar still holds.
//
// THE LOOP, AND THE TWO GATES THAT STOP IT. Without them the push and the
// import feed each other for ever: a task writes an event, the event is read
// back as a task, that task writes an event. The gates are one on each side —
//   · an event whose description carries `cascade:` is OURS, never imported
//     (here, in `isOurs`);
//   · a task carrying a `calendar_uid` is THEIRS, never pushed
//     (in `calendar.js`, where `wantsEvent` refuses it).
// Each is one line, and each is useless without the other.

const v = new URL(import.meta.url).search;
const { fromEvent } = await import(`./resolve.js${v}`);

const DAY = 24 * 60 * 60 * 1000;

/** The window the phone is asked for. His numbers. */
export function windowFor(nowMs, config) {
  const back = config?.calendar?.import_days_back ?? 10;
  const ahead = config?.calendar?.import_days_ahead ?? 60;
  return { fromMs: nowMs - back * DAY, toMs: nowMs + ahead * DAY };
}

/**
 * An event this app wrote.
 *
 * The marker went into every pushed event's description in session 145, as a
 * guard against a lost id map. It earns its keep twice: it is also the only
 * thing that tells an import that an event is its own reflection.
 */
export function isOurs(ev) {
  return String(ev?.description ?? "").includes("cascade:");
}

/**
 * DECLINED EVENTS ARE SKIPPED, his answer. `selfStatus` is the provider's
 * `SELF_ATTENDEE_STATUS`, and 2 is declined. A meeting he said no to is not a
 * commitment, and putting it in Today would be the app disagreeing with him.
 */
export function declined(ev) {
  return Number(ev?.selfStatus ?? 0) === 2;
}

/**
 * A TASK ID DERIVED FROM THE EVENT, never invented.
 *
 * The same mechanism as `successorId` in `repeat.js`, for the same three
 * reasons: importing twice gives one task rather than two, two phones compute
 * the same id so newest-wins collapses them, and clearing this app's storage
 * and importing again gives the ids back rather than a second copy of
 * everything.
 *
 * SEEDED ON THE UID AND THE OCCURRENCE'S START. A repeating event has one UID
 * and many occurrences, and each occurrence is its own task in its own turn —
 * so the start is what separates this week's standup from next week's. It is
 * also what makes a closed occurrence stay closed: its id is a function of a
 * start time that does not move.
 *
 * Not a v4. It is a function of its inputs on purpose, which is the whole point.
 */
export function importedId(uid, startMs) {
  const seed = `cal:${uid}:${startMs}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 1), 2654435761) >>> 0;
  }
  const hex = (n) => n.toString(16).padStart(8, "0");
  const a = hex(h1), b = hex(h2);
  const c = hex((h1 ^ 0x9e3779b9) >>> 0), d = hex((h2 ^ 0x7f4a7c15) >>> 0);
  return `${a}-${b.slice(0, 4)}-7${b.slice(5, 8)}-8${c.slice(1, 4)}-${c.slice(4)}${d}`;
}

const closed = (t) => Boolean(t) && (t.task_state !== "ready" || t.archived);

/**
 * ONE OCCURRENCE PER SERIES, his rule: "for repeat tasks on google, only show
 * the next event".
 *
 * Sixty weekly standups in a seventy-day window would bury every real task in
 * Upcoming, and Cascade's own repeats have said since session 91 that there is
 * never more than one open occurrence. This is the same answer for somebody
 * else's repeat.
 *
 * WHICH ONE IS "NEXT" IS NOT SIMPLY THE SOONEST. It is the earliest occurrence
 * in the window that he has not already closed — so a standup missed on Monday
 * is still Monday's standup, overdue, until he marks it done, and only then
 * does Tuesday's appear. That is exactly what a Cascade repeat does, and it
 * falls out of the id being a function of the start.
 *
 * A one-off event has one occurrence and this returns it, which is the same
 * rule with nothing to choose between.
 */
export function nextPerSeries(events, existing) {
  const byId = new Map((existing ?? []).map((t) => [t.id, t]));
  const series = new Map();
  for (const ev of events ?? []) {
    const uid = String(ev.uid ?? "");
    if (!uid) continue;
    const list = series.get(uid) ?? [];
    list.push(ev);
    series.set(uid, list);
  }
  const out = [];
  for (const list of series.values()) {
    list.sort((a, b) => Number(a.startMs) - Number(b.startMs));
    let taken = null;
    for (const ev of list) {
      const id = importedId(ev.uid, ev.startMs);
      // Already closed here. The next one in the series is the live one.
      if (closed(byId.get(id))) continue;
      taken = { ...ev, id };
      break;
    }
    // Every occurrence in the window is closed. Nothing is owed, and nothing is
    // written: a series he has finished with for now is not a task.
    if (taken) out.push(taken);
  }
  return out;
}

/**
 * What the import should do, as a list of writes. It decides; the bridge does.
 *
 * `existing` is every task in the store, closed ones included — a closed task
 * is exactly what stops a series handing back an occurrence he has finished.
 *
 * @returns {{add: object[], update: object[], remove: string[], cancel: object[]}}
 */
export function planImport(events, existing, opts) {
  const now = opts.now;
  const config = opts.config;
  const live = (events ?? []).filter((ev) => !isOurs(ev) && !declined(ev));
  const want = nextPerSeries(live, existing);
  const byId = new Map((existing ?? []).map((t) => [t.id, t]));
  const seen = new Set();

  const plan = { add: [], update: [], remove: [], cancel: [] };

  for (const ev of want) {
    seen.add(ev.id);
    const task = fromEvent(ev, { id: ev.id, now, config });
    const have = byId.get(ev.id);
    if (!have) {
      plan.add.push(task);
      continue;
    }
    // HIS STATE, ALWAYS. A task he closed is never reopened by an import, and
    // nothing below this line can change that.
    if (closed(have)) continue;
    // DETACHED MEANS HIS. Google stopped owning the title and the date the
    // moment he corrected one of them; everything else about the task was
    // always his.
    if (have.calendar_detached) continue;
    if (have.title === task.title && have.due_at === task.due_at && have.has_time === task.has_time) continue;
    // FOLLOWING: Google's title and date win, and everything he set stays. The
    // alarm, the type, the firmness, the notes and the pin are his on every
    // task, so they are carried across rather than rebuilt.
    plan.update.push({
      ...have,
      title: task.title,
      normalised: task.normalised,
      verb_phrase: task.verb_phrase,
      action_verb: task.action_verb,
      due_at: task.due_at,
      has_time: task.has_time,
      date_precision: task.date_precision,
      date_anchor: task.date_anchor,
      updated_at: now,
    });
  }

  // GONE FROM THE CALENDAR. Only tasks that came FROM the calendar are
  // considered, and only ones whose occurrence sat inside the window that was
  // actually read — a task in March is not missing because today's window ended
  // in December.
  const { fromMs, toMs } = windowFor(opts.nowMs, config);
  for (const t of existing ?? []) {
    if (!t.calendar_uid) continue;
    if (closed(t)) continue;
    if (seen.has(t.id)) continue;
    const at = Date.parse(String(t.due_at).slice(0, 19) + "Z");
    if (!(at >= fromMs && at <= toMs)) continue;
    // HIS ANSWER 4, narrowed. A task still following is Google's and goes with
    // the event. A task he detached and edited is HIS, and is cancelled rather
    // than deleted: it shows on the Done tab with `Revive`, because losing work
    // because somebody else tidied their calendar is not a thing this app does.
    if (t.calendar_detached) plan.cancel.push({ ...t, task_state: "cancelled", closed_at: now, updated_at: now });
    else plan.remove.push(t.id);
  }
  return plan;
}
