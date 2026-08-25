// Cascade Part A — a row, and a block of rows.
//
// Left `mvp.list.js` when that file crossed the 400-line cap making its chrome
// build-once. The seam is the right one: everything a row needs is handed in, so
// it cannot reach into the screen's state behind its own back, and the two
// callers that draw rows — the `Now` block and the plain list — share one
// function rather than one description.

const v = new URL(import.meta.url).search;
const { el } = await import(`./mvp.paint.js${v}`);
const { tapGuard } = await import(`./mvp.tap.js${v}`);

// The two row actions are DRAWN, not written (session 119): a pin glyph and a
// bin glyph, each still carrying its word for a screen reader and a hover. The
// words were the row's widest thing and said what the shapes already say.
const PIN_PATH = "M9.5 1.5l5 5-1.2 1.2-.6-.2-3 3 .4 2.6-1 1-3.1-3.1L2 15l-1-1 4-4L1.9 6.9l1-1 2.6.4 3-3-.2-.6z";
// A BELL AND A LOOP, AND NEITHER IS A CONTROL (session 132, his ask: "need to
// know if a task is one with repeat or with alarm by looking at the task, use a
// small symbol for each, not clickable").
//
// The row has said WHEN since it was built and never said HOW IT WILL TELL YOU.
// Everything about an alarm or a repeat lived one screen away, so the only way
// to know which of eleven tasks would wake you was to open them one at a time.
//
// They sit beside the title, not among the acts, and they are `aria-hidden`
// with the fact spoken in the title's own label instead: a screen reader that
// stops on two decorative shapes between a title and a date has been made
// slower by them.
const BELL_PATH = "M8 1.6a3.4 3.4 0 00-3.4 3.4v2.3L3.3 9.9h9.4l-1.3-2.6V5A3.4 3.4 0 008 1.6zM6.6 11.4a1.4 1.4 0 002.8 0";
const LOOP_PATH = "M4.2 6.2A4 4 0 0111.6 5M11.8 9.8A4 4 0 014.4 11M4.2 3.6v2.6h2.6M11.8 12.4V9.8H9.2";
const BIN_PATH = "M3 4h10M6.5 4V2.5h3V4M4.5 4l.7 9a1 1 0 001 .9h3.6a1 1 0 001-.9l.7-9M6.8 6.5v5M9.2 6.5v5";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const nth = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");

/**
 * `today`, `yesterday`, `16th August`. A local calendar day against a local
 * calendar day, which is why the offset is cut off rather than parsed:
 * `closed_at` is already written in the zone it happened in, and turning it
 * into an instant only to turn it back would be two conversions to arrive
 * where it started.
 */
function dayWords(iso) {
  const d = new Date(iso.slice(0, 19));
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((midnight - today) / 86400000);
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  return `${nth(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

function glyph(path, filled) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  // Sized here as well as in the stylesheet: an SVG with no stated size is
  // 300×150 by default, and one stylesheet arriving late once is all it takes
  // for two of those to shove a row around.
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  if (filled) p.setAttribute("fill", "currentColor");
  else { p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "1.4"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round"); }
  svg.appendChild(p);
  return svg;
}

export function rowOf(card, { all, tab, slot, narrow, act, openEdit }) {
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
  const titleRow = el("div", "title-row");
  const title = el("button", "title", card.card_title);
  title.type = "button";
  // Tapping the row opens screen 2 with the task loaded. The box holds the
  // title, never `raw_text`, and screen 2 is the one that decides that.
  title.addEventListener("click", () => openEdit && openEdit(card.card_id));
  titleRow.appendChild(title);
  body.appendChild(titleRow);

  // A Done row is a title alone. `Overdue since Friday` on a finished task is
  // a sentence about a deadline that no longer applies.
  //
  // A sentence that only repeats the heading above it is not drawn (session
  // 119): every row on the Today slot reading `Due today` was the slot's own
  // name said back thirty times. Anything the sentence adds — a time, a hedge,
  // an overdue, a window — keeps it, because the test is exact equality with
  // `Due <slot>` and nothing looser.
  const said = narrow.matches ? card.card_reason_short : card.card_reason;
  const echo = slot && said &&
    said.replace(/\.$/, "").toLowerCase() === `due ${slot.toLowerCase()}`;
  // The two marks, in the order a person asks the question: will it wake me,
  // and will it come back.
  const marks = [];
  if (task?.alarm_type && task.alarm_type !== "none") marks.push(["alarm", BELL_PATH]);
  if (task?.recurrence && task.recurrence.unit) marks.push(["repeats", LOOP_PATH]);
  if (marks.length) {
    const strip = el("span", "marks");
    for (const [what, path] of marks) {
      const m = el("span", "mark mark-" + what);
      m.appendChild(glyph(path, false));
      strip.appendChild(m);
    }
    titleRow.appendChild(strip);
    title.setAttribute("aria-label",
      `${card.card_title}, ${marks.map((m) => m[0]).join(" and ")}`);
  }

  if (said && !echo && tab !== "Done") body.appendChild(el("div", "said", said));

  // WHEN IT WAS FINISHED (session 126, his slide: add "today", "16th August").
  // A Done row was a title alone, which answered "was it done" and nothing
  // else — and a Done tab of forty struck-through titles in no readable order
  // is a list where you cannot find the one you closed this morning. The date
  // is `closed_at`, a fact rather than a guess, so the quiet-fields rule is
  // untouched. No clock: the day is what a person looks for.
  if (tab === "Done" && task?.closed_at) {
    // CANCELLED IS NOT DONE (session 129, his report). The tab holds both
    // states — `cards.js` has read `done || cancelled` since the catch-up was
    // built — and every row said `Done`, so a task the calendar walked past, or
    // one called off at a lock screen, read as an achievement. The word follows
    // the state.
    const verb = task.task_state === "cancelled" ? "Cancelled" : "Done";
    body.appendChild(el("div", "said", `${verb} ${dayWords(task.closed_at)}`));
  }

  const acts = el("div", "acts");
  const button = (label, fn, cls) => {
    const b = el("button", "act" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  };
  if (tab !== "Done") {
    const pin = button("", () => act(card.card_id, "pin"), "icon");
    pin.title = task?.pinned ? "Unpin" : "Pin";
    pin.setAttribute("aria-label", pin.title);
    pin.appendChild(glyph(PIN_PATH, !!task?.pinned));
    acts.appendChild(pin);
    const bin = button("", () => act(card.card_id, "delete"), "icon");
    // The glyph is a bin and the word is `Cancel`, because that is what it does
    // now (session 130): the row closes as cancelled and keeps its place on the
    // Done tab. `Delete for good` on that row is the only thing that erases.
    bin.title = "Cancel";
    bin.setAttribute("aria-label", "Cancel this task");
    bin.appendChild(glyph(BIN_PATH, false));
    acts.appendChild(bin);
    // The `Workflow` tag LEFT the row (session 119). MVP.md has said since
    // session 104 that a row carries Pin, Delete, the Done circle and its push
    // targets, so a fifth control here contradicted the written rule, and a
    // dead word on every row is a heavier price than one WIP entry. Workflow
    // keeps its two marked places: the rail and the detail panel.
  } else {
    // REVIVE (session 126, his word). Undone has been the filled circle since
    // session 104 and nothing on the row said so — a circle that means "undo
    // this" looks exactly like a circle that means "done", and the only way to
    // find out was to press it. The word sits beside it and does the same
    // thing, which is the one place in this app a control is drawn twice on
    // purpose: the glyph is the target a thumb already knows, and the word is
    // the only thing that says what the target does.
    const revive = button("Revive", () => act(card.card_id, "undone"));
    revive.title = "Bring it back to the list";
    acts.appendChild(revive);
    // The only control in the app that erases a task, and since session 132 the
    // only one that cannot be taken back. It lives here because this row is
    // already closed: the bin on an open row cancels, and `Revive` beside this
    // brings that back.
    const purge = button("Delete for good", () => act(card.card_id, "purge"), "danger");
    purge.title = "Remove it from the store";
    acts.appendChild(purge);
  }
  body.appendChild(acts);
  row.appendChild(body);

  // The push targets, on the right, where the design puts its nudges. The
  // labels are the engine's own — a band pushes to a band — rather than a
  // fixed `+1h` and `+3d`, which would be two offsets nothing chose.
  const nudges = el("div", "nudges");
  // A SCROLL IS NOT A PRESS (session 124, his report; widened in session 125).
  // The rule left this file: `mvp.tap.js` holds it once and every scrolling
  // strip in the app wears the same one. Y-only and touch-only was half the
  // guard — a flick that comes to rest on a rung looks exactly like a click.
  tapGuard(nudges);
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
