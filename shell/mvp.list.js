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
const { readClashes, readClashDialog, readDeadlineClashes, readDeadlineDialog } =
  await import(`./clash.js${v}`);
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

export function mountList(root, { openEdit, openAccount } = {}) {
  let tab = "Tasks";
  let slot = "Today";
  let filter = "";
  let all = [];
  let toast = null;
  let toastTimer = 0;
  // What the header pill says. Held rather than read, because `sync.status()` is
  // async and the draw is not; `readSync` corrects it and redraws if it moved.
  let syncWord = "synced";

  async function reload() {
    all = await tasks.all();
    draw();
    readSync();
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
      // Both warnings fire on a push. Pushing a hard deadline on to a day that
      // already holds one is the case the second check exists for, and a push
      // is the one place it can happen without the task being opened.
      const warned = [
        readClashDialog(readClashes(moved, all)),
        readDeadlineDialog(readDeadlineClashes(moved, all), now()),
      ];
      if (!(await ask(warned, "Push anyway"))) return;
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
  function drawBlock(name, cards, isNow) {
    const block = el("div", "block" + (isNow ? " now" : ""));
    const head = el("div", "group-head");
    if (isNow) head.appendChild(el("span", "group-dot"));
    head.appendChild(el("span", "group-name", name));
    head.appendChild(el("span", "group-count", String(cards.length)));
    block.appendChild(head);
    const rows = el("div", "rows");
    for (const card of cards) rows.appendChild(drawRow(card));
    block.appendChild(rows);
    return block;
  }

  /** `Sat 17 Aug`, the one thing this screen knows that a person might not. */
  function today() {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  function draw() {
    root.innerHTML = "";

    // The kicker names the tab, the title names the slot inside it. Two levels
    // of where-you-are, which the tab row alone was carrying on its own.
    const headBlock = el("div", "head-block");
    const left = el("div", "");
    // The kicker is the tab, the title is the slot inside it. Two levels of
    // where-you-are: the tab row alone was carrying both, which is why the
    // design gives the current one a heading of its own.
    left.appendChild(el("div", "kicker", tab));
    left.appendChild(el("h1", "head-title", tab === "Tasks" ? slot : tab));
    left.appendChild(el("div", "head-date", today()));
    headBlock.appendChild(left);

    const right = el("div", "head-right");
    const tools = el("div", "head-tools");
    const acct = el("button", "avatar", "\u2022\u2022");
    acct.type = "button";
    acct.title = "Account";
    acct.setAttribute("aria-label", "Account");
    acct.addEventListener("click", () => openAccount && openAccount());
    tools.appendChild(acct);
    right.appendChild(tools);
    right.appendChild(syncPill());
    headBlock.appendChild(right);
    root.appendChild(headBlock);

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
    //
    // `Now` is the design's own block and it holds what is overdue. It is a
    // grouping of the Today list, not a fourth list: the ranking already puts
    // these first, and the wash says why they are there.
    const shown = visible();
    const isLate = (c) => (c.card_reason_short || "").startsWith("Overdue");
    const late = tab === "Tasks" && slot === "Today" ? shown.filter(isLate) : [];
    const rest = shown.filter((c) => !late.includes(c));
    if (late.length) root.appendChild(drawBlock("Now", late, true));
    if (rest.length) {
      // A heading is only worth drawing when something else is drawn beside it.
      if (late.length) root.appendChild(drawBlock("Later today", rest, false));
      else {
        const rows = el("div", "rows");
        for (const card of rest) rows.appendChild(drawRow(card));
        root.appendChild(rows);
      }
    }

    if (toast) {
      const t = el("div", "toast");
      t.appendChild(el("span", "", toast));
      const u = el("button", "", "Undo");
      u.type = "button";
      u.addEventListener("click", undoLast);
      t.appendChild(u);
      root.appendChild(t);
    }

  }

  /**
   * The store's own state, in the header where the design puts it. It was a line
   * of text at the foot of the page, which is the last place a person looks and
   * the first thing they need when a task has not arrived on the other device.
   *
   * It is drawn from a remembered value and refreshed after: `sync.status()` is
   * async and this is called inside a synchronous draw. A stale word for one
   * frame beats a header that moves after the page has settled.
   */
  function syncPill() {
    const pill = el("div", "sync" + (mode === "sync" ? "" : " local"));
    pill.appendChild(el("span", "dot"));
    pill.appendChild(el("span", "", mode === "sync" ? syncWord : "on this device"));
    return pill;
  }

  async function readSync() {
    if (mode !== "sync" || !sync) return;
    const { online, waiting } = await sync.status();
    const word = waiting ? `${waiting} waiting` : online ? "synced" : "offline";
    if (word !== syncWord) { syncWord = word; draw(); }
  }

  // A task arriving from another device changes the list without anything here
  // being pressed.
  window.addEventListener("cascade:store-changed", () => { reload(); });
  narrow.addEventListener("change", draw);

  reload();
}
