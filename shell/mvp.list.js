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
const { rowOf, blockOf } = await import(`./mvp.row.js${v}`);
const { SHELL_VERSION } = await import(`./render.js${v}`);

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

  // A row and a block of rows live in `mvp.row.js`; this file crossed the
  // 400-line cap building its chrome once. Everything they need is handed in,
  // so a row cannot read this screen's state behind its own back.
  const ctx = () => ({ all, tab, narrow, act, say, openEdit });
  const drawRow = (card) => rowOf(card, ctx());
  const drawBlock = (name, cards, isNow) => blockOf(name, cards, isNow, ctx());

  /** `Sat 17 Aug`, the one thing the header knows that a person might not. */
  const today = () =>
    new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  // ------------------------------------------------------------- the skeleton
  //
  // BUILT ONCE AND NEVER REDRAWN, which is the rule screen 2's capture box has
  // had since session 99 and this screen did not. `draw()` emptied `root` and
  // rebuilt the search input on every keystroke, so the element being typed into
  // was destroyed and replaced after the first letter. It called `focus()` on the
  // old node afterwards, which is detached by then and focuses nothing. One
  // letter, then the caret gone: exactly what a rebuilt input does.
  //
  // So the chrome is made here, once: the header, the tab row, the search box,
  // the toggle. `paint()` changes their text and their state and never their
  // identity. Only the list itself and the toast are rebuilt, and nothing in
  // either can hold a caret.

  const headBlock = el("div", "head-block");
  const headLeft = el("div", "");
  const kicker = el("div", "kicker", tab);
  const title = el("h1", "head-title", slot);
  const dateLine = el("div", "head-date", today());
  headLeft.append(kicker, title, dateLine);
  headBlock.appendChild(headLeft);

  const headRight = el("div", "head-right");
  const tools = el("div", "head-tools");
  const acct = el("button", "avatar", "\u2022\u2022");
  acct.type = "button";
  acct.title = "Account";
  acct.setAttribute("aria-label", "Account");
  acct.addEventListener("click", () => openAccount && openAccount());
  tools.appendChild(acct);
  const syncSlot = el("div", "sync-slot");
  // Always on screen. Asking "did my push arrive" should not need a second press.
  headRight.append(tools, syncSlot, el("div", "build", `build ${SHELL_VERSION}`));
  headBlock.appendChild(headRight);

  const bar = el("div", "bar");
  const tabButtons = TABS.map((name) => {
    const b = el("button", "tab", name);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => { tab = name; paint(); });
    bar.appendChild(b);
    return b;
  });

  const searchBox = el("input", "search");
  searchBox.type = "search";
  searchBox.placeholder = "search";
  // No `draw()` and no `focus()`. The box keeps its own value and its own caret
  // because it is the same element it was a keystroke ago.
  searchBox.addEventListener("input", () => { filter = searchBox.value; paint(); });
  bar.appendChild(searchBox);

  // Opens screen 2 empty. It is the only control on this screen that is not
  // about a row that already exists. On a phone it navigates; in the wide layout
  // it unbinds the panel that is already open and puts the caret in it.
  const plus = el("button", "plus", "+");
  plus.type = "button";
  plus.title = "Capture";
  plus.addEventListener("click", () => openEdit && openEdit(null));
  bar.appendChild(plus);

  // The toggle lives inside Tasks and nowhere else. Ideas and Done are one list
  // each and a toggle over them would be a control with one position. It is built
  // here and hidden rather than built conditionally, so the tab row above it does
  // not move when a tab changes.
  const slots = el("div", "slots");
  const slotButtons = SLOTS.map((name) => {
    const b = el("button", "slot", name);
    b.type = "button";
    b.addEventListener("click", () => { slot = name; paint(); });
    slots.appendChild(b);
    return b;
  });

  const body = el("div", "body-list");
  const toastSlot = el("div", "toast-slot");
  root.innerHTML = "";
  root.append(headBlock, bar, slots, body, toastSlot);

  // ---------------------------------------------------------------- painting

  function paint() {
    kicker.textContent = tab;
    // Recomputed rather than built once: a tab left open past midnight showed
    // yesterday's date under a list that had already rolled over.
    dateLine.textContent = today();
    title.textContent = tab === "Tasks" ? slot : tab;
    tabButtons.forEach((b, i) => b.setAttribute("aria-selected", String(tab === TABS[i])));
    slotButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(slot === SLOTS[i])));
    slots.style.display = tab === "Tasks" ? "" : "none";
    if (searchBox.value !== filter) searchBox.value = filter;

    syncSlot.innerHTML = "";
    syncSlot.appendChild(syncPill());

    // With nothing stored the screen shows nothing. No message, no illustration,
    // no prompt. An empty list is not a problem to explain.
    //
    // `Now` is the design's own block and it holds what is overdue. It is a
    // grouping of the Today list, not a fourth list: the ranking already puts
    // these first, and the wash says why they are there.
    body.innerHTML = "";
    const shown = visible();
    const isLate = (c) => (c.card_reason_short || "").startsWith("Overdue");
    const late = tab === "Tasks" && slot === "Today" ? shown.filter(isLate) : [];
    const rest = shown.filter((c) => !late.includes(c));
    if (late.length) body.appendChild(drawBlock("Now", late, true));
    if (rest.length) {
      // A heading is only worth drawing when something else is drawn beside it.
      if (late.length) body.appendChild(drawBlock("Later today", rest, false));
      else {
        const rows = el("div", "rows");
        for (const card of rest) rows.appendChild(drawRow(card));
        body.appendChild(rows);
      }
    }

    toastSlot.innerHTML = "";
    if (toast) {
      const t = el("div", "toast");
      t.appendChild(el("span", "", toast));
      const u = el("button", "", "Undo");
      u.type = "button";
      u.addEventListener("click", undoLast);
      t.appendChild(u);
      toastSlot.appendChild(t);
    }
  }

  // Every caller said `draw()` before the skeleton existed. One name, one job.
  const draw = paint;

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
  // BOTH LISTENERS ARE RETURNED, and that is a defect fix rather than tidiness.
  //
  // They were registered on `window` and never removed. Mounting screen 2 empties
  // `#screen`, which takes the list out of the document and leaves this closure
  // alive and still listening. The next sync event — a realtime message, or the
  // sixty-second pull — called `reload()`, which called `draw()`, which wrote the
  // list straight back into the element screen 2 was using. Typing a task and
  // being returned to the list mid-word is exactly what that produces, and every
  // navigation added another listener that would do it again.
  const onStore = () => { reload(); };
  const onNarrow = () => draw();
  window.addEventListener("cascade:store-changed", onStore);
  narrow.addEventListener("change", onNarrow);

  reload();

  return {
    /** For `/` in the wide layout. A pointer has a keyboard beside it. */
    focusSearch() { searchBox?.focus(); },
    unmount() {
      window.removeEventListener("cascade:store-changed", onStore);
      narrow.removeEventListener("change", onNarrow);
      clearTimeout(toastTimer);
    },
  };
}
