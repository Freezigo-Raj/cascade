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
// AND ONE HIS SECOND PHONE ADDED, session 153: an event Google has never seen
// carries no id of its own, so it is imported on the provider's row number and
// RELINKED when the real id finally arrives. Session 149 held these back; that
// rested on Google giving the event an id within minutes, which is false on a
// phone whose calendar adapter last ran in 2025.
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
const { fromEvent, titleSimilarity } = await import(`./resolve.js${v}`);

const DAY = 24 * 60 * 60 * 1000;

/**
 * The offset a stored instant carries, as signed milliseconds.
 *
 * `calendar.js` holds the same four lines, and neither file can import the
 * other's: both sit beside `resolve.js` rather than above it. Named here in
 * place, the way `isOpen` is named in three files, rather than quietly copied.
 */
function tzMs(iso) {
  const o = String(iso ?? "").slice(-6);
  if (!/^[+-]\d\d:\d\d$/.test(o)) return 0;
  const sign = o[0] === "-" ? -1 : 1;
  return sign * (Number(o.slice(1, 3)) * 60 + Number(o.slice(4, 6))) * 60000;
}

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
 * AN EVENT GOOGLE HAS NEVER SEEN, carried on the provider's own row number.
 *
 * `uidFrom` says which of three the phone could give. `uid2445` is the
 * iCalendar UID and `syncid` is Google's event id; both are the same on every
 * device. `rowid` means NEITHER EXISTED, so the event has never been uploaded.
 *
 * SESSION 149 HELD THESE BACK AND SESSION 153 IMPORTS THEM, which is a reversal
 * and his call. The hold rested on one assumption — that an event with no id is
 * one Google has not carried up YET, and will within minutes. On his second
 * phone that assumption is false: the account's calendar adapter last ran in
 * 2025, so an event created there has no id now and will have none next year.
 * Held became held for ever, and the meeting he was looking for was the thing
 * being held.
 *
 * IMPORTING IT IS ALSO WHAT RESCUES IT. Repairing a stale Google account means
 * removing it from the phone and adding it back, and that DELETES the local
 * events it never uploaded. A task in Cascade survives that; an event waiting
 * for an id does not.
 *
 * THE COST, STATED. The task id is seeded on `row:<n>`, which is a row number
 * on one phone, so a second device importing the same event once it finally
 * syncs would mint a different id and hold a second copy. `relink` below is
 * what keeps that to the one case nothing can fix: this phone recognises the
 * event when its real id arrives and stops using the row number.
 */
export function localOnly(ev) {
  return String(ev?.uidFrom ?? "") === "rowid";
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

/** The local calendar day of a stored instant, which is what "same date" means. */
const dayOf = (iso) => String(iso ?? "").slice(0, 10);

/**
 * A TASK HE ALREADY TYPED THAT IS THIS SAME COMMITMENT, or null.
 *
 * HIS RULE: "check the words and date — if they are the same as an existing
 * task it'll remove duplicates." Both halves are required, and the date half is
 * what makes it safe: `call raj` on Tuesday and `call raj` on Friday are two
 * calls, and a words-only rule would collapse every recurring errand he types
 * into whichever meeting shares its name.
 *
 * THE WORDS TEST IS THE ENGINE'S OWN, imported rather than rewritten.
 * `titleSimilarity` is `max(trigram, word)` over `compare_key`, the same
 * measure the capture screen has warned with since Stage 2, against the same
 * `config.duplicate.threshold`. A second implementation here would be a second
 * thing to tune and the two would disagree the first time either moved.
 *
 * FOUR THINGS DISQUALIFY A CANDIDATE, and each is a case where two rows are the
 * right answer:
 *   · it is closed — a finished task is not the same work as a future meeting;
 *   · it already carries a REAL `calendar_uid` — it belongs to a different
 *     event, and two meetings named the same on one day are two meetings.
 *     A `row:` uid is the exception: that task came from an event Google had
 *     never seen, and an event arriving with a real id and the same words on
 *     the same day is that same event, now synced. This is the relink again,
 *     by content rather than by row id — which matters because it needs no
 *     Kotlin at all, so it works on an APK built before build 3;
 *   · it is on another day;
 *   · it is one this very import just wrote, which would be the pass eating
 *     its own output.
 *
 * The STRONGEST match wins, not the first, because the store comes back in no
 * order and "whichever we looked at first" is not a rule.
 */
function adoptable(ev, task, existing, opts) {
  const threshold = opts?.config?.duplicate?.threshold ?? 0.6;
  const day = dayOf(task.due_at);
  if (!day) return null;
  let best = null;
  const syncedEvent = !localOnly(ev);
  for (const t of existing ?? []) {
    if (closed(t)) continue;
    const uid = String(t.calendar_uid ?? "");
    const localTask = uid.startsWith("row:");
    if (uid && !(localTask && syncedEvent)) continue;
    if (dayOf(t.due_at) !== day) continue;
    const score = titleSimilarity(t.normalised, task.normalised);
    if (score < threshold) continue;
    if (!best || score > best.score) best = { score, task: t };
  }
  return best ? best.task : null;
}

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
 * @returns {{add: object[], update: object[], remove: string[], cancel: object[], unchanged: number,
 *            unsynced: number, relinked: number, adopted: number, detached: number,
 *            ours: number, declined: number, considered: number}}
 */
export function planImport(events, existing, opts) {
  const now = opts.now;
  const config = opts.config;
  const google = opts.googleCalendars;
  const all = events ?? [];
  // COUNTED BEFORE ANYTHING ELSE FILTERS THEM OUT. Counted on the raw list and
  // not on what survives, so the number answers "how many did the phone hand
  // over that I would not touch" rather than "how many got this far".
  // WHY EACH EVENT WAS NOT IMPORTED, COUNTED (session 150, his ask). The report
  // said `read 13` and `added 0` and nothing in between, so the two numbers did
  // not reconcile without him doing the arithmetic in his head — and an import
  // that reads thirteen and writes nothing looks identical whether that is
  // thirteen of his own events going back out or a broken pass.
  //
  // COUNTED IN THE ORDER THE GATES RUN, so the four numbers sum to the read
  // count and no event is counted twice: ours first, then declined, then not
  // ready.
  const ours = all.filter(isOurs).length;
  const said_no = all.filter((ev) => !isOurs(ev) && declined(ev)).length;
  const live = all.filter((ev) => !isOurs(ev) && !declined(ev));
  // NOT A SKIP ANY MORE (session 153). It is counted and imported, and the
  // count is reported because a task carried on a row number is correct on one
  // phone only, which is a thing he should be able to see rather than infer.
  const unsynced = live.filter(localOnly).length;
  const want = nextPerSeries(live, existing);
  const byId = new Map((existing ?? []).map((t) => [t.id, t]));
  // BY `calendar_uid` AS WELL AS BY ID, which is what makes a relink possible.
  // A task written from `row:812` has an id derived from `row:812`, so when the
  // same event turns up carrying a real uid its id no longer matches anything —
  // the row number is the only thread between the two.
  const byUid = new Map();
  for (const t of existing ?? []) if (t.calendar_uid) byUid.set(String(t.calendar_uid), t);
  const seen = new Set();

  const plan = {
    add: [], update: [], remove: [], cancel: [],
    unsynced, relinked: 0, adopted: 0, detached: 0, ours, declined: said_no,
    // EVERY EVENT THAT GOT PAST ALL THREE GATES, and every one of those is then
    // added, updated, left alone, or folded into the occurrence before it. The
    // four account for `considered` exactly:
    //
    //   considered − add − update − unchanged = folded by one-task-per-series
    //
    // `unchanged` exists because without it a task that needed nothing done was
    // being reported as an occurrence the series had folded away. The number was
    // right and the word was wrong.
    considered: live.length,
    unchanged: 0,
  };

  for (const ev of want) {
    seen.add(ev.id);
    const task = fromEvent(ev, { id: ev.id, now, config });
    let have = byId.get(ev.id);

    // THE RELINK (session 153, his design). An event imported before Google
    // had ever seen it was written on `row:<n>`, and the task's id is derived
    // from that — so when the adapter finally runs and the SAME ROW comes back
    // carrying a real uid, the uid-derived id matches nothing and the task
    // looks like a stranger. Deleted, and a fresh copy added, losing the alarm
    // he set on it, the pin, and the notes.
    //
    // The provider's row id is the one thing both versions of the event share,
    // so it is the thread. The task KEEPS ITS OWN ID — rewriting that would
    // mean a delete and an insert in Supabase and would break any alarm armed
    // against it — and only `calendar_uid` moves to the real one.
    //
    // `calendar_detached` STAYS FALSE, his point: the task is attached and
    // always was. Nothing about getting an id is him touching it.
    //
    // Needs calendar shell build 3, which is the build that returns `rowId`.
    // On an older APK `rowId` is absent, nothing matches, and the behaviour is
    // what it was — no worse, and no relink.
    let relinked = false;
    if (!have && ev.rowId && !localOnly(ev)) {
      const was = byUid.get(`row:${ev.rowId}`);
      if (was && !closed(was) && String(was.calendar_uid) !== String(ev.uid)) {
        have = was;
        relinked = true;
        // Its own id, not the event's, or the missing branch below would read
        // the task we just recognised as gone.
        seen.add(was.id);
      }
    }

    if (!have) {
      // SAME WORDS, SAME DAY, SAME THING (session 154, his rule). He types
      // `collect 57,000 from asha` and the same meeting is on the calendar;
      // without this he gets two rows for one commitment and has to notice
      // and merge them by hand, every time.
      //
      // ADOPTED, NEVER DELETED. The task he typed is kept and LINKED to the
      // event: his notes, his alarm, his pin and his own id all survive, and
      // nothing he wrote is thrown away by a guess about what matched. A rule
      // that deletes on a similarity score is a rule that will one day delete
      // the wrong thing, and this one cannot.
      //
      // ONLY A TASK FROM NO CALENDAR. One already carrying a `calendar_uid`
      // belongs to a different event, and two meetings with the same name on
      // the same day are two meetings.
      const twin = adoptable(ev, task, existing, opts);
      if (twin) {
        seen.add(twin.id);
        plan.adopted += 1;
        plan.update.push({
          ...twin,
          calendar_uid: String(ev.uid),
          calendar_detached: false,
          updated_at: now,
        });
        continue;
      }
      plan.add.push(task);
      continue;
    }
    // HIS STATE, ALWAYS. A task he closed is never reopened by an import, and
    // nothing below this line can change that.
    if (closed(have)) { plan.unchanged += 1; continue; }
    // DETACHED MEANS HIS. Google stopped owning the title and the date the
    // moment he corrected one of them; everything else about the task was
    // always his.
    // A DETACHED TASK STILL GETS ITS UID CORRECTED. He owns the title and the
    // date from the moment he edits one; he does not own which event it came
    // from, and leaving a dead row number there would mean the task never
    // learns that Google deleted its event.
    if (have.calendar_detached) {
      if (relinked) {
        plan.relinked += 1;
        plan.update.push({ ...have, calendar_uid: String(ev.uid), updated_at: now });
      } else {
        plan.unchanged += 1;
      }
      continue;
    }
    if (!relinked && have.title === task.title && have.due_at === task.due_at && have.has_time === task.has_time) {
      // ALREADY RIGHT. Counted, because `considered` minus added minus updated
      // was being reported as what one-task-per-series folded away, and a task
      // that simply needed nothing done landed in that number under the wrong
      // name (session 151, found reading his own report rather than from a
      // failure — the arithmetic was right and the WORD was wrong, which is the
      // harder kind to notice).
      plan.unchanged += 1;
      continue;
    }
    // FOLLOWING: Google's title and date win, and everything he set stays. The
    // alarm, the type, the firmness, the notes and the pin are his on every
    // task, so they are carried across rather than rebuilt.
    if (relinked) plan.relinked += 1;
    plan.update.push({
      ...have,
      // The real uid from here on, or the next import would look for the row
      // number again and relink the same task for ever.
      calendar_uid: String(ev.uid),
      calendar_detached: false,
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
    // A TRUE INSTANT ON BOTH SIDES. `fromMs` and `toMs` are real epoch
    // milliseconds, and a stored `due_at` is local wall clock with its offset
    // written on the end — so parsing it as if the wall clock were UTC and
    // comparing the two was out by the offset (session 150, the same confusion
    // that put a 7pm meeting at 1:30pm). Five and a half hours only matters
    // within five and a half hours of either edge of the window, which is
    // exactly the kind of fault that waits months and then deletes something.
    const at = Date.parse(String(t.due_at).slice(0, 19) + "Z") - tzMs(t.due_at);
    if (!(at >= fromMs && at <= toMs)) continue;
    // HIS ANSWER 4, narrowed. A task still following is Google's and goes with
    // the event. A task he detached and edited is HIS, and is cancelled rather
    // than deleted: it shows on the Done tab with `Revive`, because losing work
    // because somebody else tidied their calendar is not a thing this app does.
    // A LOCAL-ONLY TASK IS DETACHED, NEVER DELETED (session 154, and it
    // corrects the advice session 153 gave him). Its event was one Google had
    // never seen, living on that phone and nowhere else — and REPAIRING a
    // stale Google account removes it from the phone and adds it back, which
    // deletes exactly those events. Google has no copy to put back, so the
    // task is the only surviving record of the thing. Deleting it would hand
    // the repair the data the import was run to rescue.
    //
    // It becomes his own task, standing alone, which is what it now is.
    if (String(t.calendar_uid).startsWith("row:")) {
      plan.detached += 1;
      plan.update.push({ ...t, calendar_detached: true, updated_at: now });
      continue;
    }
    if (t.calendar_detached) plan.cancel.push({ ...t, task_state: "cancelled", closed_at: now, updated_at: now });
    else plan.remove.push(t.id);
  }
  return plan;
}
