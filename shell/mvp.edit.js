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
const { dateWords, timeWords, typeInto, typeBeside, removeSpans } =
  await import(`./mvp.words.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);

/** The four preset chips type their labels; the two pickers write what was picked. */
const PICKERS = new Set(["Pick date", "Pick time"]);

/** `due this afternoon` is what the engine says; the chip and the toast say the rest. */
const when = (out) => (out?.working.due_phrase_short || "").replace(/^due /, "");

/**
 * The same chip, for a task being edited.
 *
 * A title carries no date words — they left the line when the task was made —
 * so re-reading one finds no date and the chip vanished, which left the edit
 * screen with nothing showing the date and nothing to clear it with. MVP.md
 * says the chip is both. So it reads the stored task instead of the line.
 *
 * The words come off the card rather than out of `due_phrase_short`, because a
 * stored task's short phrase is reachable only through a card. That is why an
 * overdue task reads `overdue` here and not `since Wednesday`: the card is the
 * mobile sentence and collapses it, and this chip inherits the collapse.
 */
function storedWhen(cards, id) {
  const said = cards.find((c) => c.card_id === id)?.card_reason_short ?? "";
  return said.replace(/\.$/, "").replace(/^Due /, "").replace(/^Overdue/, "overdue");
}

export function mountEdit(root, { taskId = null, onBack } = {}) {
  let line = "";
  let chipSpan = null;      // where the last tapped words landed, or null
  let boundId = null;       // the task being edited, or null
  let typeTap = null;
  let sigTap = null;
  let advanced = false;
  let dropDate = false;     // the tick was tapped on a task whose words hold no date
  let repeat = null;        // { every, unit } | null
  let alarmType = "none";
  let leadMin = null;
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
  const dateRow = el("div", "taps");
  const doRow = el("div", "dorow");
  const typeRow = el("div", "taps types");
  const panel = el("div", "panel");
  const matches = el("div", "matches");
  // The order is the order of the decisions: the words, then the date they
  // carry, then what kind of thing it is, then how much it matters — and only
  // then the press. Add sat above the type chips and asked to be pressed before
  // the last two answers were given.
  root.append(head, box, dateRow, typeRow, panel, doRow, matches);

  // ------------------------------------------------------------- the engine

  /** The line as the engine sees it, or null when there is no capture in it. */
  function read() {
    try {
      return resolve({
        typed_line: line,
        chip_spans: chipSpan ? [{ start: chipSpan.start, end: chipSpan.end }] : [],
        type_chip_tap: typeTap,
        significance_tap: sigTap,
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
  // The arithmetic is in `mvp.words.js`; what is here is the part that touches
  // the screen. Every one of these puts words in the box and nothing sets a
  // date field, which is the whole of "a date arrives one way".

  function apply(result) {
    line = result.line;
    chipSpan = result.span;
    box.value = line;
    paint();
    box.focus();
  }

  const typeWords = (words) => apply(typeInto(line, chipSpan, words));
  const typeTime = (words) => apply(typeBeside(line, chipSpan, words));

  /**
   * The chip shows the date; tapping it takes those words back out of the box.
   *
   * On a task being edited there are no words to take out, and the chip is
   * still what clears the date. So the press drops the stored date instead,
   * and the save writes a record with none — which is the same task in Ideas.
   */
  function clearDate(out) {
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
    // A tapped type and a moved significance are the person's, and re-reading
    // the title finds neither: the words that implied them were consumed on
    // capture. Loading them back is what stops a save quietly resetting both.
    dropDate = false;
    typeTap = task.type_source === "user" ? task.commitment_type : null;
    sigTap = task.significance;
    repeat = task.recurrence ?? null;
    alarmType = task.alarm_type ?? "none";
    leadMin = task.alarm_lead_min ?? null;
    advanced = Boolean(repeat) || alarmType !== "none";
    paint();
  }

  function unbind() {
    boundId = null;
    line = "";
    box.value = "";
    chipSpan = null;
    typeTap = null;
    sigTap = null;
    repeat = null;
    alarmType = "none";
    leadMin = null;
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
    alarm_repeat_min: alarmType === "repeat" ? partAConfig.alarm_defaults.repeat_min : null,
  });

  // ----------------------------------------------------------------- the press

  async function commit() {
    const out = read();
    if (!out) return;

    if (boundId) {
      const old = all.find((t) => t.id === boundId);
      if (!old) return;
      if (!(await ask([out.capture.clash_dialog], "Save anyway"))) return;
      // A title carries no date words, so re-reading one finds none. Clearing
      // the date on that evidence would destroy it on every edit of every task.
      // Dropped on purpose by the tick chip, so the words' silence is not the
      // only evidence and the date is allowed to go.
      const keepDate = out.task.date_precision === "none" && !dropDate
        ? { due_at: old.due_at, earliest_start: old.earliest_start, has_time: old.has_time,
            date_phrase: old.date_phrase, date_spans: old.date_spans, date_marker: old.date_marker,
            date_precision: old.date_precision, date_anchor: old.date_anchor,
            date_firmness: old.date_firmness, date_hedge: old.date_hedge }
        : {};
      await undo.remove(UNDO_ID);
      await undo.add({ id: UNDO_ID, action: "edit", task_id: old.id, prior_state: old, created_at: nowLocal() });
      await tasks.update(boundId, {
        ...out.task, ...keepDate, ...advancedFields(),
        push_count: old.push_count ?? 0,
        first_due_at: old.first_due_at ?? null,
        spawned_from: old.spawned_from ?? null,
        id: old.id, created_at: old.created_at, pinned: old.pinned,
        task_state: old.task_state, closed_at: old.closed_at, archived: old.archived,
        updated_at: nowLocal(),
      });
      const title = out.task.title;
      unbind();
      await reload();
      return say(`Saved "${title}"`);
    }

    // Both warnings are asked once. The duplicate fires on Add and nowhere
    // else; the clash fires here, on a save and on a push.
    if (!(await ask([out.capture.duplicate_dialog, out.capture.clash_dialog], "Add anyway"))) return;

    const task = { ...out.task, ...advancedFields() };
    await tasks.add(task);
    await undo.remove(UNDO_ID);
    await undo.add({ id: UNDO_ID, action: "create", task_id: task.id, prior_state: null, created_at: nowLocal() });
    const said = when(out);
    unbind();
    await reload();
    say(`Added "${task.title}"` + (said ? ` \u00b7 ${said}` : ""));
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
    head.appendChild(button("act", "\u2039 Back", () => onBack && onBack()));
    // Only while editing. The ✕ leaves without saving, which is the one way out
    // that changes nothing.
    if (out?.capture.bound_task_chip) {
      const chip = el("span", "bound");
      chip.appendChild(el("span", "", all.find((t) => t.id === boundId)?.title ?? ""));
      chip.appendChild(button("x", "\u2715", unbind));
      head.appendChild(chip);
    }
  }

  function drawDates(out) {
    dateRow.innerHTML = "";
    const said = when(out) || (dropDate ? "" : storedWhen(out?.list.cards ?? [], boundId));
    if (said) dateRow.appendChild(button("chip on", `\u2713 ${said}`, () => clearDate(out)));
    for (const preset of partAConfig.chip_presets) {
      if (!PICKERS.has(preset)) {
        dateRow.appendChild(button("chip", preset, () => typeWords(preset)));
        continue;
      }
      // The picker is a real one. It writes words into the box like every other
      // chip, so a date still arrives one way.
      const wrap = el("label", "chip picker");
      wrap.appendChild(el("span", "", preset));
      const field = el("input");
      field.type = preset === "Pick date" ? "date" : "time";
      field.addEventListener("change", () => {
        if (!field.value) return;
        if (preset === "Pick date") typeWords(dateWords(field.value, new Date().getFullYear()));
        else typeTime(timeWords(field.value));
        field.value = "";
      });
      wrap.appendChild(field);
      dateRow.appendChild(wrap);
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

  function drawTypes(out) {
    typeRow.innerHTML = "";
    panel.innerHTML = "";
    // A type chip on an empty box offers to change the type of nothing.
    if (!out) return;
    const chosen = out.task.commitment_type;
    const three = partAConfig.type_suggestions;
    const shown = three.includes(chosen) ? three : [chosen, ...three];
    for (const id of shown) {
      const hit = button("chip" + (id === chosen ? " on" : ""), id, () => { typeTap = id; paint(); });
      hit.setAttribute("aria-pressed", String(id === chosen));
      typeRow.appendChild(hit);
    }
    const more = button("chip more" + (advanced ? " on" : ""), "\u22ef", () => { advanced = !advanced; paint(); });
    more.setAttribute("aria-expanded", String(advanced));
    more.title = "Advanced";
    typeRow.appendChild(more);
    if (advanced) {
      drawPanel(panel, partAConfig, { chosen, repeat, alarmType, leadMin }, {
        setType: (id) => { typeTap = id; paint(); },
        setRepeat: (r) => { repeat = r; paint(); },
        setAlarm: (kind) => {
          alarmType = kind;
          if (kind !== "none" && leadMin === null) leadMin = partAConfig.alarm_defaults.lead_min;
          paint();
        },
        setLead: (n) => { leadMin = n; },
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
    drawDates(out);
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
  // the matches. Editing the line also clears the tapped span, so a tap only
  // outranks the words while it was the last thing that happened.
  box.addEventListener("input", () => { line = box.value; chipSpan = null; paint(); });

  window.addEventListener("cascade:store-changed", () => { reload(); });

  reload().then(() => {
    if (taskId) load(taskId);
    box.focus();
  });
}
