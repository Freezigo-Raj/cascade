// Cascade Part A — the phone's calendar, written to.
//
// The Android half is `CascadeCalendarPlugin.kt`. This is the only caller, the
// way `alarm.bridge.js` is the only caller of the alarm plugin, and it is built
// to the same shape on purpose: a debounced diff that makes the calendar match
// what the tasks say, every time the tasks change.
//
// WHY THERE IS NO GOOGLE OAUTH IN THIS FILE. The event is written into the
// phone's own calendar provider, on a calendar that belongs to a Google
// account, and Google's sync adapter carries it up. No Cloud project, no
// consent screen, no verification, no refresh token to go stale — and it works
// with no signal, which no OAuth route does. The cost is that it is Android
// only, which was his answer.
//
// OFF UNTIL HE TURNS IT ON. Writing to a person's main calendar is not a thing
// to start doing because an update landed. The switch is on the account screen
// and its answer lives on THIS DEVICE, in `localStorage`, because which
// calendar on which phone is not a fact about the account: syncing it would
// mean a laptop deciding what a phone writes to.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { tasks } = await import(`./store.select.js${v}`);
const { desiredEvents, sameEvent } = await import(`./calendar.js${v}`);
const { planImport, windowFor } = await import(`./calendar.import.js${v}`);

const DEBOUNCE_MS = 2000;

/**
 * NOW, AS A STORED INSTANT WITH ITS OFFSET.
 *
 * `alarm.bridge.js` carries the same four lines and this file cannot import
 * them: the two bridges are siblings and neither is above the other, so an
 * import either way would make the module graph's only cycle. Named here rather
 * than quietly duplicated, the same way `isOpen` is named in three places.
 */
const nowIso = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000);
  return local.toISOString().slice(0, 19) + sign + p(Math.trunc(off / 60)) + ":" + p(off % 60);
};

/** What `CascadeCalendarPlugin.kt` states as its own build. */
export const CALENDAR_SHELL_EXPECTED = 2;

const ON_KEY = "cascade:calendar-on";
const CAL_KEY = "cascade:calendar-id";
const READ_KEY = "cascade:calendar-read";
const IMPORT_KEY = "cascade:calendar-import-on";

function plugin() {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
  return C.Plugins && C.Plugins.CascadeCalendar ? C.Plugins.CascadeCalendar : null;
}

/** True inside an Android build that carries the calendar plugin. */
export function isCalendarShell() {
  return Boolean(plugin());
}

/**
 * The plugin's own build, or 0 when it is not there at all.
 *
 * The web half of this app updates itself on every open and the Kotlin half
 * only changes when the APK is rebuilt, so the two drift by design. An APK
 * built before this plugin existed has no `CascadeCalendar` in it, which reads
 * as 0 and is what the account screen says out loud.
 */
export async function calendarShellVersion() {
  const Cal = plugin();
  if (!Cal) return 0;
  try {
    const { version } = await Cal.version();
    return Number(version) || 1;
  } catch {
    return 1;
  }
}

export function calendarOn() {
  try {
    return window.localStorage.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
}

export function chosenCalendar() {
  try {
    return window.localStorage.getItem(CAL_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * Turn it on or off, or choose which calendar.
 *
 * TURNING IT OFF CLEARS THE CALENDAR. Every event this app wrote is removed,
 * because the alternative is a switch that stops adding and leaves whatever was
 * already there with nothing in the app able to reach it again. A switch that
 * cannot undo what it did is not a switch.
 */
/**
 * Which calendar to write to, written down without turning anything on.
 *
 * The account screen decides this on its first draw now, so that "the one the
 * plugin picked" stops being the answer to where the events went.
 */
export function rememberCalendar(calendarId) {
  try {
    if (calendarId) window.localStorage.setItem(CAL_KEY, String(calendarId));
    else window.localStorage.removeItem(CAL_KEY);
  } catch {
    // A browser refusing storage is not a reason to throw out of a choice.
  }
}

export async function setCalendarOn(on, calendarId) {
  try {
    if (on) window.localStorage.setItem(ON_KEY, "1");
    else window.localStorage.removeItem(ON_KEY);
    if (calendarId !== undefined) {
      if (calendarId) window.localStorage.setItem(CAL_KEY, String(calendarId));
      else window.localStorage.removeItem(CAL_KEY);
    }
  } catch {
    // A browser refusing storage is not a reason to throw out of a switch.
  }
  const Cal = plugin();
  if (!Cal) return;
  if (!on) {
    try {
      await Cal.clear();
    } catch (e) {
      console.warn("calendar: clear failed —", e?.message ?? e);
    }
    return;
  }
  syncCalendar(await tasks.all());
}

/**
 * THE IMPORT SIDE'S OWN SETTINGS, and they are device settings like the rest.
 *
 * Which calendars to READ from is a different question from which one to WRITE
 * to, so it is a different list: a phone writes to one calendar and may read
 * from five, and `Holidays in India` is readable and writable by nobody.
 *
 * Stored on the device, not in the account, for the reason the write choice is:
 * a laptop has no business deciding which of a phone's calendars it reads.
 */
export function importOn() {
  try {
    return window.localStorage.getItem(IMPORT_KEY) === "1";
  } catch {
    return false;
  }
}

/** The calendar ids he ticked, as an array. Empty means import nothing. */
export function readCalendars() {
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setReadCalendars(ids) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(ids ?? []));
  } catch {
    // A browser refusing storage is not a reason to throw out of a tick.
  }
}

export function setImportOn(on) {
  try {
    if (on) window.localStorage.setItem(IMPORT_KEY, "1");
    else window.localStorage.removeItem(IMPORT_KEY);
  } catch {
    // Same.
  }
}

/**
 * `uid2445 8, syncid 3, rowid 1`, in that order, from a list of labels.
 *
 * Ordered most trustworthy first rather than by count, so the line reads as a
 * ladder: the sources before `rowid` are the same on every device and `rowid`
 * is the only one that is not.
 */
function countBy(labels) {
  const n = { uid2445: 0, syncid: 0, rowid: 0 };
  let other = 0;
  for (const l of labels ?? []) {
    if (l in n) n[l] += 1;
    else if (l) other += 1;
  }
  const parts = [];
  for (const k of ["uid2445", "syncid", "rowid"]) if (n[k]) parts.push(`${k} ${n[k]}`);
  if (other) parts.push(`unknown ${other}`);
  return parts.join(", ") || "none";
}

/** Every calendar this phone can READ, for the tick list. */
export async function allCalendars() {
  const Cal = plugin();
  if (!Cal || !Cal.readable) return [];
  try {
    const { calendars } = await Cal.readable();
    return calendars ?? [];
  } catch (e) {
    console.warn("calendar: readable failed —", e?.message ?? e);
    return [];
  }
}

/**
 * THE IMPORT, run once and reporting what it did.
 *
 * Every rule it follows is in `calendar.import.js`, which imports nothing and
 * is what `check_calendar.mjs` reads. This file does the three things a check
 * cannot: it asks the phone, it writes to the store, and it says so.
 *
 * NOT DEBOUNCED AND NOT ON A LISTENER. The push pass runs on every write
 * because a task changing is the reason to change its event. The import has no
 * such trigger: a calendar changes on somebody else's schedule, and running a
 * provider query on every keystroke would be a query per keystroke. It runs at
 * start, and on the button.
 */
export async function importCalendar() {
  const Cal = plugin();
  if (!Cal || !Cal.events) {
    return { ok: false, why: "This APK is older than the calendar import. Rebuild and reinstall it." };
  }
  if (!importOn()) return { ok: false, why: "The import switch is off." };
  const ids = readCalendars();
  if (!ids.length) return { ok: false, why: "No calendar is ticked, so there is nothing to read." };

  const nowMs = Date.now();
  const { fromMs, toMs } = windowFor(nowMs, partAConfig);
  let events = [];
  try {
    const r = await Cal.events({ fromMs, toMs, calendarIds: ids });
    events = r.events ?? [];
  } catch (e) {
    return { ok: false, why: "events() refused: " + (e?.message ?? e) };
  }

  // WHICH OF THE TICKED CALENDARS SYNC, which is what decides whether a local
  // row number is a usable identity or a temporary one. `readable()` states
  // `google` per calendar and this is the only thing that reads it. If the
  // call fails the set is empty, which accepts every row id — the behaviour
  // before session 149, and the safe direction when the answer is unknown: a
  // task that arrives and later swaps id beats a task that never arrives.
  const google = new Set();
  for (const c of await allCalendars()) {
    if (c?.google && ids.includes(String(c.id))) google.add(String(c.id));
  }

  const existing = await tasks.all();
  const plan = planImport(events, existing, {
    now: nowIso(), nowMs, config: partAConfig, googleCalendars: google,
  });
  const report = {
    ok: true, read: events.length,
    added: 0, updated: 0, removed: 0, cancelled: 0,
    // HELD, NOT DROPPED. An event with no stable id on a syncing calendar is
    // waiting for Google to give it one, and an event that simply never appears
    // is indistinguishable from one the window missed.
    notReady: plan.notReady ?? 0,
    errors: [],
    // WHICH ID THE PHONE COULD GIVE, COUNTED PER SOURCE rather than listed.
    // His first import reported `syncid, rowid`, which says both happened and
    // nothing about the split — and the split is the whole question: one rowid
    // among twelve is a local event, twelve of twelve is a phone where Google's
    // adapter writes neither id.
    uidFrom: countBy(events.map((e) => e.uidFrom)),
  };
  const guard = async (what, fn) => {
    try { await fn(); } catch (e) { report.errors.push(`${what}: ${e?.message ?? e}`); }
  };
  for (const t of plan.add) await guard(t.title, () => tasks.add(t));
  for (const t of plan.update) await guard(t.title, () => tasks.update(t.id, t));
  for (const t of plan.cancel) await guard(t.title, () => tasks.update(t.id, t));
  for (const id of plan.remove) await guard(id, () => tasks.remove(id));
  report.added = plan.add.length;
  report.updated = plan.update.length;
  report.cancelled = plan.cancel.length;
  report.removed = plan.remove.length;
  if (report.errors.length) report.ok = false;
  return report;
}

/** Which calendars this phone can write to, for the account screen to offer. */
export async function writableCalendars() {
  const Cal = plugin();
  if (!Cal) return [];
  try {
    const { calendars } = await Cal.calendars();
    return calendars ?? [];
  } catch (e) {
    console.warn("calendar: list failed —", e?.message ?? e);
    return [];
  }
}

export async function calendarPermission() {
  const Cal = plugin();
  if (!Cal) return { read: false, write: false, present: false };
  try {
    const p = await Cal.permissions();
    return { read: Boolean(p.read), write: Boolean(p.write), present: true };
  } catch {
    return { read: false, write: false, present: true };
  }
}

export async function requestCalendarPermission() {
  const Cal = plugin();
  if (!Cal) return;
  try {
    await Cal.request();
  } catch (e) {
    console.warn("calendar: permission —", e?.message ?? e);
  }
}

/**
 * THE SYNC, RUN NOW, WITH AN ANSWER (session 147, his report: "calendar shell
 * present, permission granted, write-to selected, but tasks don't reach the
 * calendar").
 *
 * `syncCalendar()` below swallows everything into `console.warn`. On a phone
 * there is no console, so every way this can fail — the plugin rejecting, no
 * writable calendar, an insert the provider refused, or simply no task that
 * qualifies — looks exactly the same: nothing happens.
 *
 * This is the same work with the debounce removed and a report returned, so
 * the account screen can say which of those it was. It writes nothing that
 * `syncCalendar` would not have written.
 */
export async function syncCalendarNow() {
  const Cal = plugin();
  if (!Cal) return { ok: false, why: "This build has no calendar plugin in it." };
  if (!calendarOn()) return { ok: false, why: "The calendar switch is off." };

  const all = await tasks.all();
  const want = desiredEvents(all, partAConfig);
  const report = {
    ok: true, tasks: all.length, wanted: want.length,
    had: 0, written: 0, removed: 0, errors: [],
    calendarId: chosenCalendar() || "(none chosen — the plugin picks the primary one)",
  };
  if (!want.length) {
    report.ok = false;
    report.why = all.length
      ? "No task has a date. Only tasks with a date go to the calendar; Ideas do not."
      : "There are no tasks.";
    return report;
  }

  let have = [];
  try {
    const r = await Cal.list();
    have = r.events ?? [];
  } catch (e) {
    report.ok = false;
    report.why = "list() refused: " + (e?.message ?? e);
    return report;
  }
  report.had = have.length;

  const byId = new Map(have.map((e) => [e.id, e]));
  const wanted = new Set(want.map((e) => e.id));
  const calendarId = chosenCalendar();

  for (const e of want) {
    if (sameEvent(byId.get(e.id), e)) continue;
    try {
      await Cal.set(calendarId ? { ...e, calendarId } : e);
      report.written += 1;
    } catch (err) {
      // THE FIRST ONE, VERBATIM. A message rewritten in friendlier words is a
      // message that cannot be looked up.
      report.errors.push(`${e.title}: ${err?.message ?? err}`);
    }
  }
  for (const c of have) {
    if (wanted.has(c.id)) continue;
    try {
      await Cal.remove({ id: c.id });
      report.removed += 1;
    } catch (err) {
      report.errors.push(`remove ${c.id}: ${err?.message ?? err}`);
    }
  }

  // WROTE, AND THEN LOOKED. An insert the provider quietly refused resolves
  // like a successful one, so the only honest check is to ask again.
  try {
    const r = await Cal.list();
    report.nowThere = (r.events ?? []).length;
  } catch {
    report.nowThere = null;
  }
  if (report.errors.length) report.ok = false;
  else if (report.nowThere === 0 && report.written > 0) {
    report.ok = false;
    report.why = "Every write was accepted and the calendar is still empty. The provider refused the insert without saying so, which usually means the chosen calendar cannot be written to.";
  }
  return report;
}

let timer = null;

/**
 * Make the calendar say what the tasks say.
 *
 * Debounced for the same reason the alarm's pass is: a burst of writes while a
 * sync lands would otherwise mean a provider round trip per row.
 *
 * THE DIFF IS BY TASK ID AND THE SHELL HOLDS THE MAP. `list()` returns what
 * this app put there, keyed by task id, so an event he moved or deleted by hand
 * in Google Calendar is put back — which is what one-way means, and is stated
 * on the account screen rather than discovered.
 */
export function syncCalendar(all) {
  const Cal = plugin();
  if (!Cal || !calendarOn()) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const want = desiredEvents(all, partAConfig);
      const { events: have } = await Cal.list();
      const byId = new Map((have ?? []).map((e) => [e.id, e]));
      const wanted = new Set(want.map((e) => e.id));
      const calendarId = chosenCalendar();

      for (const e of want) {
        if (sameEvent(byId.get(e.id), e)) continue;
        await Cal.set(calendarId ? { ...e, calendarId } : e);
      }
      for (const c of have ?? []) {
        // HIS ANSWER 5: a delete travels. A task closed, cancelled, archived or
        // deleted for good is not in `want`, and this is the line that takes
        // its event with it.
        if (!wanted.has(c.id)) await Cal.remove({ id: c.id });
      }
    } catch (e) {
      console.warn("calendar: sync failed —", e?.message ?? e);
    }
  }, DEBOUNCE_MS);
}

/**
 * Called once at start, after the store has loaded.
 *
 * The two listeners are the alarm's two, for the same two reasons:
 * `cascade:store-changed` fires for writes arriving FROM THE SERVER, and
 * `cascade:tasks-written` fires for every local write (session 142), which is
 * the only one that happens with no signal.
 */
export async function initCalendar() {
  const Cal = plugin();
  if (!Cal) return;
  window.addEventListener("cascade:store-changed", async () => {
    syncCalendar(await tasks.all());
  });
  window.addEventListener("cascade:tasks-written", async () => {
    syncCalendar(await tasks.all());
  });
  syncCalendar(await tasks.all());
  // THE IMPORT RUNS ONCE, HERE, AND NOT ON A LISTENER. A task changing is a
  // reason to change its event; a calendar changing is not something this app
  // is told about, so there is nothing to listen to. Running the provider query
  // on every write would be a query per keystroke for an answer that changes
  // when somebody else moves a meeting.
  if (importOn()) {
    importCalendar()
      .then((r) => { if (!r.ok && r.why) console.warn("calendar import:", r.why); })
      .catch((e) => console.warn("calendar import:", e?.message ?? e));
  }
}
