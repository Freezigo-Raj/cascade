// Cascade Part A — the advanced panel on screen 2.
//
// The eleven types the chip row does not show, plus Repeat, Alarm and Lead.
// It came out of `mvp.edit.js` because that file crossed the 400-line cap, and
// this is the part of it that answers to one control: the panel is open or it
// is not, and nothing else on the screen depends on what is inside.
//
// Every value here is screen state applied on top of what `resolve()` returns.
// The engine writes `recurrence: null` and `alarm_type: "none"` on every
// capture, because a typed line asks for neither, and the panel is the only
// thing that changes them.
//
// Part A records what alarm was asked for and fires nothing. A browser cannot
// wake itself, so the scheduler and the push that would make one sound are
// Part B's. That is said once, on the Lead row, where it is set.

const REPEAT_UNITS = ["day", "week", "month"];

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);

/**
 * @param {HTMLElement} panel  emptied and refilled
 * @param {object} config      partAConfig
 * @param {object} state       { chosen, repeat, alarmType, leadMin }
 * @param {object} on          { setType, setRepeat, setAlarm, setLead, paint }
 */
export function drawPanel(panel, config, state, on) {
  const { chosen, repeat, alarmType, leadMin } = state;
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
  for (const unit of REPEAT_UNITS) {
    const on_ = repeat?.unit === unit;
    rep.appendChild(button("chip" + (on_ ? " on" : ""), unit + "s", () =>
      on.setRepeat({ every: Math.max(1, Number(every.value) || 1), unit })));
  }
  group("Repeat every", rep);

  const alarm = el("div", "taps");
  for (const kind of config.alarm_types) {
    const on_ = alarmType === kind;
    alarm.appendChild(button("chip" + (on_ ? " on" : ""), kind, () => on.setAlarm(kind)));
  }
  group("Alarm", alarm);

  if (alarmType === "none") return;

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
