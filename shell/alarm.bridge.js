// Cascade — the alarm bridge. The seam between the web app and the thing that
// makes a noise.
//
// Everything here is a no-op off the Android shell, so the same files run on the
// web, on a phone browser and inside Capacitor, and nothing above this file
// knows which. `isNativeShell()` is the only question anyone else asks.
//
// TWO DIRECTIONS, and they are not symmetrical.
//
// Down: state → armed alarms. Debounced, diffed, and driven off `ringAt()`, so
// the app never says when to ring, only which tasks and which instant.
//
// Up: a press → a record. Three verbs and each maps to one function in
// `alarm.js`: DONE, SNOOZE:<minutes>, UNANSWERED. The app is the only thing that
// writes to the store, which is why the shell queues outcomes instead of trying
// to write them itself.
//
// THE DIFF COMPARES `armed_for`, NOT `at`. This is the whole of what makes a
// snooze survive. A snoozed alarm's `at` is not its derived instant any more, so
// a diff on `at` sees a mismatch and re-arms it back to a time that has already
// gone, or worse, drops it out of `desired` for being in the past and cancels
// it. Opening the app during a snooze used to end the snooze for exactly that
// reason. `armed_for` carries the derived instant the shell armed against, so a
// snoozed alarm and a stale one stop looking alike.
//
// The shell's copy of the snooze and the task's `alarm_snoozed_until` are
// allowed to disagree for as long as it takes an outcome to drain. That is the
// point of two homes: the shell can re-ring with the WebView dead, and the task
// carries the version that reaches the other devices.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { tasks } = await import(`./store.select.js${v}`);
const { canAlarm, alarmAt, ringAt, snoozed, unanswered } = await import(`./alarm.js${v}`);
const { pushed } = await import(`./push.js${v}`);
const { spawn } = await import(`./repeat.js${v}`);
const { listOnly } = await import(`./resolve.js${v}`);

const DEBOUNCE_MS = 2000;

function plugin() {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
  return C.Plugins && C.Plugins.CascadeAlarm ? C.Plugins.CascadeAlarm : null;
}

/** True inside the Android shell. The account screen draws this. */
export function isNativeShell() {
  return Boolean(plugin());
}

const nowIso = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000);
  return local.toISOString().slice(0, 19) + sign + p(Math.trunc(off / 60)) + ":" + p(off % 60);
};

const ms = (iso) => Date.parse(iso.slice(0, 19) + "Z") - offsetMs(iso);
const offsetMs = (iso) => {
  const o = iso.slice(-6);
  const sign = o[0] === "-" ? -1 : 1;
  return sign * (Number(o.slice(1, 3)) * 60 + Number(o.slice(4, 6))) * 60000;
};

/**
 * Which alarms should exist, and what each one says.
 *
 * `canAlarm()` is the gate and it is not re-stated here: an alarm needs a stated
 * time, an open task and an alarm asked for. Hard or soft makes no difference to
 * whether it rings — a person who set an alarm asked for one — and the firmness
 * is what decides where the task sits in the list, not whether it sounds.
 *
 * The sentence on the lock screen is `card_reason_short`, the mobile form. A
 * notification is the smallest screen there is.
 */
export function desiredAlarms(all, now) {
  const cards = new Map();
  const targets = new Map();
  try {
    // The same call the list screen makes, so the lock screen and the row
    // cannot end up saying two different things about one task. It also carries
    // the push targets, which are load-aware and therefore need every task.
    for (const c of listOnly(all, partAConfig, now).cards) {
      cards.set(c.card_id, c.card_reason_short);
      // Two, not three. A lock screen already holds Done and four snooze
      // buttons, and a seventh control is one more thing to aim past.
      targets.set(c.card_id, (c.push_options ?? []).slice(0, 2));
    }
  } catch (e) {
    // A sentence is decoration. A missing one must not stop an alarm ringing.
    console.warn("alarm: no sentence —", e?.message ?? e);
  }
  return all
    .filter((t) => canAlarm(t) && t.alarm_type !== "none")
    .map((t) => {
      const armed = alarmAt(t, partAConfig);
      const ring = ringAt(t, partAConfig, now);
      return {
        id: t.id,
        at: ms(ring),
        armedFor: ms(armed),
        title: t.title,
        reason: cards.get(t.id) ?? "",
        // Computed now, pressed later. The load behind them is as old as the
        // gap between arming and ringing, refreshed every time the app opens.
        pushTargets: (targets.get(t.id) ?? []).map((o) => ({
          label: o.push_label,
          iso: o.push_to,
        })),
        snoozeOptions: partAConfig.alarm_snooze_options,
        ringSec: partAConfig.alarm_defaults.ring_sec,
        autoSnoozeMin: partAConfig.alarm_defaults.auto_snooze_min,
        autoMax: partAConfig.alarm_defaults.auto_max,
      };
    });
}

let timer = null;

/**
 * Called on every store change. Debounced, because a single edit fires several.
 *
 * Every number the shell needs travels in the payload: the ring length, the
 * auto-snooze interval, the auto limit and the four buttons. Nothing is written
 * into Kotlin. Three copies of one number is the drift this project has paid for
 * five times, and a value that lives in two languages is the worst version of it.
 */
export function syncAlarms(all) {
  const Alarm = plugin();
  if (!Alarm) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const now = nowIso();
      const want = desiredAlarms(all, now);
      const { alarms: have } = await Alarm.list();
      const byId = new Map((have ?? []).map((a) => [a.id, a]));
      const wanted = new Set(want.map((a) => a.id));

      for (const a of want) {
        const c = byId.get(a.id);
        // `armedFor` is the comparison, and this is the whole of what makes a
        // snooze and an auto-snooze chain survive the app being opened. An alarm
        // already armed against the same derived instant is LEFT ALONE whatever
        // its `at` says, because a moved `at` is exactly what a snooze is.
        // Push targets are deliberately NOT compared. They go stale by design
        // and a re-arm on a changed label would rewrite an alarm every time a
        // day filled up, which is a lot of writes to change two words.
        if (c && c.armedFor === a.armedFor && c.title === a.title && c.reason === a.reason) continue;
        // Nothing armed and the ring time has gone: not fired late. A phone that
        // was off is not owed the noise, and the task is on the overdue list
        // either way. Arming it would ring the instant the app opened.
        if (a.at <= Date.now()) continue;
        await Alarm.set(a);
      }
      for (const c of have ?? []) {
        if (!wanted.has(c.id)) await Alarm.cancel({ id: c.id });
      }
    } catch (e) {
      console.warn("alarm: sync failed —", e?.message ?? e);
    }
  }, DEBOUNCE_MS);
}

/**
 * A press, or the end of a chain, becomes a record.
 *
 * DONE is stamped past whatever the local copy carries, so newest-wins cannot
 * resurrect a task somebody finished at the lock screen. That is the one place
 * this app writes a time that is not the clock, and the reason is that the
 * alternative is a completed task coming back.
 *
 * SNOOZE and UNANSWERED are ordinary writes at the outcome's own instant. If
 * another device moved the task's date in between, the push cleared the snooze
 * and the marker, and newest-wins settles which of the two happened last. That
 * is the same rule everything else in the store lives under.
 */
async function apply(id, verb, tsMs) {
  const all = await tasks.all();
  const task = all.find((t) => t.id === id);
  // A task deleted while its alarm was pending. Nothing to write, and the
  // ringing already stopped.
  if (!task) return;
  const now = isoAt(tsMs, task);

  if (verb === "DONE") {
    const stamp = isoAt(Math.max(tsMs, ms(task.updated_at ?? now) + 1000, Date.now()), task);
    // update(id, record) — every branch here once passed the record alone, the
    // store threw `is not here` into a catch, and lock-screen Done, Push,
    // Snooze and the unanswered escalation all wrote NOTHING (session 123).
    await tasks.update(task.id, {
      ...task,
      task_state: "done",
      closed_at: now,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      updated_at: stamp,
    });
    // A LOCK-SCREEN DONE IS A DONE: a repeat spawns its next occurrence here
    // exactly as it does from the list (session 123 — before this, only the
    // in-app press spawned, so a weekly task closed from the alarm screen
    // silently ended its series).
    const next = spawn({ ...task, task_state: "done" }, crypto.randomUUID(), now);
    if (next) await tasks.add(next);
    return;
  }
  if (verb.startsWith("PUSH:")) {
    // The target travels whole, offset included, because a due date is a local
    // instant and rebuilding one from epoch milliseconds would drop the zone.
    const to = verb.slice("PUSH:".length);
    await tasks.update(task.id, pushed(task, to, now));
    return;
  }
  if (verb.startsWith("SNOOZE")) {
    const mins = Number(verb.split(":")[1]) || partAConfig.alarm_defaults.auto_snooze_min;
    await tasks.update(task.id, snoozed(task, mins, now));
    return;
  }
  if (verb === "UNANSWERED") {
    await tasks.update(task.id, unanswered(task, now));
  }
}

/** An epoch instant written at the task's own offset, so a local day survives. */
function isoAt(t, task) {
  const off = (task.due_at ?? task.created_at ?? nowIso()).slice(-6);
  const sign = off[0] === "-" ? -1 : 1;
  const mins = sign * (Number(off.slice(1, 3)) * 60 + Number(off.slice(4, 6)));
  const d = new Date(t + mins * 60000);
  return d.toISOString().slice(0, 19) + off;
}

/**
 * Called once at start, after the store has loaded.
 *
 * The drain comes first and it matters: a press that happened while the WebView
 * was dead is the normal case, not the exception. An alarm rings at 6:45 on a
 * locked phone and the app is not opened until 9.
 */
export async function initAlarms() {
  const Alarm = plugin();
  if (!Alarm) return;
  try {
    const { outcomes } = await Alarm.drainOutcomes();
    for (const o of outcomes ?? []) await apply(o.id, o.verb, o.ts);
  } catch (e) {
    console.warn("alarm: drain failed —", e?.message ?? e);
  }
  Alarm.addListener("alarmOutcome", ({ id, verb }) => {
    apply(id, verb, Date.now()).catch((e) => console.warn("alarm: outcome —", e?.message ?? e));
  });
  window.addEventListener("cascade:store-changed", async () => {
    syncAlarms(await tasks.all());
  });
  syncAlarms(await tasks.all());
}

/**
 * FOUR ANDROID PERMISSIONS, each read rather than assumed.
 *
 * None can be granted from inside the app: three open a system screen and the
 * fourth is a runtime prompt. What matters is that they fail differently, so an
 * app that only knows "something is missing" is an app that cannot tell a person
 * which switch to find. Each one is named and each has its own control.
 *
 * `notifications`  nothing appears at all.
 * `exactAlarm`     the ring can drift by minutes, or by an hour in Doze.
 * `fullScreen`     it rings as a notification and the lock screen never appears,
 *                  so Done and one snooze are all that is reachable.
 * `batteryExempt`  the ring can be delayed when the phone has been idle.
 *
 * Only the first two stop it working. The other two make it worse quietly, which
 * is the harder kind to notice.
 */
export const PERMISSIONS = [
  { key: "notifications", label: "Notifications",
    why: "Without this nothing appears at all, however loudly it rings.",
    request: "requestNotifications" },
  { key: "exactAlarm", label: "Exact timing",
    why: "Without this the ring can drift by minutes, or longer while the phone is idle.",
    request: "requestExactAlarm" },
  { key: "fullScreen", label: "Full screen on the lock screen",
    why: "Without this it rings as a notification and the alarm screen never appears, so only Done and one snooze are reachable. Android withholds this from apps not installed from the Play Store.",
    request: "requestFullScreen" },
  { key: "batteryExempt", label: "Unrestricted battery",
    why: "Without this a ring can be held back when the phone has been sitting idle.",
    request: "requestBatteryExemption" },
];

/**
 * THE TWO HALVES OF THIS APP UPDATE AT DIFFERENT SPEEDS, and this number is how
 * the fast half finds out. The web app arrives on every open — the shell points
 * at the live address — and the Kotlin arrives only when he rebuilds and
 * reinstalls the APK. Session 119's account screen was asking a session-113
 * plugin for readings it did not have: every row read `off` whatever the
 * switches said, and pressing `Turn on` called a method that did not exist and
 * failed without a sound. Both symptoms, one cause, and nothing on screen could
 * say so. Now the plugin states its build, the bridge states the one it was
 * written against, and the account screen draws the difference as the loud
 * sentence it is. An old plugin with no `version()` at all reads as build 1.
 */
export const ALARM_SHELL_EXPECTED = 2;

export async function alarmShellVersion() {
  const Alarm = plugin();
  if (!Alarm) return 0;
  try {
    const { version } = await Alarm.version();
    return version ?? 1;
  } catch (e) {
    return 1;
  }
}

export async function alarmPermissionStatus() {
  const Alarm = plugin();
  if (!Alarm) return { needed: false };
  const p = await Alarm.permissions();
  // A key the plugin did not answer stays `undefined` — the screen reads that
  // as `unknown`, which is true, rather than `off`, which was a guess dressed
  // as a reading. Only a stated `false` counts as missing.
  return { ...p, needed: PERMISSIONS.some((x) => p[x.key] === false) };
}

/**
 * One permission, by key. The account screen asks for them one at a time.
 * Returns false when the plugin in this APK predates the method, so the screen
 * can say the true thing instead of failing silently.
 */
export async function requestAlarmPermission(key) {
  const Alarm = plugin();
  const which = PERMISSIONS.find((x) => x.key === key);
  if (!Alarm || !which) return false;
  if (typeof Alarm[which.request] !== "function") return false;
  try { await Alarm[which.request](); return true; }
  catch (e) { return false; }
}

/**
 * Everything still missing, in order, one screen after another. Android shows
 * them one at a time and each has to be dismissed before the next appears, which
 * is why the account screen offers the single-permission button as well: four
 * system screens in a row is a lot to walk through to fix one switch.
 */
export async function requestAlarmPermissions() {
  const Alarm = plugin();
  if (!Alarm) return;
  const p = await Alarm.permissions();
  for (const x of PERMISSIONS) {
    if (p[x.key] === false && typeof Alarm[x.request] === "function") await Alarm[x.request]();
  }
}
