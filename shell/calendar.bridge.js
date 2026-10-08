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

const DEBOUNCE_MS = 2000;

/** What `CascadeCalendarPlugin.kt` states as its own build. */
export const CALENDAR_SHELL_EXPECTED = 1;

const ON_KEY = "cascade:calendar-on";
const CAL_KEY = "cascade:calendar-id";

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
}
