// Cascade Part A — the date chip row on screen 2.
//
// It left `mvp.edit.js` when that file crossed the 400-line cap, and it is the
// right seam: every one of these controls does the same single thing, which is
// put words in the box. A date arrives one way, through the words in the line,
// and nothing here sets a date field.
//
// The two pickers are real pickers. What they hand back is spelled out into
// words and typed, so a picked date and a typed one leave the same record.

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);
const { dateWords, timeWords } = await import(`./mvp.words.js${v}`);

/** The two chips that open a picker rather than typing their own label. */
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
 * overdue task reads `overdue` here and not `since Wednesday`: the card is the
 * mobile sentence and collapses it, and this chip inherits the collapse.
 */
export function storedWhen(cards, id) {
  const said = cards.find((c) => c.card_id === id)?.card_reason_short ?? "";
  return said.replace(/\.$/, "").replace(/^Due /, "").replace(/^Overdue/, "overdue");
}

/**
 * @param {HTMLElement} row    emptied and refilled
 * @param {object} config      partAConfig
 * @param {object|null} out    what resolve() returned, or null on an empty box
 * @param {object} on          { said, boundId, dropDate, cards, typeWords, typeTime, clearDate }
 */
export function drawDates(row, config, out, on) {
  row.innerHTML = "";
  const said = on.said || (on.dropDate ? "" : storedWhen(on.cards, on.boundId));
  if (said) row.appendChild(button("chip on", `\u2713 ${said}`, on.clearDate));
  for (const preset of config.chip_presets) {
    if (!PICKERS.has(preset)) {
      row.appendChild(button("chip", preset, () => on.typeWords(preset)));
      continue;
    }
    const wrap = el("label", "chip picker");
    wrap.appendChild(el("span", "", preset));
    const field = el("input");
    field.type = preset === "Pick date" ? "date" : "time";
    field.addEventListener("change", () => {
      if (!field.value) return;
      if (preset === "Pick date") on.typeWords(dateWords(field.value, new Date().getFullYear()));
      else on.typeTime(timeWords(field.value));
      field.value = "";
    });
    wrap.appendChild(field);
    row.appendChild(wrap);
  }
}
