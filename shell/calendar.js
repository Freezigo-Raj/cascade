// Cascade Part A — which tasks belong in the phone's calendar, and as what.
//
// PURE, AND THAT IS THE POINT. This file imports nothing and touches neither
// the store nor the Capacitor bridge, so `check_calendar.mjs` can import it and
// assert every rule below. The write path — the part that actually inserts and
// deletes rows in the Android calendar provider — is `calendar.bridge.js`, and
// it is the same seam session 127 cut for the alarm: a write path no check can
// reach is what cost four silently lost outcomes in session 123.
//
// HIS FIVE ANSWERS, session 145, and each one is a rule here:
//
//   1. ONE WAY. Tasks go into the calendar. Nothing comes back.
//   2. EVERY TASK WITH A DATE. A dateless task is an Idea and gets no event.
//   3. HIS MAIN CALENDAR, not a separate `Cascade` one.
//   4. ANDROID ONLY. No Google OAuth, no Cloud project, no consent screen and
//      no verification: the event is written into the local calendar provider
//      and Google's own sync adapter carries it up. It also works with no
//      signal, which no OAuth route does.
//   5. CASCADE IS THE TRUTH, AND A DELETE TRAVELS. A task closed, cancelled,
//      archived or deleted for good loses its event.
//
// WHAT A CLOSED TASK COSTS, stated rather than discovered: the event goes when
// the task closes, so the calendar does not keep a record of having done it at
// five. The alternative is a calendar that fills with finished things nobody
// can clear from the app that put them there, and between a lost record and an
// unclearable one the lost record is the smaller harm. Easily reversed: it is
// the `isOpen` line below and nothing else.

/** A stored instant as epoch milliseconds, OFFSET INCLUDED. */
function ms(iso) {
  const off = iso.slice(-6);
  const sign = off[0] === "-" ? -1 : 1;
  const mins = sign * (Number(off.slice(1, 3)) * 60 + Number(off.slice(4, 6)));
  return Date.parse(iso.slice(0, 19) + "Z") - mins * 60000;
}

/** The local calendar day of a stored instant, as `YYYY-MM-DD`. */
function dayOf(iso) {
  return iso.slice(0, 10);
}

/**
 * The engine's one open-task predicate, written out.
 *
 * `cards.js` owns `isOpen` and this file cannot import it: `cards.js` imports
 * the things this file sits beside, and importing back would make the graph's
 * only cycle. `repeat.js` and `alarm.js` each carry the same line for the same
 * reason, named in place rather than quietly duplicated.
 */
function isOpen(t) {
  return Boolean(t) && t.task_state === "ready" && !t.archived;
}

/**
 * The instant a task sits at.
 *
 * `due_at` OR `earliest_start`, which is the same test the Default list uses to
 * decide a task has a date at all. `after friday` is a task with a day attached
 * and a person who typed one is not filing an idea, so it gets an event on the
 * day it can start.
 */
export function dateOf(task) {
  return (task.due_at || task.earliest_start || "") || null;
}

/**
 * Whether this task belongs in the calendar.
 *
 * No date means an Idea, and an Idea is a thought with nowhere to put it: there
 * is no day to draw it on. That is his answer 2 and it needs no more than this.
 */
export function wantsEvent(task) {
  return isOpen(task) && Boolean(dateOf(task));
}

/**
 * What one task looks like as a calendar event.
 *
 * TIMED OR ALL-DAY, AND THE TASK ALREADY SAYS WHICH. `has_time` is true exactly
 * when the line carried a clock time, so `call kushan 5pm` is a block at five
 * and `pay rent 15th` is an all-day banner on the 15th. The engine has had that
 * distinction since Stage 2 and this reads it rather than inventing a second.
 *
 * A TIMED EVENT IS A FIXED BLOCK AND NOT `est_duration_min`. The duration is a
 * QUIET FIELD (session 89, his principle): it is collected so suggestions are
 * better and is never shown. A calendar event whose length is the engine's
 * guess would show it — on the clearest screen a person owns, next to real
 * meetings, where a wrong forty minutes reads as a commitment somebody made.
 * `config.calendar.block_min` is one stated number that claims nothing about
 * the task. Changing this to use the duration is a second amendment to the
 * quiet-field rule, after the slot totals in session 121, and it is his to make.
 *
 * The id is the TASK's id. The mapping from it to whatever row id the Android
 * provider hands back lives on the phone, in `CalendarStore`, because an event
 * id is about one calendar on one device and would be wrong on the next one.
 */
export function eventFor(task, config) {
  const at = dateOf(task);
  if (!at) return null;
  const block = (config?.calendar?.block_min ?? 30) * 60000;
  const common = {
    id: task.id,
    title: task.title || "(untitled)",
    // The marker is for him and the id is for the shell: if the phone's own
    // map is ever lost, this line is what stops a second copy of every event
    // being written. One closed occurrence, one successor — the same lesson as
    // session 143, applied before it can cost anything.
    description: `From Cascade\ncascade:${task.id}`,
  };
  if (task.has_time) {
    const start = ms(at);
    return { ...common, allDay: false, startMs: start, endMs: start + block, date: null };
  }
  // ALL-DAY EVENTS CARRY A DATE AND NOT AN INSTANT. The Android provider wants
  // UTC midnight with `EVENT_TIMEZONE` set to UTC for an all-day row, and
  // building that from a local instant here would be this app computing a
  // midnight in the wrong zone and calling it a date. The day travels as
  // `YYYY-MM-DD`, which is what the stored instant already says in its own
  // offset, and Kotlin builds the row the provider asks for.
  return { ...common, allDay: true, startMs: null, endMs: null, date: dayOf(at) };
}

/**
 * Every event that should exist, for every task handed in.
 *
 * Order is the store's, which is no order at all; the shell diffs by id.
 */
export function desiredEvents(all, config) {
  const out = [];
  for (const task of all ?? []) {
    if (!wantsEvent(task)) continue;
    const e = eventFor(task, config);
    if (e) out.push(e);
  }
  return out;
}

/**
 * Whether an event already in the calendar still says what it should.
 *
 * Title, day or time, and the all-day flag. The description is deliberately NOT
 * compared: it carries the id and the marker and neither changes, so comparing
 * it could only ever rewrite a row to change nothing.
 */
export function sameEvent(have, want) {
  if (!have || !want) return false;
  if (have.title !== want.title) return false;
  if (Boolean(have.allDay) !== Boolean(want.allDay)) return false;
  if (want.allDay) return have.date === want.date;
  return have.startMs === want.startMs && have.endMs === want.endMs;
}
