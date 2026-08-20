// Cascade Part A — screen 4, the alarms.
//
// His session-125 ask, near verbatim: "need a tab or separate screen for
// viewing all alarms, have a button after Done for that", with cancel and
// delete for repeating and non-repeating tasks, and a way to shift an alarm or
// its due date from here.
//
// A SCREEN AND NOT A FOURTH TAB. The three tabs answer "when is this owed" and
// share one row shape, one toggle and one search. A row here answers "when will
// this ring", which is a different question about a smaller set: the toggle
// would have nothing to divide and the sentence under the title would be about
// a ring rather than a deadline. So the button sits after `Done` in the tab row
// and opens a screen, the same way the account does.
//
// IT SHOWS EXACTLY WHAT THE SHELL WILL ARM, and that is the point of it. The
// set is `canAlarm() && alarm_type !== "none"` — the same filter
// `desiredAlarms()` uses — and the instant is `ringAt()`, the same one that
// travels in the payload. A screen that listed anything else would be a second
// opinion about what is going to happen, which is worse than no screen.
//
// FIVE CONTROLS, and each one is a thing the row screen cannot do:
//   Alarm off      — `alarm_type = "none"`. On a repeat this ends the ring for
//                    the SERIES, because `spawn()` inherits `alarm_type` and
//                    every later occurrence would arm again. Said on the row.
//   Stop repeat    — `recurrence = null`, drawn only on a repeating task. The
//                    alarm and the date are left alone: this occurrence still
//                    rings, and no next one is made when it is closed.
//   Delete         — the task, with undo, the same as the bin on a row. On a
//                    repeat this ends the series too, because a spawn needs a
//                    closed occurrence to count from and there is none left.
//   Lead           — a slider, 0 to 60, moving the RING and not the date. It is
//                    the same control as the one beside the Alarm toggle on the
//                    capture screen and writes the same field.
//   Move it to     — the push ladder, `readPushOptions()`, moving the DATE.
//                    The distinction is the one the lock screen already makes:
//                    a snooze moves the telling, a push moves the task.
//
// A PENDING SNOOZE IS DRAWN AND CAN BE TAKEN BACK. It is the one piece of
// alarm state a person sets without seeing it — pressed at 6am on a lock
// screen — and until this screen there was nowhere to read it or undo it.
//
// WHAT IT DOES NOT DO, on purpose: it never moves a date on its own. A repeat
// whose ring has already gone says so and stays where it is (see the `gone`
// sentence below), because inventing a date nobody typed is the thing this
// project refuses everywhere else.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { tasks, undo, UNDO_ID } = await import(`./store.select.js${v}`);
const { canAlarm, ringAt, alarmAt, alarmCleared } = await import(`./alarm.js${v}`);
const { readPushOptions, pushed } = await import(`./push.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);
const { tapGuard } = await import(`./mvp.tap.js${v}`);

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MO = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const nth = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

/** Epoch ms from a stored local instant, offset included. The bridge reads it
 * the same way; `alarm.js` compares wall clocks. One reading per file was how
 * `repeatSentence` and `ringSentence` came to disagree, so this one is stated. */
const ms = (iso) => {
  const o = iso.slice(-6);
  const sign = o[0] === "-" ? -1 : 1;
  const mins = sign * (Number(o.slice(1, 3)) * 60 + Number(o.slice(4, 6)));
  return Date.parse(iso.slice(0, 19) + "Z") - mins * 60000;
};

const clock = (d) => {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return h + (m ? ":" + String(m).padStart(2, "0") : "") + (d.getHours() < 12 ? "am" : "pm");
};

/** `4:45pm today`, `on Monday`, `on 20th August`. The capture screen's wording. */
function whenWords(at) {
  const d = new Date(at);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const days = Math.floor((at - t0.getTime()) / 86400000);
  const when = days === 0 ? "today"
    : days === 1 ? "tomorrow"
    : days === -1 ? "yesterday"
    : days > 1 && days < 7 ? `on ${WD[d.getDay()]}`
    : `on ${nth(d.getDate())} ${MO[d.getMonth()]}`;
  return `${clock(d)} ${when}`;
}

function repeatWords(task) {
  const r = task.recurrence;
  if (!r || !r.unit || !task.due_at) return "";
  const n = r.every ?? 1;
  const base = n === 1 ? `every ${r.unit}` : `every ${n} ${r.unit}s`;
  const d = new Date(ms(task.due_at));
  if (r.unit === "week") return `${base} on ${WD[d.getDay()]}`;
  if (r.unit === "month") return `${base} on the ${nth(d.getDate())}`;
  if (r.unit === "year") return `${base} on ${d.getDate()} ${MO[d.getMonth()]}`;
  return base;
}

export function mountAlarms(root, { onBack, openEdit } = {}) {
  let all = [];

  async function reload() {
    all = await tasks.all();
    draw();
  }

  async function remember(action, task) {
    await undo.remove(UNDO_ID);
    await undo.add({ id: UNDO_ID, action, task_id: task?.id ?? null, prior_state: task ?? null, created_at: nowLocal() });
  }

  async function write(task, patch) {
    await remember("edit", task);
    await tasks.update(task.id, { ...task, ...patch, updated_at: nowLocal() });
    await reload();
  }

  function rowFor(task, now) {
    const row = el("div", "alarm-item");
    const ring = ringAt(task, partAConfig, now);
    const derived = alarmAt(task, partAConfig);
    const ringMs = ring ? ms(ring) : 0;
    const snoozed = Boolean(task.alarm_snoozed_until && ms(task.alarm_snoozed_until) > Date.now());
    const gone = ringMs && ringMs <= Date.now();

    const title = button("alarm-title", task.title, () => openEdit && openEdit(task.id));
    row.appendChild(title);

    const said = el("div", "alarm-said",
      (snoozed ? "snoozed until " : gone ? "was due to ring " : "rings ") + whenWords(ringMs));
    row.appendChild(said);

    const rep = repeatWords(task);
    const notes = [];
    if (rep) notes.push(rep);
    if (task.reminder_fatigue) notes.push(`${task.reminder_fatigue} unanswered`);
    // AN ALARM IN THE PAST WILL NOT RING, and nothing else in the app said so.
    // `syncAlarms()` skips an instant that has already gone, so a task whose
    // ring was slept through is silent until its date moves. The screen states
    // it rather than the app quietly moving a date nobody typed.
    if (gone && !snoozed) notes.push("will not ring again until the date moves");
    if (notes.length) row.appendChild(el("div", "alarm-note", notes.join(" \u00b7 ")));

    // ------------------------------------------------------------ shift the ring
    const leadWrap = el("div", "lead-wrap");
    const lead = task.alarm_lead_min ?? partAConfig.alarm_lead_by_type?.[task.commitment_type]
      ?? partAConfig.alarm_defaults.lead_min;
    const slide = el("input", "lead");
    slide.type = "range";
    slide.min = "0";
    slide.max = "60";
    slide.step = "5";
    slide.value = String(Math.min(60, lead));
    slide.setAttribute("aria-label", `Lead for ${task.title}`);
    const read = el("span", "lead-read", lead ? `${lead} min before` : "at the time");
    slide.addEventListener("input", () => {
      const n = Number(slide.value) || 0;
      read.textContent = n ? `${n} min before` : "at the time";
      if (derived) {
        const at = ms(task.due_at) - n * 60000;
        said.textContent = (snoozed ? "snoozed until " : "rings ") + whenWords(snoozed ? ringMs : at);
      }
    });
    // The write lands when the thumb is let go. A store write per pixel of
    // travel is sixty writes and sixty sync round trips for one decision.
    slide.addEventListener("change", () => write(task, { alarm_lead_min: Number(slide.value) || 0 }));
    leadWrap.append(slide, read);
    row.appendChild(leadWrap);

    // ---------------------------------------------------------------- the acts
    const acts = el("div", "alarm-acts");
    acts.appendChild(button("act", "Alarm off", () =>
      write(task, alarmCleared({ ...task, alarm_type: "none", alarm_lead_min: null }))));
    if (snoozed) {
      acts.appendChild(button("act", "Clear snooze", () =>
        write(task, { alarm_snoozed_until: null })));
    }
    if (task.recurrence) {
      acts.appendChild(button("act", "Stop repeat", () => write(task, { recurrence: null })));
    }
    acts.appendChild(button("act danger", "Delete", async () => {
      await remember("delete", task);
      await tasks.remove(task.id);
      await reload();
    }));
    row.appendChild(acts);

    // ------------------------------------------------------------- move the date
    const options = readPushOptions(task, all, partAConfig, now);
    if (options.length) {
      row.appendChild(el("div", "alarm-label", "Move it to"));
      const rungs = el("div", "nudges alarm-nudges");
      tapGuard(rungs);
      for (const o of options) {
        const b = el("button", "nudge", o.push_label);
        b.type = "button";
        b.addEventListener("click", () => write(task, pushed(task, o.push_to, nowLocal())));
        rungs.appendChild(b);
      }
      row.appendChild(rungs);
    }
    return row;
  }

  function draw() {
    root.innerHTML = "";
    const now = nowLocal();

    const bar = el("div", "bar");
    bar.appendChild(button("act", "\u2039 Back", () => onBack && onBack()));
    root.appendChild(bar);

    const head = el("div", "head-block");
    const left = el("div", "");
    left.append(el("div", "kicker", "ALARMS"), el("h1", "head-title", "Every alarm"));
    head.appendChild(left);
    root.appendChild(head);

    // The same filter the bridge arms against, in the order they will ring.
    const armed = all
      .filter((t) => canAlarm(t) && t.alarm_type !== "none")
      .map((t) => ({ task: t, at: ms(ringAt(t, partAConfig, now)) }))
      .sort((a, b) => a.at - b.at);

    if (!armed.length) {
      // An empty list screen shows nothing, and this one is the exception it
      // has to be: `Alarms` is a button a person pressed on purpose, and a
      // blank answer to a press reads as a broken screen rather than an empty
      // one. It says what makes an alarm and stops.
      root.appendChild(el("div", "said",
        "No alarms. An alarm needs a task with an exact time, and the toggle sits under the box while it has one."));
      return;
    }

    const list = el("div", "alarm-list");
    for (const { task } of armed) list.appendChild(rowFor(task, now));
    root.appendChild(list);
  }

  const onStore = () => { reload(); };
  window.addEventListener("cascade:store-changed", onStore);
  reload();

  return {
    unmount() { window.removeEventListener("cascade:store-changed", onStore); },
  };
}
