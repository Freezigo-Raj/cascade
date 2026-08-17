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
// Part A records what alarm was asked for and fires nothing. A browser cannot
// wake itself, so the scheduler and the push that would make one sound are
// Part B's. That is said once, on the Lead row, where it is set.

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);

const REPEAT_UNITS = ["day", "week", "month"];

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
 * @param {object} state       { chosen, repeat, alarmType, leadMin, repeatMin,
 *                               durationMin, durationTapped, firmness, notes }
 * @param {object} on          { setType, setRepeat, setAlarm, setLead, setRepeatMin,
 *                               setDuration, setFirmness, setNotes }
 */
export function drawPanel(panel, config, state, on) {
  const { chosen, repeat, alarmType, leadMin, repeatMin } = state;
  const { durationMin, durationTapped, firmness, notes } = state;
  const three = config.type_suggestions;
  const rest = config.commitment_types.map((m) => m.id).filter((id) => !three.includes(id));

  const group = (label, into) => {
    const wrap = el("div", "group");
    wrap.appendChild(el("div", "label", label));
    wrap.appendChild(into);
    panel.appendChild(wrap);
  };

  const types = el("div", "taps");
  for (const id of rest) {
    types.appendChild(button("chip" + (id === chosen ? " on" : ""), id, () => on.setType(id)));
  }
  group("Type", types);

  // ------------------------------------------------------------------ duration
  //
  // A number and a unit, read together and written as one number of minutes.
  // Until this row was tapped the duration was a per-verb default: `call` is 15
  // minutes because the lexicon says so, not because anything measured it. The
  // clash warning, the day load that chooses push targets and the whole order
  // of the Ideas list are all sums of that guess, which is why a person's own
  // number outranks it and the record says `selected` when it does.
  const dur = el("div", "taps");
  const shown = splitDuration(durationMin ?? 0, config);
  const count = el("input", "num");
  count.type = "number";
  count.min = "1";
  count.value = String(shown.count || "");
  let unit = shown.unit;
  const write = () => {
    const n = Math.max(1, Number(count.value) || 1);
    on.setDuration(Math.min(config.limits.duration_max, n * config.duration_units[unit]));
  };
  count.addEventListener("input", write);
  dur.appendChild(count);
  for (const [label] of unitsBySize(config).reverse()) {
    const hit = button("chip" + (label === unit ? " on" : ""), label, () => {
      unit = label;
      write();
    });
    dur.appendChild(hit);
  }
  // Suggestions, in minutes. Not a vocabulary: tapping one fills the box.
  const quick = el("div", "taps quiet");
  for (const m of config.duration_suggestions) {
    const s = splitDuration(m, config);
    quick.appendChild(button("chip", `${s.count} ${s.unit}`, () => on.setDuration(m)));
  }
  // The word is `about` on purpose. It sets the day's load and nothing on any
  // row ever shows it, so an exact number would claim a precision that changes
  // no screen.
  group(durationTapped ? "Takes about" : "Takes about (from the verb)", dur);
  group("", quick);

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

  // -------------------------------------------------------------------- repeat
  //
  // An interval and nothing more. A repeat spawns its next occurrence when this
  // one is marked done, and only then, so the shape needs no start and no end.
  const rep = el("div", "taps");
  rep.appendChild(button("chip" + (repeat ? "" : " on"), "never", () => on.setRepeat(null)));
  const every = el("input", "num");
  every.type = "number";
  every.min = "1";
  every.value = String(repeat?.every ?? 1);
  every.addEventListener("input", () => {
    const n = Math.max(1, Number(every.value) || 1);
    if (repeat) on.setRepeat({ every: n, unit: repeat.unit });
  });
  rep.appendChild(every);
  for (const u of REPEAT_UNITS) {
    const on_ = repeat?.unit === u;
    rep.appendChild(button("chip" + (on_ ? " on" : ""), u + "s", () =>
      on.setRepeat({ every: Math.max(1, Number(every.value) || 1), unit: u })));
  }
  group("Repeat every", rep);

  // --------------------------------------------------------------------- alarm
  const alarm = el("div", "taps");
  for (const kind of config.alarm_types) {
    const on_ = alarmType === kind;
    alarm.appendChild(button("chip" + (on_ ? " on" : ""), kind, () => on.setAlarm(kind)));
  }
  group("Alarm", alarm);

  if (alarmType !== "none") {
    const lead = el("div", "taps");
    const mins = el("input", "num");
    mins.type = "number";
    mins.min = "0";
    mins.max = String(config.alarm_defaults.max_lead_min);
    mins.value = String(leadMin ?? config.alarm_defaults.lead_min);
    mins.addEventListener("input", () => on.setLead(Math.max(0, Number(mins.value) || 0)));
    lead.appendChild(mins);
    lead.appendChild(el("span", "note",
      "minutes before. An alarm needs a stated time, and nothing rings until Part B."));
    group("Lead", lead);
  }

  // Reachable only while the alarm repeats. It was the config default and
  // nothing could change it, which made a visible choice out of a hidden number.
  if (alarmType === "repeat") {
    const again = el("div", "taps");
    for (const m of config.alarm_repeat_options) {
      const on_ = (repeatMin ?? config.alarm_defaults.repeat_min) === m;
      again.appendChild(button("chip" + (on_ ? " on" : ""), `${m}m`, () => on.setRepeatMin(m)));
    }
    group("Ring again every", again);
  }

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
}
