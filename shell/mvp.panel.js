// Cascade Part A — the advanced panel on screen 2.
//
// Everything that corrects what the typing already said, in one place: the
// eleven types the chip row does not show, how long the thing takes, how firm
// the date is, repeat, alarm, and the notes.
//
// It came out of `mvp.edit.js` because that file crossed the 400-line cap, and
// this is the part of it that answers to one control: the panel is open or it
// is not, and nothing else on the screen depends on what is inside.
//
// Three of these rows are handed to `resolve()` as inputs rather than patched
// on to the record afterwards, and the rule behind that is worth stating once:
// if a person can set it while capturing, it is an input; if it exists only
// because the task already existed, the save patches it. `duration_tap`,
// `firmness_tap` and `notes_text` are the first kind. `recurrence` and the
// three alarm fields are the second, because a typed line asks for none of them
// and the engine writes them empty on every capture.
//
// THE ALARM ROW IS NOT ALWAYS DRAWN. An alarm needs a stated time: a task due
// "Friday" resolves to 23:59:59 and a lead off that rings at a quarter to
// midnight, which is not a reminder about Friday. So the toggle appears with a
// time and disappears with it, rather than being drawn dead. A control that
// cannot work is worse than an absent one, because its absence reads as a
// decision and its presence reads as a promise.
//
// The web app still fires nothing. The Android shell is what rings, and the
// snooze intervals are pressed there rather than chosen here: nobody knows at
// capture how long they will want, and the number is only wanted with the thing
// in front of them.

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);

const REPEAT_UNITS = ["day", "week", "month", "year"];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const nth = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

/** The app's reading of the repeat, as one sentence, derived from the due
 * date the schedule anchors on (session 123, his slide): `every week on
 * Tuesday at 3pm`. Spawn-on-done semantics mean the sentence describes the
 * schedule, not a promise about when the next row appears. */
function repeatSentence(repeat, dueAt, hasTime) {
  if (!repeat || !dueAt) return null;
  const n = repeat.every ?? 1;
  const base = n === 1 ? `every ${repeat.unit}` : `every ${n} ${repeat.unit}s`;
  const d = new Date(dueAt.slice(0, 19));
  let when = "";
  if (repeat.unit === "week") when = ` on ${WEEKDAYS[d.getDay()]}`;
  if (repeat.unit === "month") when = ` on the ${nth(d.getDate())}`;
  if (repeat.unit === "year") when = ` on ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const clock = hasTime
    ? ` at ${((d.getHours() + 11) % 12) + 1}${d.getMinutes() ? ":" + String(d.getMinutes()).padStart(2, "0") : ""}${d.getHours() < 12 ? "am" : "pm"}`
    : "";
  return base + when + clock;
}

/** `min` `hour` `day` in descending size, so a duration reads in its largest whole unit. */
const unitsBySize = (config) =>
  Object.entries(config.duration_units).sort((a, b) => b[1] - a[1]);

/** 120 reads as 2 hours, 90 as 90 min. A unit is never stored; this is display only. */
export function splitDuration(minutes, config) {
  for (const [label, size] of unitsBySize(config)) {
    if (minutes >= size && minutes % size === 0) return { count: minutes / size, unit: label };
  }
  return { count: minutes, unit: "min" };
}

/**
 * @param {HTMLElement} panel  emptied and refilled
 * @param {object} config      partAConfig
 * @param {object} state       { chosen, repeat, dueAt, hasTime,
 *                               durationMin, durationTapped, firmness, notes }
 * @param {object} on          { setType, setRepeat,
 *                               setDuration, setFirmness, setNotes }
 */
export function drawPanel(panel, config, state, on) {
  // `hasTime` is still handed in — the repeat sentence reads it to decide
  // whether to speak a clock — but nothing here draws an alarm control any
  // more. Sniffing it off the date string would be this file deciding what a
  // stated time is, which is the engine's answer and not the screen's.
  const { repeat, dueAt, hasTime } = state;
  const { durationMin, durationTapped, firmness, notes } = state;

  const group = (label, into) => {
    const wrap = el("div", "group");
    wrap.appendChild(el("div", "label", label));
    wrap.appendChild(into);
    panel.appendChild(wrap);
  };

  // THE ORDER IS THE ORDER A PERSON THINKS ABOUT A TASK (session 121, his
  // words): what it is about (notes), whether it must ring (alarm), whether it
  // comes back (repeat), how movable the date is (firmness), how long it takes
  // (duration) — and the type classification last, because the engine already
  // guessed it and the chips above the panel already offer the likely three.


  // --------------------------------------------------------------------- notes
  //
  // Read, never matched. A note reaches neither search nor the duplicate
  // warning, and that is a decision rather than an omission: stored records are
  // never rewritten, so a note that fed `normalised` later would leave every
  // task captured before it unsearchable by its own note for ever.
  const note = el("textarea", "notes");
  note.rows = 3;
  note.maxLength = config.limits.notes_chars;
  note.placeholder = "anything the title should not carry";
  note.value = notes ?? "";
  note.addEventListener("input", () => on.setNotes(note.value));
  group("Notes", note);
  // THE ALARM LEFT THIS PANEL TOO (session 126, his slide: "remove alarm
  // section from here, it is already there at the top"). The toggle has sat
  // under the box since session 123 and this group stayed beside it, which is
  // one field with two controls — the thing the lead's move was about. The row
  // above owns all of it now, including the one sentence explaining why there
  // is no toggle when the line carries no time.

  // THE LEAD LEFT THIS PANEL (session 125, his arrow on the slide). It is a
  // slider beside the Alarm toggle on the capture row now, where the sentence
  // it changes already sits. A second copy here would be the same field with
  // two controls, which is the thing this project has paid for four times.

  // -------------------------------------------------------------------- repeat
  //
  // An interval and nothing more. A repeat spawns its next occurrence when this
  // one is marked done, and only then, so the shape needs no start and no end.
  // THE NEVER BUTTON SITS IN THE HEADER AND WEARS THE READING (session 124,
  // his slide): beside `Repeat every`, saying `Never` until a repeat is set,
  // then the app's own sentence — `every Wednesday at 5pm` — because a control
  // that echoes its meaning back cannot be silently misread. Tapping it is
  // always the way back to never. The number and the four units sit in ONE
  // line below (his sizing).
  const repHead = el("div", "group-head");
  repHead.appendChild(el("div", "label", "Repeat every"));
  const sentence = repeatSentence(repeat, dueAt, hasTime);
  // The chip wears the whole sentence (session 125, his slide: "not showing
  // full text"). It was capped at 62% of the row with an ellipsis, so
  // `every month on the 23rd at 3:30pm` — the one thing on the screen that
  // says what the repeat MEANS — was cut at the hour. It wraps instead.
  const nev = button("chip rep-state" + (repeat ? "" : " on"),
    repeat ? sentence : "Never", () => on.setRepeat(null));
  nev.setAttribute("aria-pressed", String(!repeat));
  repHead.appendChild(nev);

  const rep = el("div", "taps rep-line");
  const every = el("input", "num");
  every.type = "number";
  every.min = "1";
  every.value = String(repeat?.every ?? 1);
  // `change`, not `input` (session 124, his report): the input listener
  // repainted the panel on every digit, the rebuilt element never held the
  // caret, and typing `14` took two focuses. The value lands when the field
  // is left.
  every.addEventListener("change", () => {
    const n = Math.max(1, Number(every.value) || 1);
    if (repeat) on.setRepeat({ every: n, unit: repeat.unit });
  });
  rep.appendChild(every);
  for (const u of REPEAT_UNITS) {
    const on_ = repeat?.unit === u;
    rep.appendChild(button("chip" + (on_ ? " on" : ""), u + "s", () =>
      on.setRepeat({ every: Math.max(1, Number(every.value) || 1), unit: u })));
  }
  const repWrap = el("div", "group");
  repWrap.appendChild(repHead);
  repWrap.appendChild(rep);
  panel.appendChild(repWrap);

  // ------------------------------------------------------------------ firmness
  //
  // `is_hard` is the first ranking factor below a pin, and until this row
  // existed the only way to reach it was to type a marker word: `deadline`,
  // `by Friday`, `no later than`. A capture made entirely of taps could not be
  // hard. `Auto` gives the words back their say, so a tap is undoable.
  const firm = el("div", "taps");
  firm.appendChild(button("chip" + (firmness ? "" : " on"), "auto", () => on.setFirmness(null)));
  for (const f of config.firmness_order) {
    firm.appendChild(button("chip" + (firmness === f ? " on" : ""), f, () => on.setFirmness(f)));
  }
  group("How firm", firm);

  // ------------------------------------------------------------------ duration
  //
  // One number of minutes. Until this row was touched the duration was a per-verb default: `call` is 15
  // minutes because the lexicon says so, not because anything measured it. The
  // clash warning, the day load that chooses push targets and the whole order
  // of the Ideas list are all sums of that guess, which is why a person's own
  // number outranks it and the record says `selected` when it does.
  const dur = el("div", "dur-line");
  // A SLIDER, NOT BUTTONS (session 125, his words: "task timer should be a
  // slider instead of buttons"). The number field, the three unit chips and
  // the four suggestion chips were seven controls for one number.
  //
  // IT IS A LADDER, NOT A RANGE. `limits.duration_max` is 182 days, and a
  // linear slider across that spends its whole travel between four and five
  // months and cannot land on twenty minutes. The rungs are the durations a
  // person actually gives, close together where the guesses are and far apart
  // where nobody is precise, and the reading beside it says which one it is.
  const LADDER = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440, 2880, 4320, 10080];
  const nearest = (m) => {
    let best = 0;
    for (let i = 0; i < LADDER.length; i++) if (Math.abs(LADDER[i] - m) < Math.abs(LADDER[best] - m)) best = i;
    return best;
  };
  const say = (m) => {
    const s = splitDuration(m, config);
    return `${s.count} ${s.unit}${s.count === 1 ? "" : s.unit === "min" ? "" : "s"}`;
  };
  const slide = el("input", "dur");
  slide.type = "range";
  slide.min = "0";
  slide.max = String(LADDER.length - 1);
  slide.step = "1";
  slide.value = String(nearest(durationMin ?? 30));
  slide.setAttribute("aria-label", "Takes about");
  const read = el("span", "dur-read", say(LADDER[Number(slide.value)]));
  // `input` here and `change` on the two number fields, and the difference is
  // the control rather than the rule: a range holds no caret, so repainting it
  // mid-drag cannot lose one. The reading has to move with the thumb or the
  // slider is a number nobody can see.
  slide.addEventListener("input", () => {
    read.textContent = say(LADDER[Number(slide.value)]);
  });
  slide.addEventListener("change", () => {
    on.setDuration(Math.min(config.limits.duration_max, LADDER[Number(slide.value)]));
  });
  dur.append(slide, read);
  // The word is `about` on purpose. It sets the day's load and nothing on any
  // row ever shows it, so an exact number would claim a precision that changes
  // no screen.
  group(durationTapped ? "Takes about" : "Takes about (from the verb)", dur);
  // The Type group LEFT this panel in session 122: the dropdown beside the ⋯
  // now holds all fourteen, so a second copy here was the same control twice.

}
