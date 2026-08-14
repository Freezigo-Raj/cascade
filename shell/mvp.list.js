// Cascade Part A — screen 1, the list.
//
// The first screen built against MVP.md rather than against the example. The
// Stage 3 harness at `index.html` stays where it is: it draws every field and
// is what `check_render` pins, and this file draws what a person sees.
//
// It reads `listOnly()`, so the cards here and the cards under the capture box
// come out of one pass. A second ordering written for the screen is the defect
// this project has now avoided four times by making both callers share a
// function rather than a description.
//
// Nothing on a row shows a duration, a push count, or how loaded a day is. Those
// choose the push targets and annotate nothing, which is the rule the screen has
// to keep because it is the one place it could be broken.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { listOnly } = await import(`./resolve.js${v}`);
const { tasks, undo, UNDO_ID, mode, sync } = await import(`./store.select.js${v}`);
const { pushed } = await import(`./push.js${v}`);
const { matchTier } = await import(`./search.js${v}`);
const { spawn } = await import(`./repeat.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { readClashes, readClashDialog } = await import(`./clash.js${v}`);
const { ask } = await import(`./mvp.dialog.js${v}`);
const { el } = await import(`./mvp.paint.js${v}`);

const TABS = ["Tasks", "Ideas", "Done"];
const SLOTS = ["Today", "Tomorrow", "Upcoming"];

// One clock for both screens, in `mvp.clock.js`. It was written here first and
// copied into screen 2, which is how two functions that have to agree begin to
// disagree.
const now = nowLocal;

// A notification is the smallest screen there is, and so is a phone. Both
// sentences come back on every call; this is the screen picking, which is the
// screen's question and not the engine's.
const narrow = window.matchMedia("(max-width: 600px)");

export function mountList(root, { openEdit } = {}) {
  let tab = "Tasks";
  let slot = "Today";
  let filter = "";
  let all = [];
  let toast = null;
  let toastTimer = 0;

  async function reload() {
    all = await tasks.all();
    draw();
  }

  /** The undo entry is written before the action, never after. */
  async function remember(action, task) {
    await undo.remove(UNDO_ID);
    await undo.add({ id: UNDO_ID, action, task_id: task?.id ?? null, prior_state: task ?? null, created_at: now() });
  }

  function say(text) {
    clearTimeout(toastTimer);
    toast = text;
    // The toast holds eight seconds. The undo entry outlives it: the offer goes
    // quiet, the ability does not.
    toastTimer = setTimeout(() => { toast = null; draw(); }, (partAConfig.undo_ui_timeout_sec ?? 8) * 1000);
    draw();
  }

  // ------------------------------------------------------------ the actions

  async function act(id, what, index) {
    const task = all.find((t) => t.id === id);
    if (!task) return;

    if (what === "done") {
      await remember("done", task);
      await tasks.update(id, { ...task, task_state: "done", closed_at: now(), updated_at: now() });
      // A repeat spawns its next occurrence here and only here, so there is
      // never more than one open at a time.
      const next = spawn({ ...task, task_state: "done" }, crypto.randomUUID(), now());
      if (next) await tasks.add(next);
      say(`Done "${task.title}"`);
    } else if (what === "undone") {
      await remember("undone", task);
      // Undoing a done takes back what the done created, so the press leaves
      // one row rather than two.
      for (const t of all) if (t.spawned_from === id) await tasks.remove(t.id);
      await tasks.update(id, { ...task, task_state: "ready", closed_at: null, updated_at: now() });
      say(`Back "${task.title}"`);
    } else if (what === "pin") {
      await remember("pin", task);
      await tasks.update(id, { ...task, pinned: !task.pinned, updated_at: now() });
    } else if (what === "delete") {
      await remember("delete", task);
      await tasks.remove(id);
      say(`Deleted "${task.title}"`);
    } else if (what === "push") {
      const card = cardsFor().find((c) => c.card_id === id);
      const option = card?.push_options?.[index];
      if (!option) return;
      const moved = pushed(task, option.push_to, now());
      // The clash warning fires on Add, on save and on a push. A push moves the
      // date without opening the task, so this is the only place it can be told.
      if (!(await ask([readClashDialog(readClashes(moved, all))], "Push anyway"))) return;
      await remember("push", task);
      await tasks.update(id, moved);
      say(`Moved "${task.title}" to ${option.push_label.toLowerCase()}`);
    }
    await reload();
  }

  async function undoLast() {
    const entry = (await undo.all())[0];
    if (!entry) return;
    if (entry.action === "create") await tasks.remove(entry.task_id);
    else if (entry.prior_state) {
      // Restoring is an update where the task survives and an add where it does
      // not, with a fresh stamp: an undo is a change made now, and newest wins.
      const back = { ...entry.prior_state, updated_at: now() };
      if (all.some((t) => t.id === entry.task_id)) await tasks.update(entry.task_id, back);
      else await tasks.add(back);
    }
    await undo.remove(UNDO_ID);
    clearTimeout(toastTimer);
    toast = null;
    await reload();
  }

  // -------------------------------------------------------------- the lists

  const cardsFor = () => listOnly(all, partAConfig, now()).cards;

  function visible() {
    const lists = listOnly(all, partAConfig, now());
    const pool = tab === "Ideas" ? lists.ideas
               : tab === "Done" ? lists.done
               : lists.cards.filter((c) => c.card_band === slot);
    if (!filter.trim()) return pool;
    // The same four tiers the capture box uses, through the same matcher, so
    // the two search boxes cannot disagree about what counts as a match.
    const byId = new Map(all.map((t) => [t.id, t]));
    return pool.filter((c) => {
      const t = byId.get(c.card_id);
      return matchTier(filter, t ? t.normalised : c.card_title, partAConfig).tier > 0;
    });
  }

  // ---------------------------------------------------------------- drawing

  function drawRow(card) {
    const task = all.find((t) => t.id === card.card_id);
    const row = el("div", "row" + (task?.pinned ? " pinned" : ""));

    const title = el("button", "title", card.card_title);
    title.type = "button";
    // Tapping the row opens screen 2 with the task loaded. The box holds the
    // title, never `raw_text`, and screen 2 is the one that decides that.
    title.addEventListener("click", () => openEdit && openEdit(card.card_id));
    row.appendChild(title);

    // A Done row is a title alone. `Overdue since Friday` on a finished task is
    // a sentence about a deadline that no longer applies.
    const said = narrow.matches ? card.card_reason_short : card.card_reason;
    if (said && tab !== "Done") row.appendChild(el("div", "said", said));

    const acts = el("div", "acts");
    const button = (label, fn, cls) => {
      const b = el("button", "act" + (cls ? " " + cls : ""), label);
      b.type = "button";
      b.addEventListener("click", fn);
      return b;
    };

    if (tab === "Done") {
      acts.appendChild(button("Undone", () => act(card.card_id, "undone")));
    } else {
      acts.appendChild(button("Done", () => act(card.card_id, "done")));
      acts.appendChild(button(task?.pinned ? "Unpin" : "Pin", () => act(card.card_id, "pin")));
      acts.appendChild(button("Delete", () => act(card.card_id, "delete")));
      // Each target says where it lands. A day already over capacity is not
      // among them, and the row says nothing about why.
      (card.push_options ?? []).forEach((o, i) => {
        acts.appendChild(button(`\u21e2 ${o.push_label}`, () => act(card.card_id, "push", i), i === 0 ? "away" : ""));
      });
    }
    row.appendChild(acts);
    return row;
  }

  function draw() {
    root.innerHTML = "";

    const bar = el("div", "bar");
    for (const name of TABS) {
      const b = el("button", "tab", name);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(tab === name));
      b.addEventListener("click", () => { tab = name; draw(); });
      bar.appendChild(b);
    }
    const box = el("input", "search");
    box.type = "search";
    box.placeholder = "search";
    box.value = filter;
    box.addEventListener("input", (e) => { filter = e.target.value; draw(); box.focus(); });
    bar.appendChild(box);
    // Opens screen 2 empty. It is the only control on this screen that is not
    // about a row that already exists.
    const plus = el("button", "plus", "+");
    plus.type = "button";
    plus.title = "Capture";
    plus.addEventListener("click", () => openEdit && openEdit(null));
    bar.appendChild(plus);
    root.appendChild(bar);

    // The toggle lives inside Tasks and nowhere else. Ideas and Done are one
    // list each and a toggle over them would be a control with one position.
    if (tab === "Tasks") {
      const slots = el("div", "slots");
      for (const name of SLOTS) {
        const b = el("button", "slot", name);
        b.type = "button";
        b.setAttribute("aria-pressed", String(slot === name));
        b.addEventListener("click", () => { slot = name; draw(); });
        slots.appendChild(b);
      }
      root.appendChild(slots);
    }

    // With nothing stored the screen shows nothing. No message, no illustration,
    // no prompt. An empty list is not a problem to explain.
    const rows = el("div", "rows");
    for (const card of visible()) rows.appendChild(drawRow(card));
    root.appendChild(rows);

    if (toast) {
      const t = el("div", "toast");
      t.appendChild(el("span", "", toast));
      const u = el("button", "", "Undo");
      u.type = "button";
      u.addEventListener("click", undoLast);
      t.appendChild(u);
      root.appendChild(t);
    }

    drawState(root);
  }

  async function drawState(into) {
    if (mode !== "sync" || !sync) return;
    const { online, waiting } = await sync.status();
    const line = el("div", "state", waiting ? `${waiting} waiting to send` : online ? "synced" : "offline");
    into.appendChild(line);
  }

  // A task arriving from another device changes the list without anything here
  // being pressed.
  window.addEventListener("cascade:store-changed", () => { reload(); });
  narrow.addEventListener("change", draw);

  reload();
}
