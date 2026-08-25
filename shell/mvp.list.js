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
const { tasks, mode, sync } = await import(`./store.select.js${v}`);
const { pushed } = await import(`./push.js${v}`);
const { matchTier } = await import(`./search.js${v}`);
const { spawn, nextDue } = await import(`./repeat.js${v}`);
const { alarmCleared } = await import(`./alarm.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { readClashes, readClashDialog, readDeadlineClashes, readDeadlineDialog } =
  await import(`./clash.js${v}`);
const { ask } = await import(`./mvp.dialog.js${v}`);
const { el } = await import(`./mvp.paint.js${v}`);
const { rowOf, blockOf } = await import(`./mvp.row.js${v}`);
const { SHELL_VERSION } = await import(`./render.js${v}`);

const TABS = ["Tasks", "Ideas", "Done"];
const SLOTS = ["Today", "Tomorrow", "Upcoming"];
// THE SCREEN SAYS `Later` WHERE THE ENGINE SAYS `Upcoming` (session 124, his
// word). The band name in every record and every rule stays `Upcoming`; only
// the two places a person reads it change.
const slotWord = (name) => (name === "Upcoming" ? "Later" : name);

// One clock for both screens, in `mvp.clock.js`. It was written here first and
// copied into screen 2, which is how two functions that have to agree begin to
// disagree.
const now = nowLocal;

// A notification is the smallest screen there is, and so is a phone. Both
// sentences come back on every call; this is the screen picking, which is the
// screen's question and not the engine's.
const narrow = window.matchMedia("(max-width: 600px)");

export function mountList(root, { openEdit, openAccount, openAlarms, onTasks } = {}) {
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
    // The rail's counts and the detail panel read from here rather than from the
    // store, so a number beside `Today` cannot disagree with the rows under it.
    onTasks && onTasks(all);
  }

  // UNDO IS GONE (session 132, his call: "remove undo and redo functions, they
  // will cause more problems in the future").
  //
  // It held one entry, restored a whole record with a fresh stamp, and every
  // write in the app had to remember to write it first. Under newest-wins that
  // restore is a full-record overwrite racing the sync, and it was already the
  // wrong shape for a store that merges: two devices, one undo slot. The press
  // it protected is now protected by the state instead — the bin cancels rather
  // than erasing, and `Revive` on the Done tab brings anything back — so the
  // one thing undo could still do that Revive cannot is unpick an edit, which
  // is a thing a person can also do by editing.
  //
  // The `undo` table and the `UndoEntry` type stay in `contract.md` and in the
  // schema. Nothing writes to them.

  async function act(id, what, index) {
    const task = all.find((t) => t.id === id);
    if (!task) return;

    if (what === "done") {
        // `alarmCleared()` rather than three fields written by hand (session
      // 125): the lock-screen Done cleared the snooze and the unanswered
      // marker and this one did not, so a task finished in the app kept a
      // snooze that outlived it and came back at the top of the list the
      // moment Undone was pressed. One function, called by everything that
      // ends or moves an alarm.
      await tasks.update(id, alarmCleared({ ...task, task_state: "done", closed_at: now(), updated_at: now() }));
      // A repeat spawns its next occurrence here and only here, so there is
      // never more than one open at a time.
      const next = spawn({ ...task, task_state: "done" }, crypto.randomUUID(), now());
      if (next) await tasks.add(next);
      say(`Done "${task.title}"`);
    } else if (what === "undone") {
      // Undoing a done takes back what the done created, so the press leaves
      // one row rather than two.
      for (const t of all) if (t.spawned_from === id) await tasks.remove(t.id);
      // A REVIVED REPEAT LANDS ON ITS NEXT SCHEDULED DATE (session 129, his
      // report: "Revive doesn't work — the task goes away and comes back").
      //
      // It was not the sync. `catchup.js` runs on every open and closes any
      // repeat the calendar has walked past, so reviving a week-old weekly task
      // put a stale occurrence back and the next open cancelled it again. The
      // press worked perfectly and was undone before he could see it.
      //
      // Reviving a repeat means the person wants it back, and a repeat only
      // exists in the future, so it comes back on the next date its own rule
      // gives. `first_due_at` goes with it: a push that moved the occurrence
      // that was closed has nothing to say about the one being reopened. A
      // one-off is reopened exactly where it was, overdue and visibly so.
      const due = nextDue(task, now());
      const back = due
        ? { due_at: due, first_due_at: null, alarm_snoozed_until: null, alarm_unanswered_at: null }
        : {};
      await tasks.update(id, {
        ...task, ...back, task_state: "ready", closed_at: null, updated_at: now(),
      });
      say(`Back "${task.title}"`);
    } else if (what === "pin") {
      await tasks.update(id, { ...task, pinned: !task.pinned, updated_at: now() });
    } else if (what === "delete") {
      // A DELETE IS A CANCELLATION (session 130, his ask: "deleted tasks should
      // also show as Cancelled in the Done tab").
      //
      // The bin used to erase the row, and a task that leaves no trace is a
      // task nobody can answer a question about: what was that thing I dropped
      // last Tuesday, and did I drop it on purpose. Cancelled says both. It is
      // also the same state the catch-up and the lock screen already write, so
      // the Done tab holds one kind of closed row and not two.
      //
      // `Revive` on the Done tab brings it back whole, which is what makes
      // this safe now that undo is gone (session 132).
      await tasks.update(id, alarmCleared({
        ...task, task_state: "cancelled", closed_at: now(), updated_at: now(),
      }));
      say(`Cancelled "${task.title}"`);
    } else if (what === "purge") {
      // THE ONE PATH THAT ERASES, and with undo gone (session 132) it is the
      // one press in this app that cannot be taken back. It is reachable only
      // from a row that is already closed and cancelled, so it takes two
      // decisions on two screens — which is the whole of its protection now,
      // and enough: without it nothing could ever leave the store, and a list
      // you cannot clean is one you stop reading.
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
      await tasks.update(id, moved);
      say(`Moved "${task.title}" to ${option.push_label.toLowerCase()}`);
    }
    await reload();
  }


  // -------------------------------------------------------------- the lists

  const cardsFor = () => listOnly(all, partAConfig, now()).cards;

  function visible() {
    const lists = listOnly(all, partAConfig, now());
    // A SEARCH IS A QUESTION ABOUT EVERYTHING NOT DONE (session 123, his
    // call). Scoped to the open slot it kept answering "not in Today" for a
    // task sitting in Upcoming, which reads as "does not exist". With text in
    // the box the pool is every band plus Ideas; Done stays out unless the
    // Done tab itself is open, because a search is for things still owed.
    const pool = filter.trim()
      ? (tab === "Done" ? lists.done : [...lists.cards, ...lists.ideas])
      : tab === "Ideas" ? lists.ideas
      : tab === "Done" ? lists.done
      : lists.cards.filter((c) => c.card_band === slot);
    if (!filter.trim()) return pool;
    // The same four tiers the capture box uses, through the same matcher, so
    // the two search boxes cannot disagree about what counts as a match.
    // Lowercased first (session 121): the matcher compares against `normalised`,
    // which is lowercase, and a phone keyboard capitalises the first letter of
    // anything — so `Pcb` scored zero against `pcb pin requirement` and search
    // never worked from a phone. The capture box never hit this because its
    // line is normalised inside the engine.
    const q = filter.trim().toLowerCase();
    const byId = new Map(all.map((t) => [t.id, t]));
    return pool.filter((c) => {
      const t = byId.get(c.card_id);
      return matchTier(q, t ? t.normalised : c.card_title, partAConfig).tier > 0;
    });
  }

  // ---------------------------------------------------------------- drawing

  // A row and a block of rows live in `mvp.row.js`; this file crossed the
  // 400-line cap building its chrome once. Everything they need is handed in,
  // so a row cannot read this screen's state behind its own back.
  const ctx = () => ({ all, tab, slot, narrow, act, say, openEdit });
  const drawRow = (card) => rowOf(card, ctx());
  const drawBlock = (name, cards, isNow) => blockOf(name, cards, isNow, ctx());

  /** `Sat 17 Aug`, the one thing the header knows that a person might not. */
  const fmtDay = (d) =>
    d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  /**
   * The date under the title belongs to the SLOT, not to the clock (session
   * 121): a tab called Tomorrow wearing today's date read as a bug. Today wears
   * today, Tomorrow wears tomorrow, Upcoming says where it starts, and Ideas
   * and Done wear nothing because neither holds dated ground.
   */
  const slotDate = () => {
    if (tab !== "Tasks") return "";
    const d = new Date();
    if (slot === "Tomorrow") d.setDate(d.getDate() + 1);
    if (slot === "Upcoming") { d.setDate(d.getDate() + 2); return `from ${fmtDay(d)}`; }
    return fmtDay(d);
  };

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
  const title = el("h1", "head-title", slotWord(slot));
  const dateLine = el("div", "head-date", slotDate());
  headLeft.append(kicker, title, dateLine);
  headBlock.appendChild(headLeft);

  const headRight = el("div", "head-right");
  const tools = el("div", "head-tools");
  const acct = el("button", "avatar", "\u2022\u2022\u2022");
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
    b.addEventListener("click", () => { tab = name; filter = ""; searchBox.value = ""; paint(); });
    bar.appendChild(b);
    return b;
  });

  // A BUTTON AFTER `Done` (session 125, his words): every alarm the app has
  // armed, on one screen. It is not a fourth tab — the rows there answer to a
  // ring rather than to a slot, and a toggle over them would have one position.
  const alarmsBtn = el("button", "tab tab-alarms", "Alarms");
  alarmsBtn.type = "button";
  alarmsBtn.title = "Every alarm";
  alarmsBtn.addEventListener("click", () => openAlarms && openAlarms());
  bar.appendChild(alarmsBtn);

  const searchBox = el("input", "search");
  searchBox.type = "search";
  searchBox.placeholder = "search all tasks";
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
    b.addEventListener("click", () => { slot = name; filter = ""; searchBox.value = ""; paint(); });
    slots.appendChild(b);
    return b;
  });

  const body = el("div", "body-list");
  const toastSlot = el("div", "toast-slot");

  // THE SAME CONTROL AS `plus`, WHERE A THUMB IS (session 119). The `+` in the
  // bar sits at the top of the screen, which is the one place a hand cannot
  // reach, and it is the most-pressed control in the app. This one floats at
  // the bottom right, above the rows, and exists only on the narrow layout —
  // the wide layouts keep the capture box on screen, so a second way in there
  // would be a control with nothing to open.
  const fab = el("button", "fab", "+");
  fab.type = "button";
  fab.title = "Capture";
  fab.setAttribute("aria-label", "Capture");
  fab.addEventListener("click", () => openEdit && openEdit(null));

  root.innerHTML = "";
  root.append(headBlock, bar, slots, body, fab, toastSlot);

  // ---------------------------------------------------------------- painting

  /** `1h 40m`, or `45m`, or nothing when a slot holds no minutes. */
  const fmtLoad = (min) => {
    if (!min) return "";
    const h = Math.floor(min / 60), m = min % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  function paint() {
    kicker.textContent = tab;
    // Recomputed rather than built once: a tab left open past midnight showed
    // yesterday's date under a list that had already rolled over.
    dateLine.textContent = slotDate();
    title.textContent = tab === "Tasks" ? slotWord(slot) : tab;
    tabButtons.forEach((b, i) => b.setAttribute("aria-selected", String(tab === TABS[i])));
    // Each slot wears its total (session 121, his call): the sum of every
    // duration it holds, the verb's guess where nobody chose one. Per-row and
    // per-target loads stay quiet as decided in session 89 — this is the one
    // place the weight of a day appears, and it is the place a person looks to
    // choose which day to open.
    const lists = listOnly(all, partAConfig, now());
    const byId = new Map(all.map((t) => [t.id, t]));
    const loadOf = (name) => fmtLoad(lists.cards
      .filter((c) => c.card_band === name)
      .reduce((sum, c) => sum + (byId.get(c.card_id)?.est_duration_min ?? 0), 0));
    slotButtons.forEach((b, i) => {
      const load = loadOf(SLOTS[i]);
      b.textContent = load ? `${slotWord(SLOTS[i])} \u00b7 ${load}` : slotWord(SLOTS[i]);
      // NO SLOT WEARS THE MARK WHILE A SEARCH IS ON (session 124): with text
      // in the box the pool is everything not done, so a lit `Today` would be
      // claiming a scope the list is not using.
      b.setAttribute("aria-pressed", String(!filter.trim() && slot === SLOTS[i]));
    });
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
      // No Undo button (session 132). The toast says what happened and goes.
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
    /** Everything the rail and the detail panel need, handed out rather than read. */
    state: () => ({ tab, slot }),
    tasks: () => all,
    go(nextTab, nextSlot) {
      tab = nextTab;
      if (nextSlot) slot = nextSlot;
      paint();
    },
    say,
    act,
    /**
     * A stored task plus the two things only a card knows: the sentence, and the
     * push targets the day's load left standing. The detail panel wants both and
     * neither is on the record.
     */
    cardFor(id) {
      const task = all.find((t) => t.id === id);
      if (!task) return null;
      const lists = listOnly(all, partAConfig, now());
      const card = [...lists.cards, ...lists.ideas, ...lists.done].find((c) => c.card_id === id);
      return { ...task, card_reason: card?.card_reason ?? "", push_options: card?.push_options ?? [] };
    },
    unmount() {
      window.removeEventListener("cascade:store-changed", onStore);
      narrow.removeEventListener("change", onNarrow);
      clearTimeout(toastTimer);
    },
  };
}
