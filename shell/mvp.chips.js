// Cascade Part A — the date chip row on screen 2.
//
// Every control here does one thing: put words in the box. A date arrives one
// way, through the words in the line, and nothing here sets a date field.
//
// BUILT ONCE AND NEVER REDRAWN, which is the third time this rule has had to be
// applied and the second time it was applied late. The capture box has had it
// since session 99 and the search box got it in session 107; this row was still
// being rebuilt from scratch on every keystroke and after every chip. That is
// fatal for a picker specifically: opening a native calendar takes several
// clicks and a few seconds, and any repaint in that window — a keystroke, or a
// sync arriving from the other device — destroyed the input the calendar was
// attached to, so the calendar closed and no value was ever returned. A date
// picker that never works and a time picker that works when you are quick is
// exactly what that produces.
//
// Only the tick chip changes, so only the tick chip is repainted. The presets
// and the two pickers come from config and never move.
//
// The picker is opened by `showPicker()` on a real button rather than by an
// invisible input stretched over a chip. The old trick relied on the click
// landing on the browser's own calendar indicator, which sits at the right edge
// of the field and was somewhere under a chip of a different width — hit
// sometimes for time and never for date.

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);
const { dateWords, timeWords } = await import(`./mvp.words.js${v}`);

const PICKERS = new Set(["Pick date", "Pick time"]);

/** `due this afternoon` is what the engine says; the chip and the toast say the rest. */
export const when = (out) => (out?.working.due_phrase_short || "").replace(/^due /, "");

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
 * overdue task reads `overdue` here and not `since Wednesday`.
 */
export function storedWhen(cards, id) {
  const said = cards.find((c) => c.card_id === id)?.card_reason_short ?? "";
  return said.replace(/\.$/, "").replace(/^Due /, "").replace(/^Overdue/, "overdue");
}

/**
 * One picker: a button that opens a native control, and the control itself kept
 * out of the click path so it can never swallow the press.
 *
 * `showPicker()` has to be called inside a real gesture, which a click handler
 * is. Where it is missing or refused — older Safari — the input is focused and
 * clicked instead, which is the behaviour that was there before and is now the
 * fallback rather than the plan.
 */
function picker(label, onPicked) {
  const wrap = el("span", "picker");
  const field = el("input");
  field.type = label === "Pick date" ? "date" : "time";
  field.className = "picker-field";
  field.tabIndex = -1;
  field.addEventListener("change", () => {
    const value = field.value;
    if (!value) return;
    // Cleared before the callback, because the callback repaints and this node
    // has to be reusable afterwards rather than holding a stale value.
    field.value = "";
    onPicked(value);
  });
  const hit = button("chip", label, () => {
    try {
      if (typeof field.showPicker === "function") return field.showPicker();
    } catch (e) {
      // A browser that has it and refuses it: fall through rather than stop.
    }
    field.focus();
    field.click();
  });
  wrap.append(hit, field);
  return wrap;
}

/**
 * Builds the row once and returns the one thing that changes.
 *
 * @param {HTMLElement} row  filled once, here
 * @param {object} config    partAConfig
 * @param {object} on        { typeWords, typeTime, clearDate }
 * @returns {{ update: (said: string) => void }}
 */
export function makeDates(row, config, on) {
  row.innerHTML = "";
  const tickSlot = el("span", "tick-slot");
  row.appendChild(tickSlot);

  for (const preset of config.chip_presets) {
    if (!PICKERS.has(preset)) {
      row.appendChild(button("chip", preset, () => on.typeWords(preset)));
      continue;
    }
    row.appendChild(picker(preset, (value) => {
      if (preset === "Pick date") on.typeWords(dateWords(value, new Date().getFullYear()));
      else on.typeTime(timeWords(value));
    }));
  }

  return {
    /** The date the engine read, ticked. Tapping it takes those words back out. */
    update(said) {
      tickSlot.innerHTML = "";
      if (!said) return;
      tickSlot.appendChild(button("chip on", `\u2713 ${said}`, on.clearDate));
    },
  };
}
