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
    await tasks.update({
      ...task,
      task_state: "done",
      closed_at: now,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      updated_at: stamp,
    });
    return;
  }
  if (verb.startsWith("PUSH:")) {
    // The target travels whole, offset included, because a due date is a local
    // instant and rebuilding one from epoch milliseconds would drop the zone.
    const to = verb.slice("PUSH:".length);
    await tasks.update(pushed(task, to, now));
    return;
  }
  if (verb.startsWith("SNOOZE")) {
    const mins = Number(verb.split(":")[1]) || partAConfig.alarm_defaults.auto_snooze_min;
    await tasks.update(snoozed(task, mins, now));
    return;
  }
  if (verb === "UNANSWERED") {
    await tasks.update(unanswered(task, now));
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
 * Two Android permissions, and neither can be granted from inside the app: both
 * open a system screen. Asked for on the first alarm a person sets rather than
 * at install, because a permission prompt with no reason attached gets refused.
 */
export async function alarmPermissionStatus() {
  const Alarm = plugin();
  if (!Alarm) return { needed: false };
  const p = await Alarm.permissions();
  return { ...p, needed: !(p.exactAlarm && p.batteryExempt) };
}

export async function requestAlarmPermissions() {
  const Alarm = plugin();
  if (!Alarm) return;
  await Alarm.requestExactAlarm();
  await Alarm.requestBatteryExemption();
}
