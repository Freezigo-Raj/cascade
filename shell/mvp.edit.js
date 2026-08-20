// Cascade Part A — screen 2, capture and edit.
//
// One box, the tap buttons with it, the matching tasks below. The same screen
// for both jobs: reached empty by `+`, or with a task loaded by tapping a row.
// Everything else on it is a way of correcting what the typing already said.
//
// A date arrives one way, through the words in the box. Every chip types words
// and nothing here sets a date field, so the box is the only thing that has to
// be right. The arithmetic behind that is in `mvp.words.js` and the advanced
// panel is in `mvp.panel.js`; both left this file to keep it under the cap.
//
// The box is built once and never redrawn. Everything around it repaints on
// every keystroke; replacing a focused input mid-word loses the caret on a
// laptop and dismisses the keyboard on a phone, and this is a screen whose
// whole job is being typed into.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { resolve } = await import(`./resolve.js${v}`);
const { tasks, undo, UNDO_ID } = await import(`./store.select.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { ask } = await import(`./mvp.dialog.js${v}`);
const { drawPanel } = await import(`./mvp.panel.js${v}`);
const { removeSpans } = await import(`./mvp.words.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);
const { makeDates, storedWhen, when } = await import(`./mvp.chips.js${v}`);
const { alarmCleared } = await import(`./alarm.js${v}`);

export function mountEdit(root, { taskId = null, onBack, inPanel = false } = {}) {
  let line = "";
  let chipSpan = null;      // where the picked words sit in the composed line, or null
  let pickedDate = "";      // words a date chip or the date picker handed over
  let pickedTime = "";      // words a time chip or the time picker handed over
  let boundId = null;       // the task being edited, or null
  let typeTap = null;
  let sigTap = null;
  let advanced = false;
  let dropDate = false;     // the tick was tapped on a task whose words hold no date
  let repeat = null;        // { every, unit } | null
  let alarmType = "none";
  let leadMin = null;
  let durTap = null;        // minutes the person chose, or null for the verb's default
  let firmTap = null;       // "hard" | "normal" | "soft" | null for what the words said
  let notesText = "";
  let newId = crypto.randomUUID();
  let all = [];
  let toast = null;
  let toastTimer = 0;

  // ------------------------------------------------------------- the skeleton

  root.innerHTML = "";
  const head = el("div", "head");
  const box = el("textarea", "box");
  box.rows = 2;
  box.placeholder = "type the thought";
  const dateRow = el("div", "dates-block");
  const doRow = el("div", "dorow");
  const typeRow = el("div", "taps types");
  const alarmRow = el("div", "alarm-row");
  const panel = el("div", "panel");
  const matches = el("div", "matches");
  // The order is the order of the decisions: the words, then the date they
  // carry, then what kind of thing it is, then how much it matters — and only
  // then the press. Add sat above the type chips and asked to be pressed before
  // the last two answers were given.
  // The alarm sits directly under the box (session 124, his arrow): the ring
  // is a property of the line just typed, so it reads before the pickers do.
  root.append(head, box, alarmRow, dateRow, typeRow, panel, doRow, matches);

  // The chip row is built once. It holds two native pickers, and a picker that is
  // rebuilt while it is open closes without returning anything: opening a
  // calendar takes several clicks, and every keystroke and every sync used to
  // destroy the input underneath it. Only the tick chip changes, and it has its
  // own slot inside the row.
  // Wrapped rather than passed by name: `typeWords` and `typeTime` are declared
  // below this line, and handing them over directly reads a `const` before it
  // exists. The wrappers resolve when the chip is pressed, which is after.
  const dates = makeDates(dateRow, partAConfig, {
    pickWords: (words) => pickWords(words),
    pickTime: (words) => pickTime(words),
    clearDate: () => clearDate(read()),
  });

  // ------------------------------------------------------------- the engine

  /** The line as the engine sees it, or null when there is no capture in it. */
  function read() {
    try {
      return resolve({
        typed_line: line,
        chip_spans: chipSpan ? [{ start: chipSpan.start, end: chipSpan.end }] : [],
        type_chip_tap: typeTap,
        significance_tap: sigTap,
        duration_tap: durTap,
        firmness_tap: firmTap,
        notes_text: notesText,
        bound_task_id: boundId,
        row_action: null,
        now: nowLocal(),
        new_id: newId,
        config: partAConfig,
        existing_tasks: all,
      });
    } catch (e) {
      if (e && e.refused) return null;
      throw e;
    }
  }

  // --------------------------------------------------------------- the words
  //
  // A date still arrives one way — through words in the one line the engine
  // reads — but since session 121 the PICKED words do not appear in the box.
  // The box holds what the person typed; the picked words are composed onto
  // the end of it before every read, under a `chip_span` so the engine knows
  // they were tapped; and the tick chip is where the reading shows. His words:
  // "selecting a time should not insert any text". The engine sees the same
  // line it always did.
  //
  // A date pick replaces the picked date, a time pick replaces the picked
  // time, and the two coexist: `Tonight` then `9pm` reads as tonight at 9pm.
  // Typing does not clear a pick — the tick chip is the one way back out,
  // which is also what it is for a stored date.

  function compose() {
    const tail = [pickedDate, pickedTime].filter(Boolean).join(" ");
    const head = box.value.replace(/\s+$/, "");
    // A pick with an empty box joins NOTHING: date words alone would become
    // the title ("Tomorrow morning" as a task), which is a capture of no
    // commitment. The pick waits in state, the tick chip previews it, and it
    // joins the line the moment there are words to date.
    if (!tail || !head.trim()) {
      line = box.value;
      chipSpan = null;
      return;
    }
    line = `${head} ${tail}`;
    chipSpan = { start: line.length - tail.length, end: line.length };
  }

  function pickWords(words) {
    pickedDate = words;
    compose();
    paint();
    box.focus();
  }

  // The shapes a typed time usually takes. The engine reads more forms than
  // this; a form the regex misses simply keeps typed-wins, which is the safe
  // side of the rule.
  const TIME_TOKEN = /\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?\b|\b(?:1[0-2]|0?[1-9])\s*(?:am|pm)\b|\bnoon\b|\bmidnight\b/i;

  function pickTime(words) {
    // WHICHEVER CAME LAST WINS (session 124, his rule, near verbatim: "it
    // should be whatever is typed or click last"). A typed time used to
    // outrank every later pick because it sat earlier in the composed line;
    // now a pick REPLACES the typed time token in the line — a logged
    // amendment to session 121's "picks put no words in the box": replacing
    // a time the person is superseding is not inserting words they did not
    // choose.
    if (TIME_TOKEN.test(box.value)) {
      box.value = box.value.replace(TIME_TOKEN, words);
      pickedTime = "";
    } else {
      pickedTime = words;
    }
    compose();
    paint();
    box.focus();
  }

  /** For the one remaining span edit: taking TYPED date words out of the box. */
  function apply(result) {
    line = result.line;
    chipSpan = result.span;
    box.value = line;
    paint();
    box.focus();
  }

  /**
   * The chip shows the date; tapping it takes those words back out of the box.
   *
   * On a task being edited there are no words to take out, and the chip is
   * still what clears the date. So the press drops the stored date instead,
   * and the save writes a record with none — which is the same task in Ideas.
   */
  function clearDate(out) {
    // Picked words are not in the box, so there is nothing to cut out of it.
    if (pickedDate || pickedTime) {
      pickedDate = "";
      pickedTime = "";
      compose();
      paint();
      return;
    }
    const spans = out?.task.date_spans ?? [];
    if (spans.length) return apply(removeSpans(line, spans));
    if (boundId) { dropDate = true; paint(); }
  }

  // -------------------------------------------------------------- loading one

  function load(id) {
    const task = all.find((t) => t.id === id);
    if (!task) return;
    boundId = task.id;
    // The title, never `raw_text`. The typed line is provenance and is gone from
    // every screen the moment the task exists.
    line = task.title;
    box.value = line;
    chipSpan = null;
    pickedDate = "";
    pickedTime = "";
    // A tapped type and a moved significance are the person's, and re-reading
    // the title finds neither: the words that implied them were consumed on
    // capture. Loading them back is what stops a save quietly resetting both.
    dropDate = false;
    typeTap = task.type_source === "user" ? task.commitment_type : null;
    sigTap = task.significance;
    repeat = task.recurrence ?? null;
    alarmType = task.alarm_type ?? "none";
    leadMin = task.alarm_lead_min ?? null;
    // The same reason the type and the significance are loaded back: a title
    // carries no evidence of either, so re-deriving would reset both on save.
    // A duration is seeded only when the person chose it. Seeding the verb's
    // own default would turn every edit into a selection and stop the default
    // ever moving again.
    durTap = task.duration_source === "selected" ? task.est_duration_min : null;
    firmTap = task.date_firmness ?? null;
    notesText = task.notes ?? "";
    advanced = Boolean(repeat) || alarmType !== "none" || durTap !== null || Boolean(notesText);
    paint();
  }

  function unbind() {
    boundId = null;
    line = "";
    box.value = "";
    chipSpan = null;
    pickedDate = "";
    pickedTime = "";
    typeTap = null;
    sigTap = null;
    repeat = null;
    alarmType = "none";
    leadMin = null;
    durTap = null;
    firmTap = null;
    notesText = "";
    advanced = false;
    dropDate = false;
    newId = crypto.randomUUID();
    paint();
  }

  function say(text) {
    clearTimeout(toastTimer);
    toast = text;
    toastTimer = setTimeout(() => { toast = null; paint(); }, (partAConfig.undo_ui_timeout_sec ?? 8) * 1000);
    paint();
  }

  const advancedFields = () => ({
    recurrence: repeat,
    alarm_type: alarmType,
    alarm_lead_min: alarmType === "none" ? null : leadMin,
  });

  // ----------------------------------------------------------------- the press

  async function commit() {
    const out = read();
    if (!out) return;

    if (boundId) {
      const old = all.find((t) => t.id === boundId);
      if (!old) return;
      if (!(await ask([out.capture.clash_dialog, out.capture.deadline_dialog], "Save anyway"))) return;
      // A title carries no date words, so re-reading one finds none. Clearing
      // the date on that evidence would destroy it on every edit of every task.
      // Dropped on purpose by the tick chip, so the words' silence is not the
      // only evidence and the date is allowed to go.
      const keepDate = out.task.date_precision === "none" && !dropDate
        ? { due_at: old.due_at, earliest_start: old.earliest_start, has_time: old.has_time,
            date_phrase: old.date_phrase, date_spans: old.date_spans, date_marker: old.date_marker,
            date_precision: old.date_precision, date_anchor: old.date_anchor,
            // The tap wins where there is one. Carrying the old firmness back
            // over it would make the control read as broken on exactly the
            // screen it lives on: every edit of a stored task finds no date in
            // the title, so every edit would land here.
            date_firmness: firmTap || old.date_firmness,
            date_hedge: old.date_hedge }
        : {};
      await undo.remove(UNDO_ID);
      await undo.add({ id: UNDO_ID, action: "edit", task_id: old.id, prior_state: old, created_at: nowLocal() });
      // A MOVED DATE ENDS WHAT THE OLD ONE LEFT (session 125). `alarm.js` has
      // said since session 111 that a push, a completion and a date edit all
      // clear the snooze and the unanswered marker; the first two did and this
      // one did not, so a saved edit left `alarm_snoozed_until` pointing at the
      // old ring — and `ringAt()` prefers a snooze that is still ahead, so the
      // alarm rang at the time the task no longer had.
      //
      // `first_due_at` goes with it: it is where THIS occurrence started, a
      // push is a temporary move away from that, and a restated date is a new
      // start. Leaving it would let a push made last week keep anchoring a
      // repeat whose date has since been typed again.
      const moved = (out.task.due_at ?? null) !== (old.due_at ?? null) && !keepDate.due_at;
      await tasks.update(boundId, {
        ...out.task, ...keepDate, ...advancedFields(),
        ...(moved ? { alarm_snoozed_until: null, alarm_unanswered_at: null } : {}),
        push_count: old.push_count ?? 0,
        first_due_at: moved ? null : (old.first_due_at ?? null),
        spawned_from: old.spawned_from ?? null,
        id: old.id, created_at: old.created_at, pinned: old.pinned,
        task_state: old.task_state, closed_at: old.closed_at, archived: old.archived,
        updated_at: nowLocal(),
      });
      const title = out.task.title;
      unbind();
      await reload();
      say(`Saved "${title}"`);
      // AN EDIT IS FINISHED WHEN IT IS SAVED. On the narrow layout the editor is
      // a screen you navigated to, and staying on it after a save leaves you
      // looking at an empty capture box with the toast about a task that is no
      // longer in front of you. In the wide layout there is nowhere to go: the
      // list is already beside the panel, which is why `onBack` is null there.
      if (onBack) onBack();
      return;
    }

    // Both warnings are asked once. The duplicate fires on Add and nowhere
    // else; the clash fires here, on a save and on a push.
    if (!(await ask([out.capture.duplicate_dialog, out.capture.clash_dialog,
                     out.capture.deadline_dialog], "Add anyway"))) return;

    const task = { ...out.task, ...advancedFields() };
    await tasks.add(task);
    await undo.remove(UNDO_ID);
    await undo.add({ id: UNDO_ID, action: "create", task_id: task.id, prior_state: null, created_at: nowLocal() });
    const said = when(out);
    unbind();
    await reload();
    say(`Added "${task.title}"` + (said ? ` \u00b7 ${said}` : ""));
    // ADDING IS FINISHED WHEN IT IS ADDED (session 125, his words: "once a
    // task is added, go back to home screen"). A save has returned since
    // session 112 and an add did not, so the one press that happens twenty
    // times a day left you looking at an empty box with a toast about a task
    // you could no longer see. In the wide layout `onBack` is null and the
    // list is already beside the box, so nothing moves there.
    if (onBack) onBack(`Added "${task.title}"` + (said ? ` \u00b7 ${said}` : ""));
  }

  async function undoLast() {
    const entry = (await undo.all())[0];
    if (!entry) return;
    if (entry.action === "create") await tasks.remove(entry.task_id);
    else if (entry.prior_state) {
      // A fresh stamp: an undo is a change made now, and newest wins.
      const back = { ...entry.prior_state, updated_at: nowLocal() };
      if (all.some((t) => t.id === entry.task_id)) await tasks.update(entry.task_id, back);
      else await tasks.add(back);
    }
    await undo.remove(UNDO_ID);
    clearTimeout(toastTimer);
    toast = null;
    await reload();
  }

  // ----------------------------------------------------------------- drawing

  function drawHead(out) {
    head.innerHTML = "";
    // No Back button (session 121, his call). The Android gesture asks
    // `__cascadeBack()`, the browser has its own Back, and a save returns on
    // its own — three ways out already, and the word was renting the top of
    // the screen. The head now exists only while a task is bound, so an empty
    // capture starts at the box.
    head.style.display = out?.capture.bound_task_chip ? "" : "none";
    // Only while editing. The ✕ leaves without saving, which is the one way out
    // that changes nothing.
    if (out?.capture.bound_task_chip) {
      const chip = el("span", "bound");
      chip.appendChild(el("span", "", all.find((t) => t.id === boundId)?.title ?? ""));
      chip.appendChild(button("x", "\u2715", unbind));
      head.appendChild(chip);
    }
  }

  function drawDo(out) {
    doRow.innerHTML = "";
    const sig = el("div", "sigs");
    for (const b of partAConfig.significance_buttons) {
      const on = out ? out.task.significance === b.value : b.value === 30;
      const hit = button("sig" + (on ? " on" : ""), b.label, () => { sigTap = b.value; paint(); });
      hit.setAttribute("aria-pressed", String(on));
      sig.appendChild(hit);
    }
    doRow.appendChild(sig);
    const go = button("go", out ? out.capture.add_button : "Add", commit);
    go.disabled = !out;
    doRow.appendChild(go);
  }

  /** `2:45pm` from epoch ms, the phone's own clock. */
  function fmtClock(t) {
    const d = new Date(t);
    let h = d.getHours(); const m = d.getMinutes();
    const half = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (m ? ":" + String(m).padStart(2, "0") : "") + half;
  }

  // `rings 4:45pm today` / `on Monday` / `on 20th August` (session 124, his
  // wording, near verbatim): the clock alone answered when only if you already
  // knew the day. Weekdays carry the next six days; dates carry the rest. A
  // repeating task says so, because a ring that will come back is a different
  // promise from one that will not.
  function ringSentence(ringMs, rep) {
    const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MO = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const nth = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
    const d = new Date(ringMs);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const days = Math.floor((ringMs - t0.getTime()) / 86400000);
    const when = days === 0 ? " today"
               : days === 1 ? " tomorrow"
               : days > 1 && days < 7 ? ` on ${WD[d.getDay()]}`
               : ` on ${nth(d.getDate())} ${MO[d.getMonth()]}`;
    return "rings " + fmtClock(ringMs) + when + (rep ? " \u00b7 repeats" : "");
  }

  function drawTypes(out) {
    typeRow.innerHTML = "";
    panel.innerHTML = "";
    // A type control on an empty box offers to change the type of nothing.
    if (!out) return;
    const chosen = out.task.commitment_type;
    // A DROPDOWN OF ALL FOURTEEN (session 122, his call, reversing his earlier
    // one — logged). Three chips answered "which of these three"; they could
    // not answer "what types exist", which is what he asked the screen. The
    // native select shows the engine's guess as its value, scrolls on its own,
    // and is the control the design always drew: `⟨action ▾⟩`.
    const sel = el("select", "type-select");
    sel.setAttribute("aria-label", "Type");
    for (const t of partAConfig.commitment_types) {
      const opt = el("option", "", t.id);
      opt.value = t.id;
      if (t.id === chosen) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", () => { typeTap = sel.value; paint(); });
    typeRow.appendChild(sel);
    // THE ALARM LIVES ON THE CAPTURE SCREEN when the line carries an exact
    // time (session 123, his call) — setting a ring should not require
    // opening the panel. The row states when it will ring, due minus lead,
    // because a toggle that hides the consequence is a guess. No time, no
    // row: the panel's four words cover that case.
    alarmRow.innerHTML = "";
    // AN EDIT DOES NOT LOSE THE ALARM (session 126, his slide: "removes alarm
    // details when editing a task even when it exists").
    //
    // The row read `out.task`, which is the engine's answer to THE LINE IN THE
    // BOX — and the box holds `title`, which has had its date words removed
    // since the day titles were built. So opening a task due at 4:25 to change
    // a word showed no alarm, no ring time and four words in the panel saying
    // it needed an exact time, for a task that had one.
    //
    // The date the screen must speak about is the one SAVE WILL KEEP: the
    // typed line's date when it has one, and otherwise the stored task's, which
    // is exactly what `keepDate` writes back. One rule, read in both places.
    const held = boundId && !dropDate ? all.find((t) => t.id === boundId) : null;
    const dueAt = out.task.due_at ?? (held?.due_at ?? null);
    const hasTime = out.task.due_at ? Boolean(out.task.has_time) : Boolean(held?.has_time);
    if (hasTime && dueAt) {
      const on = alarmType !== "none";
      const lead = leadMin ?? partAConfig.alarm_defaults.lead_min;
      const ringMs = new Date(dueAt).getTime() - lead * 60000;
      const tog = button("chip alarm-toggle" + (on ? " on" : ""),
        on ? "Alarm on" : "Alarm off",
        () => {
          alarmType = on ? "none" : "on";
          // Turning it on gives it the default lead, which the panel's
          // `setAlarm` used to do before the group left it.
          if (!on && leadMin === null) leadMin = partAConfig.alarm_defaults.lead_min;
          paint();
        });
      tog.setAttribute("aria-pressed", String(on));
      alarmRow.appendChild(tog);
      if (on) alarmRow.appendChild(el("span", "alarm-when", ringSentence(ringMs, repeat)));
      // THE LEAD MOVED OUT OF THE PANEL AND ON TO THIS ROW (session 125, his
      // arrow and his words: "lead time should be changeable besides the alarm
      // button ... a slider with range of 0mins to 60mins, displaying the lead
      // time"). It is the SAME control moved, not a second one: the panel's
      // number input is gone, because two controls for one field is how two
      // controls come to disagree, and this project has paid for that four
      // times.
      //
      // COST, STATED: `alarm_defaults.max_lead_min` is a week and this slider
      // reaches an hour. A stored lead above 60 still rings correctly and the
      // slider shows it pinned at its top, but it cannot be set from here any
      // more. Nothing in the app offered a week's warning before, and every
      // lead in `alarm_lead_by_type` is fifteen minutes.
      if (on) {
        const wrap = el("div", "lead-wrap");
        const slide = el("input", "lead");
        slide.type = "range";
        slide.min = "0";
        slide.max = "60";
        slide.step = "5";
        slide.value = String(Math.min(60, lead));
        slide.setAttribute("aria-label", "Lead, minutes before");
        const read = el("span", "lead-read", lead ? `${lead} min before` : "at the time");
        // `input`, not `change`: the sentence beside the toggle is the whole
        // reason the number is visible, and a reading that arrives after the
        // thumb is lifted is a reading nobody watched. A range control holds
        // no caret, so repainting it mid-drag costs nothing — the defect that
        // put the panel's three number fields on `change` cannot happen here.
        slide.addEventListener("input", () => {
          leadMin = Number(slide.value) || 0;
          read.textContent = leadMin ? `${leadMin} min before` : "at the time";
          alarmRow.querySelector(".alarm-when").textContent =
            ringSentence(new Date(dueAt).getTime() - leadMin * 60000, repeat);
        });
        wrap.append(slide, read);
        alarmRow.appendChild(wrap);
      }
    } else {
      // The panel's four words moved here (session 126, his slide: "remove
      // alarm section from here, it is already there at the top"). Everything
      // about the alarm is on this row now — the toggle, the ring time, the
      // lead, and the one reason there is no toggle to press.
      alarmRow.appendChild(el("span", "alarm-when quiet", "An alarm needs an exact time."));
    }
    const more = button("chip more" + (advanced ? " on" : ""), "\u22ef", () => { advanced = !advanced; paint(); });
    more.setAttribute("aria-expanded", String(advanced));
    more.title = "Advanced";
    typeRow.appendChild(more);
    if (advanced) {
      drawPanel(panel, partAConfig, {
        repeat,
        // Both anchor on the date the save will keep, for the same reason the
        // alarm row above does.
        dueAt, hasTime,
        durationMin: durTap ?? out.task.est_duration_min,
        durationTapped: durTap !== null,
        firmness: firmTap,
        notes: notesText,
      }, {
        setRepeat: (r) => { repeat = r; paint(); },
        setDuration: (n) => { durTap = n; paint(); },
        setFirmness: (f) => { firmTap = f; paint(); },
        // No repaint: the same reason the box itself is built once. Replacing a
        // focused textarea mid-word loses the caret and dismisses the keyboard.
        setNotes: (t) => { notesText = t; },
      });
    }
  }

  function drawMatches(out) {
    matches.innerHTML = "";
    // Nothing matching draws nothing. No panel, no headers.
    for (const g of out?.list.results ?? []) {
      for (const r of g.rows) {
        // The task being edited is an exact match for its own title, and
        // offering it back as something to open is a row that goes nowhere.
        if (r.task_id === boundId) continue;
        const hit = button("match", "", () => load(r.task_id));
        hit.appendChild(el("span", "match-title", r.title));
        hit.appendChild(el("span", "match-said", r.result_row));
        matches.appendChild(hit);
      }
    }
  }

  function drawToast() {
    document.querySelector(".toast")?.remove();
    if (!toast) return;
    const t = el("div", "toast");
    t.appendChild(el("span", "", toast));
    t.appendChild(button("", "Undo", undoLast));
    root.appendChild(t);
  }

  function paint() {
    const out = read();
    drawHead(out);
    // The engine's reading first; failing that, a pick still waiting for words
    // in the box; failing that, the stored date of the task being edited.
    const waiting = !box.value.trim() && (pickedDate || pickedTime)
      ? [pickedDate, pickedTime].filter(Boolean).join(" ").toLowerCase()
      : "";
    dates.update(when(out) || waiting || (dropDate ? "" : storedWhen(out?.list.cards ?? [], boundId)));
    drawDo(out);
    drawTypes(out);
    drawMatches(out);
    drawToast();
  }

  async function reload() {
    all = await tasks.all();
    paint();
  }

  // Everything re-reads on every keystroke: the date, the type, the duration,
  // the matches. The picked words survive typing — they are not in the box, so
  // typing cannot mangle them, and the tick chip is their one way out.
  box.addEventListener("input", () => {
    // Typing a time after picking one takes the pick back: last writer wins
    // in both directions (session 124).
    if (pickedTime && TIME_TOKEN.test(box.value)) pickedTime = "";
    compose();
    paint();
  });

  // Returned for the same reason screen 1's are: a listener that outlives its
  // screen redraws a screen that is no longer on the page. This one is milder —
  // it repaints the screen it belongs to — but it accumulated one per visit, so
  // one sync event meant four repaints on the fourth visit.
  const onStore = () => { reload(); };
  window.addEventListener("cascade:store-changed", onStore);

  reload().then(() => {
    if (taskId) load(taskId);
    box.focus();
  });

  return {
    /** Load a task in place. On a wide screen this panel never unmounts. */
    load(id) {
      if (id) load(id);
      else unbind();
      box.focus();
    },
    unmount() {
      window.removeEventListener("cascade:store-changed", onStore);
      clearTimeout(toastTimer);
    },
  };
}
