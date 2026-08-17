// Cascade Part A — a row, and a block of rows.
//
// Left `mvp.list.js` when that file crossed the 400-line cap making its chrome
// build-once. The seam is the right one: everything a row needs is handed in, so
// it cannot reach into the screen's state behind its own back, and the two
// callers that draw rows — the `Now` block and the plain list — share one
// function rather than one description.

const v = new URL(import.meta.url).search;
const { el } = await import(`./mvp.paint.js${v}`);

export function rowOf(card, { all, tab, narrow, act, say, openEdit }) {
  const task = all.find((t) => t.id === card.card_id);
  const late = tab !== "Done" && card.card_band === "Today" &&
    (card.card_reason_short || "").startsWith("Overdue");
  const row = el("div", "row" + (task?.pinned ? " pinned" : "") +
    (tab === "Done" ? " done" : "") + (late ? " overdue" : ""));

  // Done is a circle now, which is the design's control for it. The word went
  // with it: two controls for one outcome is how two of them start to
  // disagree. On the Done tab the same circle is Undone, filled.
  const tick = el("button", "tick" + (tab === "Done" ? " on" : ""));
  tick.type = "button";
  tick.title = tab === "Done" ? "Undone" : "Done";
  tick.setAttribute("aria-label", tick.title);
  tick.addEventListener("click", () => act(card.card_id, tab === "Done" ? "undone" : "done"));
  row.appendChild(tick);

  const body = el("div", "body");
  const title = el("button", "title", card.card_title);
  title.type = "button";
  // Tapping the row opens screen 2 with the task loaded. The box holds the
  // title, never `raw_text`, and screen 2 is the one that decides that.
  title.addEventListener("click", () => openEdit && openEdit(card.card_id));
  body.appendChild(title);

  // A Done row is a title alone. `Overdue since Friday` on a finished task is
  // a sentence about a deadline that no longer applies.
  const said = narrow.matches ? card.card_reason_short : card.card_reason;
  if (said && tab !== "Done") body.appendChild(el("div", "said", said));

  const acts = el("div", "acts");
  const button = (label, fn, cls) => {
    const b = el("button", "act" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  };
  if (tab !== "Done") {
    acts.appendChild(button(task?.pinned ? "Unpin" : "Pin", () => act(card.card_id, "pin")));
    acts.appendChild(button("Delete", () => act(card.card_id, "delete")));
    // Drawn, and doing nothing until Part C. The design puts a workflow tag
    // here; there is no `waits_for` column yet, so it says so on a press
    // rather than being left out and forgotten. Every `later` control in the
    // app looks like this one.
    acts.appendChild(button("Workflow", () => say("Workflow is Part C. Nothing on this task depends on another yet."), "later"));
  }
  body.appendChild(acts);
  row.appendChild(body);

  // The push targets, on the right, where the design puts its nudges. The
  // labels are the engine's own — a band pushes to a band — rather than a
  // fixed `+1h` and `+3d`, which would be two offsets nothing chose.
  const nudges = el("div", "nudges");
  if (tab !== "Done") {
    (card.push_options ?? []).forEach((o, i) => {
      const b = el("button", "nudge", o.push_label);
      b.type = "button";
      b.title = `Push to ${o.push_label.toLowerCase()}`;
      b.addEventListener("click", () => act(card.card_id, "push", i));
      nudges.appendChild(b);
    });
  }
  row.appendChild(nudges);
  return row;
}

/** A heading with its own count, and the wash the design gives `Now`. */
export function blockOf(name, cards, isNow, ctx) {
  const block = el("div", "block" + (isNow ? " now" : ""));
  const head = el("div", "group-head");
  if (isNow) head.appendChild(el("span", "group-dot"));
  head.appendChild(el("span", "group-name", name));
  head.appendChild(el("span", "group-count", String(cards.length)));
  block.appendChild(head);
  const rows = el("div", "rows");
  for (const card of cards) rows.appendChild(rowOf(card, ctx));
  block.appendChild(rows);
  return block;
}
