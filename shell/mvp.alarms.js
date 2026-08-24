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
// FOUR CONTROLS, and each one is a thing the row screen cannot do:
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
// The push ladder was here and LEFT in session 126, his call: it was the only
// control on this screen that moved the DATE rather than the ring, and the
// title already opens the editor. A date is still moved without opening
// anything from a list row and from the lock screen, which is where that
// belongs.
//
// A PENDING SNOOZE IS DRAWN AND CAN BE TAKEN BACK. It is the one piece of
// alarm state a person sets without seeing it — pressed at 6am on a lock
// screen — and until this screen there was nowhere to read it or undo it.
//
// WHAT IT DOES NOT DO, on purpose: it never moves a date. A repeat's RING
// follows its rule (`nextRing`, session 126) so the screen can always answer
// "when next"; the record's own date is left exactly where the person put it.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { tasks, undo, UNDO_ID } = await import(`./store.select.js${v}`);
const { canAlarm, ringAt, alarmAt, nextRing, alarmCleared } = await import(`./alarm.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { nextDue } = await import(`./repeat.js${v}`);
const bridge = await import(`./alarm.bridge.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);

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
  // WHICH LIST IS SHOWING. `alarms` is everything the shell will ring; `repeats`
  // is everything that recurs, alarm or not (session 129, his ask: "need all the
  // tasks with repeat as a tab inside alarm tab, otherwise removing them becomes
  // hard"). They overlap and neither contains the other: a repeat with no alarm
  // is invisible on the first, and a one-off alarm is invisible on the second.
  let view = "alarms";
  // What the phone's alarm shell says it is actually holding. The web half can
  // only say what it INTENDED to arm; when an alarm does not ring, the whole
  // question is which of those two is wrong, and until now nothing on any
  // screen could answer it.
  let armedIds = new Set();

  async function reload() {
    all = await tasks.all();
    try {
      const live = await bridge.armedAlarms();
      armedIds = new Set(live.map((a) => a.id));
    } catch (e) {
      // A browser has no alarm shell, and that is not an error. The marker is
      // simply not drawn, rather than every row claiming to be unarmed.
      armedIds = null;
    }
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
    // A ring still in the past means there is no future one at all: a repeat
    // steps its ring forward through its own rule now (session 126), so only a
    // one-off whose time has gone lands here.
    const gone = ringMs && ringMs <= Date.now();

    const title = button("alarm-title", task.title, () => openEdit && openEdit(task.id));
    row.appendChild(title);

    // PLAIN WORDS (session 126, his slide: "'will not ring again until the date
    // moves' is hard to understand — keep it simple"). Three shapes and no
    // clauses: it rings then, it is snoozed until then, or it has passed and is
    // not going to ring. Everything a sentence used to explain is now either
    // true by itself or not worth saying.
    const said = el("div", "alarm-said",
      snoozed ? `Snoozed until ${whenWords(ringMs)}`
        : gone ? `Missed ${whenWords(ringMs)}. It will not ring again.`
        : `Rings ${whenWords(ringMs)}`);
    row.appendChild(said);

    const rep = repeatWords(task);
    const notes = [];
    if (rep) notes.push(rep);
    if (task.reminder_fatigue) notes.push(`${task.reminder_fatigue} unanswered`);
    // WHAT THE PHONE ACTUALLY HOLDS (session 129, his first line: "alarm is not
    // ringing"). Everything above is what the app INTENDS; this is what the
    // Android shell says it has armed. When the two disagree the answer is a
    // permission, a shell too old, or a defect in the arming pass — and until
    // now nothing on any screen could tell those apart from a silent phone.
    if (armedIds && !armedIds.has(task.id) && !gone) {
      notes.push("NOT armed on this phone");
    }
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
      if (derived && !snoozed && !gone) {
        // The reading follows the thumb, and it follows the SCHEDULE'S ring
        // rather than this occurrence's, which is the number above it.
        const at = ms(nextRing({ ...task, alarm_lead_min: n }, partAConfig, now) ?? derived);
        said.textContent = `Rings ${whenWords(at)}`;
      }
    });
    // The write lands when the thumb is let go. A store write per pixel of
    // travel is sixty writes and sixty sync round trips for one decision.
    slide.addEventListener("change", () => write(task, { alarm_lead_min: Number(slide.value) || 0 }));
    leadWrap.append(slide, read);
    row.appendChild(leadWrap);

    // ---------------------------------------------------------------- the acts
    //
    // They read as buttons (session 126, his slide: "have button like feel for
    // these"). Three words in a row on a card read as a sentence someone forgot
    // to finish; a pill with an edge reads as a thing to press. Delete keeps
    // the warn colour and the others do not, which is the one distinction worth
    // making with colour here.
    const acts = el("div", "alarm-acts");
    acts.appendChild(button("act pill", "Alarm off", () =>
      write(task, alarmCleared({ ...task, alarm_type: "none", alarm_lead_min: null }))));
    if (snoozed) {
      acts.appendChild(button("act pill", "Clear snooze", () =>
        write(task, { alarm_snoozed_until: null })));
    }
    if (task.recurrence) {
      acts.appendChild(button("act pill", "Stop repeat", () => write(task, { recurrence: null })));
    }
    acts.appendChild(button("act pill danger", "Delete", async () => {
      await remember("delete", task);
      await tasks.remove(task.id);
      await reload();
    }));
    row.appendChild(acts);

    // THE PUSH LADDER LEFT THIS SCREEN (session 126, his slide: "remove this
    // 'move it to' section, adds unnecessary complexity right now — they can
    // edit inside the task itself"). It was the only control here that moved
    // the DATE rather than the ring, and every row already opens the editor on
    // a press. The rungs are still on the list rows and on the lock screen,
    // which are the two places a date is moved without opening anything.
    return row;
  }

  function repeatRow(task, now) {
    const row = el("div", "alarm-item");
    row.appendChild(button("alarm-title", task.title, () => openEdit && openEdit(task.id)));
    const due = task.due_at ? whenWords(ms(task.due_at)) : "no date";
    row.appendChild(el("div", "alarm-said", `Due ${due}`));
    const notes = [repeatWords(task) || "repeats"];
    const after = nextDue(task, now);
    // The date the rule gives after this one. A repeat is a promise about the
    // future and this is the whole of it in one line.
    if (after) notes.push(`then ${whenWords(ms(after))}`);
    if (task.alarm_type && task.alarm_type !== "none") notes.push("alarm on");
    row.appendChild(el("div", "alarm-note", notes.join(" \u00b7 ")));

    const acts = el("div", "alarm-acts");
    acts.appendChild(button("act pill", "Stop repeat", () => write(task, { recurrence: null })));
    if (task.alarm_type && task.alarm_type !== "none") {
      acts.appendChild(button("act pill", "Alarm off", () =>
        write(task, alarmCleared({ ...task, alarm_type: "none", alarm_lead_min: null }))));
    }
    acts.appendChild(button("act pill danger", "Delete", async () => {
      await remember("delete", task);
      await tasks.remove(task.id);
      await reload();
    }));
    row.appendChild(acts);
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

    // TWO VIEWS, ONE SCREEN (session 129, his ask). The toggle is the tab row's
    // grammar borrowed, because that is what a person has already learned on
    // screen 1.
    const tabs = el("div", "bar alarm-views");
    for (const name of ["Alarms", "Repeats"]) {
      const key = name.toLowerCase();
      const b = button("tab" + (view === key ? " on" : ""), name, () => { view = key; draw(); });
      b.setAttribute("aria-pressed", String(view === key));
      tabs.appendChild(b);
    }
    root.appendChild(tabs);

    if (view === "repeats") {
      const rows = all
        .filter((t) => t.recurrence && t.recurrence.unit && t.task_state === "ready" && !t.archived)
        .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
      if (!rows.length) {
        root.appendChild(el("div", "said", "Nothing repeats yet. A repeat is set in the panel under the box."));
        return;
      }
      const list = el("div", "alarm-list");
      for (const t of rows) list.appendChild(repeatRow(t, now));
      root.appendChild(list);
      return;
    }

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
