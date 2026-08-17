// Cascade Part A — the right detail panel, from the R2 web design.
//
// Everything the design puts here, in the order it puts it, with each row marked
// by what it actually is:
//
//   LIVE   backed by a field and working
//   WIP    drawn, dimmed, and it says what is missing on a press. Kept rather
//          than cut, so the panel does not change shape when it becomes live
//   QUIET  deliberately not shown. The design prints a day's load next to each
//          push target and a duration on every row; both are collected and never
//          shown, which is session 89's rule and not an omission
//
// It reads a stored task and never a typed line. Editing the words is screen 2's
// job, so `Edit` hands the task to the capture box rather than making a second
// place where a title can be changed.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);

const WIP = {
  Project: "Projects are decided and no column is written yet. Part C.",
  People: "The design draws people. The record has no column for them.",
  Tags: "The design draws tags. The record has no column for them.",
  "Blocked by": "Dependencies are decided in full and no column exists yet. Part C.",
  Activity: "Nothing records what happened to a task yet. Part B.",
};

/**
 * @param {HTMLElement} root
 * @param {object} on  { task, act(what, index), edit(id), close(), say(text) }
 */
export function mountDetail(root, on) {
  function row(label, inner) {
    const wrap = el("div", "d-group");
    wrap.appendChild(el("div", "d-label", label));
    wrap.appendChild(inner);
    return wrap;
  }

  /** A whole section that is drawn and does not work. One shape for all of them. */
  function wipRow(label) {
    const box = el("div", "d-wip");
    box.appendChild(el("span", "wip-tag", "WIP"));
    box.appendChild(el("span", "d-wip-text", WIP[label] ?? "Not built yet."));
    const wrap = row(label, box);
    wrap.addEventListener("click", () => on.say(WIP[label] ?? "Not built yet."));
    return wrap;
  }

  function draw() {
    root.innerHTML = "";
    const task = on.task();
    if (!task) {
      // Nothing selected draws one line rather than an empty panel, because an
      // empty bordered box reads as something that failed to load.
      root.appendChild(el("div", "d-empty", "Pick a task to see everything it carries."));
      return;
    }

    const head = el("div", "d-head");
    const kind = [task.commitment_type, task.date_firmness === "hard" ? "hard" : null]
      .filter(Boolean).join(" \u00b7 ");
    head.appendChild(el("div", "d-kind", kind));
    head.appendChild(button("x", "\u2715", () => on.close()));
    root.appendChild(head);

    root.appendChild(el("div", "d-title", task.title));
    if (task.card_reason) root.appendChild(el("div", "d-said", task.card_reason));

    // The three that work, plus Edit, which hands the words back to the box.
    const acts = el("div", "d-acts");
    acts.appendChild(button("go small", task.task_state === "done" ? "Undone" : "Done",
      () => on.act(task.task_state === "done" ? "undone" : "done")));
    acts.appendChild(button("act", task.pinned ? "Unpin" : "Pin", () => on.act("pin")));
    acts.appendChild(button("act", "Edit", () => on.edit(task.id)));
    acts.appendChild(button("act", "Delete", () => on.act("delete")));
    root.appendChild(acts);

    // The design prints the day's load beside each target. It is not drawn: the
    // load is a sum of per-verb defaults and the reader never sees those.
    const push = el("div", "d-push");
    for (const [i, o] of (task.push_options ?? []).entries()) {
      push.appendChild(button("nudge wide-nudge", `\u21e2 ${o.push_label}`, () => on.act("push", i)));
    }
    if (task.push_options?.length) root.appendChild(row("Push", push));

    root.appendChild(row("Notes", el("div", "d-notes",
      task.notes || "No notes. Open the editor to add some.")));

    root.appendChild(wipRow("Project"));
    root.appendChild(wipRow("People"));
    root.appendChild(wipRow("Tags"));
    root.appendChild(wipRow("Blocked by"));

    // Read-only on purpose. Every one of these is set in the editor, and a second
    // control for one field is how two controls come to disagree.
    const facts = el("div", "d-facts");
    const fact = (k, val) => {
      const f = el("div", "d-fact");
      f.appendChild(el("span", "d-fact-k", k));
      f.appendChild(el("span", "d-fact-v", val));
      facts.appendChild(f);
    };
    fact("Takes about", `${task.est_duration_min}m${task.duration_source === "selected" ? " (yours)" : ""}`);
    fact("How firm", task.date_firmness);
    const weight = partAConfig.significance_buttons.find((b) => b.value === task.significance);
    fact("Weight", weight ? weight.label : String(task.significance));
    fact("Alarm", task.alarm_type === "none"
      ? "none"
      : `on, ${task.alarm_lead_min ?? partAConfig.alarm_defaults.lead_min}m before`);
    // A snooze is the one thing on this panel that moves on its own, so it is
    // read out. `push_count` next to it is history; this one is pending.
    if (task.alarm_snoozed_until) fact("Snoozed to", task.alarm_snoozed_until.slice(11, 16));
    // The reason a row jumped. Tier 1 lifted it and the sentence on the row says
    // so; this says how many times it has happened, which the row never does.
    if (task.reminder_fatigue) {
      fact("Alarms unanswered", `${task.reminder_fatigue}${task.alarm_unanswered_at ? " (still)" : ""}`);
    }
    fact("Repeats", task.recurrence ? `every ${task.recurrence.every} ${task.recurrence.unit}` : "never");
    if (task.push_count) fact("Pushed", `${task.push_count} time${task.push_count === 1 ? "" : "s"}`);
    root.appendChild(row("What it carries", facts));

    root.appendChild(wipRow("Activity"));
  }

  draw();
  return { draw, unmount() {} };
}
