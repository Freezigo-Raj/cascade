// Cascade Part A — Stage 3 wiring.
//
// Three joined parts and no thinking in the middle: read the input screen,
// hand it to resolve(), draw what comes back. A log line at each hand-off.
// Anything unexpected produces a visible message naming the place.

// index.html loads this file under a fresh query, and the query is passed on,
// so config.js, resolve.js and render.js are fetched fresh with it. Without
// that, three of the four files still come from cache.
const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { resolve } = await import(`./resolve.js${v}`);
const { renderDefaultList } = await import(`./render.js${v}`);
const { tasks, undo, UNDO_ID, mode, sync } = await import(`./store.select.js${v}`);
const { pushed } = await import(`./push.js${v}`);
const { matchTier } = await import(`./search.js${v}`);
const { spawn } = await import(`./repeat.js${v}`);

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const errEl = $("error");

function log(where, msg) {
  const line = `[${where}] ${msg}`;
  console.log(line);
  logEl.textContent += line + "\n";
}

function loud(where, err) {
  errEl.style.display = "block";
  errEl.textContent = `ERROR in ${where}\n\n${err && err.stack ? err.stack : err}`;
  console.error(where, err);
}

window.addEventListener("error", (e) => loud("window", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => loud("promise", e.reason));

// --- fill the fixed-set inputs from config, so nothing is written into code ---
try {
  const opts = (el, values) => {
    for (const v of values) {
      const o = document.createElement("option");
      o.value = o.textContent = v;
      el.appendChild(o);
    }
  };
  opts($("date_chip_tap"), partAConfig.chip_presets);
  // Three suggestions on the chip, the other eleven behind the advanced button.
  // Both lists come from config; the harness draws them in one control.
  opts($("type_chip_tap"), partAConfig.type_suggestions);
  opts($("type_chip_tap"), partAConfig.commitment_types.map((m) => m.id)
       .filter((id) => !partAConfig.type_suggestions.includes(id)));
  opts($("significance_tap"), partAConfig.significance_buttons.map((b) => String(b.value)));
  opts($("row_action"), ["done", "cancel", "archive", "pin", "edit", "undo"]);
  $("config_version").value = partAConfig.version;
  $("new_id").value = crypto.randomUUID();
  log("boot", `config ${partAConfig.version} loaded, ${Object.keys(partAConfig).length - 1} objects`);
} catch (e) {
  loud("app.js boot", e);
}

function readInput() {
  const orNull = (id) => ($(id).value === "" ? null : $(id).value);
  return {
    // A chip types its words into the box. The engine has no chip input; what it
    // is handed is where those words landed, so a later session can ask which
    // chips people tap and then edit away.
    typed_line: [$("typed_line").value, orNull("date_chip_tap")].filter(Boolean).join(" "),
    chip_spans: (() => {
      const typed = $("typed_line").value, chip = orNull("date_chip_tap");
      if (!chip) return [];
      const start = typed ? typed.length + 1 : 0;
      return [{ start, end: start + chip.length }];
    })(),
    type_chip_tap: orNull("type_chip_tap"),
    significance_tap: orNull("significance_tap") === null ? null : Number($("significance_tap").value),
    bound_task_id: orNull("bound_task_id"),
    row_action: orNull("row_action"),
    // Instants are stored to the second. A box typed without them is the
    // commonest way to hand `resolve()` something it refuses, so the seconds
    // are filled in here rather than guessed there.
    now: $("now").value.replace(/^(\d{4}-\d\d-\d\dT\d\d:\d\d)([+-])/, "$1:00$2"),
    new_id: $("new_id").value,
    config: partAConfig,
    // The stored tasks, handed in whole. Empty on every call the shell made
    // until this session, which is why `cards` could be a constant and nobody
    // noticed for forty sessions.
    existing_tasks: OPEN,
  };
}

/** The return shape is checked here, so breaking resolve.js is loud. */
function assertShape(out) {
  const need = (obj, path, keys) => {
    if (!obj || typeof obj !== "object") {
      throw new Error(`resolve() returned no ${path}`);
    }
    for (const k of keys) {
      if (!(k in obj)) throw new Error(`resolve() returned ${path} with no ${k}`);
    }
  };
  need(out, "result", ["task", "working", "list", "capture"]);
  need(out.list, "list", ["list_header", "sort_header", "chip_row", "cards", "ideas", "done", "results"]);
  need(out.capture, "capture", ["add_button", "input_field", "significance_row", "type_chip", "bound_task_chip", "action_row", "clash_dialog", "deadline_dialog", "duplicate_dialog"]);
  for (const [i, c] of out.list.cards.entries()) {
    need(c, `list.cards[${i}]`, ["card_title", "card_reason", "card_reason_short", "card_band"]);
  }
}

function run() {
  errEl.style.display = "none";
  logEl.textContent = "";
  let input, out;

  try {
    input = readInput();
    log("input → resolve", `typed_line=${JSON.stringify(input.typed_line)}, now=${input.now}`);
  } catch (e) { return loud("app.js readInput", e); }

  try {
    out = resolve(input);
    assertShape(out);
    log("resolve → output", `${out.list.cards.length} cards, add_button=${out.capture.add_button}`);
  } catch (e) {
    // A refusal is the engine working: the line is not a capture yet. Anything
    // else is a defect and stays loud, which is what Gate 3 was pressed for.
    if (e && e.refused) {
      $("out").textContent = "(nothing to capture yet)";
      $("fields").textContent = "";
      return log("resolve", e.message);
    }
    return loud("resolve.js", e);
  }

  try {
    // One list, chosen by the tab, then narrowed by the tab's own search box.
    // The filter runs on the same four tiers the capture screen uses, so the two
    // boxes cannot disagree about what counts as a match.
    const pool = TAB === "Ideas" ? out.list.ideas
               : TAB === "Done" ? out.list.done
               : out.list.cards.filter((c) => c.card_band === SLOT);
    const byId = new Map(OPEN.map((t) => [t.title, t]));
    const shown = !FILTER.trim() ? pool : pool.filter((c) => {
      const t = byId.get(c.card_title);
      return matchTier(FILTER, t ? t.normalised : c.card_title, partAConfig).tier > 0;
    });
    $("out").textContent = renderDefaultList(
      { ...out.list, cards: shown },
      out.capture,
      { badgeCol: 64, heading: TAB === "Tasks" ? SLOT : TAB, showSort: TAB === "Ideas" }
    );
    const esc3 = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    $("results").innerHTML = out.list.results
      .map((g) =>
        `<div style="opacity:.6">${esc3(g.group_header)}</div>` +
        g.rows.map((r) =>
          `<div data-bind="${esc3(r.task_id)}" style="cursor:pointer;margin:2px 0 2px 16px">` +
          `<code>${esc3(r.title)}</code> <span style="opacity:.6">${esc3(r.result_row)}</span></div>`).join("")
      ).join("");
    // Everything the engine returned, in columns, with each field labelled by
    // what it is expected to do and each change since the last line marked.
    //
    // NO_RULE: the contract records the field and nothing writes it yet, so it
    // must not move. NO_INPUT: it can only move on an input this screen cannot
    // supply, so a text box will never exercise it. Both lists are written here
    // rather than derived, and both are wrong the moment a rule lands, which is
    // what the `broken` label below is for: a field in NO_RULE that moves.
    const NO_RULE = new Set([
      "recurrence", "alarm_type", "alarm_lead_min", "alarm_repeat_min",
      "blocked", "blocker_reason", "blocker_ref", "project_id", "task_state",
      "archived", "pinned", "closed_at", "significance", "notes", "type_source",
      "rank_key", "decided_by", "workflow_position", "reminder_fatigue",
      "is_hard", "resolved_window", "clipped_window",
      "sort_header", "action_row", "cards",
      "significance_row", "chip_row", "add_button",
    ]);
    const NO_INPUT = new Set([
      "similarity", "numeric_variant", "duplicate_dialog",
      "type_chip", "input_field", "bound_task_chip",
      "id", "config_version", "created_at", "updated_at",
    ]);

    const show = (v) =>
      v === null || v === undefined || v === "" ? "\u2014"
      : Array.isArray(v) ? (v.length ? JSON.stringify(v) : "[]")
      : typeof v === "object" ? JSON.stringify(v)
      : String(v);
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    // What the engine understood, said once. Built from the fields, so it cannot
    // catch a field being wrong; it makes one easier to notice.
    const t = out.task, w = out.working;
    const sentence = [
      t.action_verb === "other" ? "Something it has no verb for" : `A ${t.action_verb}`,
      `, ${t.commitment_type}, ${t.est_duration_min} minutes`,
      t.context === "undetermined" ? "" : ` on the ${t.context}`,
      ". ",
      w.due_phrase ? `${w.due_phrase}` : "No date",
      t.date_firmness === "hard" ? ", and hard" : t.date_firmness === "soft" ? ", and hedged" : "",
      `. Filed under ${out.list.list_header}`,
      `. It will read \u201c${t.title}\u201d.`,
    ].join("");
    $("sentence").textContent = sentence;

    // What changed since the last line, so one word can be altered and the
    // effect read off directly.
    const flat = {};
    for (const [g, obj] of [["task", out.task], ["working", out.working],
                            ["capture", out.capture], ["list", out.list]])
      for (const [k, v] of Object.entries(obj)) flat[`${g}.${k}`] = show(v);
    const prev = window.__last || null;
    const changed = new Set();
    if (prev) for (const k of Object.keys(flat)) if (prev[k] !== flat[k]) changed.add(k);
    window.__last = flat;
    window.__lastTask = out.task;
    window.__cards = out.list.cards;
    $("clear_date").textContent = out.task.date_phrase ? `\u2713 ${out.task.date_phrase} \u2715` : "(no date read)";

    const cls = (group, k) => {
      const key = `${group}.${k}`;
      if (changed.has(key)) return NO_RULE.has(k) ? "broke" : "moved";
      if (NO_RULE.has(k)) return "norule";
      if (NO_INPUT.has(k)) return "noinput";
      return "";
    };
    const rows = (group, obj) =>
      Object.entries(obj)
        .map(([k, v]) => {
          const line = `${esc(k.padEnd(20))}${esc(show(v))}`;
          const c = cls(group, k);
          return c ? `<span class="${c}">${line}</span>` : line;
        })
        .join("\n");
    const half = (obj, which) => {
      const e = Object.entries(obj), cut = Math.ceil(e.length / 2);
      return Object.fromEntries(which === 0 ? e.slice(0, cut) : e.slice(cut));
    };
    const col = (heading, body) => `<pre class="col"><b>${esc(heading)}</b>\n${body}</pre>`;
    $("fields").innerHTML =
      col("task \u2014 37 saved, 1 of 2", rows("task", half(out.task, 0))) +
      col("task \u2014 2 of 2", rows("task", half(out.task, 1))) +
      col(`working \u2014 ${Object.keys(out.working).length} computed`, rows("working", out.working)) +
      col("capture \u2014 shown", rows("capture", out.capture)) +
      col("list \u2014 shown", rows("list", { ...out.list, cards: `${out.list.cards.length} cards`,
        results: out.list.results.map((g) => `${g.group_header}: ${g.rows.length}`).join(" | ") }));
    log("output", "drawn");
  } catch (e) { return loud("render.js", e); }
}

$("go").addEventListener("click", run);

// Live: every keystroke and every control re-resolves, so a line can be tried
// twenty ways in the time one press used to take.
for (const id of ["typed_line", "now", "date_chip_tap", "type_chip_tap",
                  "significance_tap", "bound_task_id", "row_action"]) {
  const el = $(id);
  if (!el) continue;
  let pending = null;
  const live = () => {
    clearTimeout(pending);
    pending = setTimeout(run, 80);
  };
  el.addEventListener("input", live);
  el.addEventListener("change", live);
}

// ---------------------------------------------------------------- the store
//
// Everything below goes through the four calls and never touches storage. The
// day Supabase arrives, store.js changes and this file does not.

// Read once into a variable because `resolve()` is synchronous and runs on every
// keystroke; awaiting the store inside it would make the engine async for the
// sake of the shell. The variable is refilled after every write, so the only
// window where it is wrong is between a write and its refill.
let OPEN = [];
let ALL = [];
// Which of the two lists is on screen. The engine returns both on every call;
// this is the screen's own state and never goes into resolve().
let TAB = "Tasks";     // Tasks | Ideas | Done
let SLOT = "Today";    // Today | Tomorrow | Upcoming, inside Tasks
let FILTER = "";       // the list screen's own search box

async function reload() {
  ALL = await tasks.all();
  // `existing_tasks` is every stored task, done ones included: the Done tab and
  // its search both read them, and the engine decides what each list holds.
  OPEN = ALL;
  const entry = (await undo.all())[0] ?? null;
  // The store line says where the tasks are as well as how many, because
  // "12 stored" reads the same on a machine that has been offline for a day.
  let where = tasks.persistent ? "" : " (memory only: this browser refuses storage)";
  if (mode === "sync" && sync) {
    const { online, waiting } = await sync.status();
    where = online && !waiting ? " · synced"
          : waiting ? ` · ${waiting} waiting to send`
          : " · offline";
  }
  $("storeline").textContent = `${OPEN.length} stored` + where;
  $("undoline").textContent = entry ? `Undo available: ${entry.action} on "${title(entry)}"` : "";
  drawRows(entry);
  $("toggle").textContent = `[${TAB}]  ${TAB === "Tasks" ? SLOT : ""}`;
}

const title = (entry) => entry.prior_state?.title ?? entry.task_id;

/** One row per stored task, with the three buttons the card carries. */
function drawRows(entry) {
  const esc2 = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // The push targets come back on the card, not on the task, so they are looked
  // up by id. A dateless row gets none, which is why the buttons vanish on Ideas.
  const pushes = new Map((window.__cards ?? []).map((c) => [c.card_title, c.push_options ?? []]));
  const body = ALL.map((t) => {
    const state = t.task_state !== "ready" ? ` (${t.task_state})` : t.archived ? " (archived)" : "";
    return `<div data-id="${esc2(t.id)}" style="margin:2px 0">` +
      `<code>${esc2(t.title)}</code>${esc2(state)}${t.pinned ? " \u2605" : ""} ` +
      `<button data-act="done">Done</button> ` +
      `<button data-act="pin">${t.pinned ? "Unpin" : "Pin"}</button> ` +
      `<button data-act="delete">Delete</button> ` +
      (t.task_state !== "ready" ? `<button data-act="undone">Undone</button> ` : "") +
      (pushes.get(t.title) ?? []).map((o, i) =>
        `<button data-act="push" data-i="${i}">` +
        `\u21e2 ${esc2(o.push_label)}</button> `).join("") +
      `</div>`;
  }).join("");
  $("rows").innerHTML = body + (entry ? `<p><button id="undo">Undo</button></p>` : "");
}

/** The whole record before the action, which is the only thing an undo can restore. */
async function remember(action, task) {
  await undo.remove(UNDO_ID);
  await undo.add({ id: UNDO_ID, action, task_id: task.id, prior_state: task, created_at: now() });
}

const now = () => $("now").value.replace(/^(\d{4}-\d\d-\d\dT\d\d:\d\d)([+-])/, "$1:00$2");

// Tapping the parsed-date chip clears the date. The engine says where the words
// are, the screen takes them out of the box; the date then has no way back in
// except by typing or tapping another chip, which is the one way in it has
// always had.
$("clear_date").addEventListener("click", () => {
  const line = $("typed_line").value;
  const spans = window.__lastTask?.date_spans ?? [];
  if (!spans.length) return;
  $("typed_line").value = [...spans]
    .sort((a, b) => b.start - a.start)
    .reduce((t, r) => t.slice(0, r.start) + t.slice(r.end), line)
    .replace(/\s+/g, " ")
    .trim();
  $("date_chip_tap").value = "";
  run();
});

$("toggle").addEventListener("click", () => {
  // Tabs cycle, and inside Tasks the toggle cycles too. A real screen draws all
  // of them at once; this is the harness proving the engine returns each.
  if (TAB === "Tasks" && SLOT !== "Upcoming") SLOT = SLOT === "Today" ? "Tomorrow" : "Upcoming";
  else {
    SLOT = "Today";
    TAB = TAB === "Tasks" ? "Ideas" : TAB === "Ideas" ? "Done" : "Tasks";
  }
  reload().then(run);
});

$("filter").addEventListener("input", () => { FILTER = $("filter").value; run(); });

/**
 * Add when unbound, Edit when bound. Editing re-resolves the line into a fresh
 * record and then keeps four things from the old one: its `id`, its
 * `created_at`, whether it was pinned, and what state it was in. Everything the
 * words decide is re-read, because the words are what changed.
 */
$("add").addEventListener("click", async () => {
  try {
    const out = resolve(readInput());
    const boundId = $("bound_task_id").value;
    if (boundId) {
      const old = OPEN.find((t) => t.id === boundId);
      if (!old) return log("edit", `${boundId} is not in the store`);
      await remember("edit", old);
      // A title has no date words in it, so re-reading one finds none. Clearing
      // the date on that evidence would destroy it on every edit of every task.
      const keepDate = out.task.date_precision === "none"
        ? { due_at: old.due_at, earliest_start: old.earliest_start, has_time: old.has_time,
            date_phrase: old.date_phrase, date_spans: old.date_spans, date_marker: old.date_marker,
            date_precision: old.date_precision, date_anchor: old.date_anchor,
            date_firmness: old.date_firmness, date_hedge: old.date_hedge }
        : {};
      await tasks.update(boundId, {
        ...out.task,
        ...keepDate,
        push_count: old.push_count ?? 0,
        first_due_at: old.first_due_at ?? null,
        id: old.id,
        created_at: old.created_at,
        pinned: old.pinned,
        task_state: old.task_state,
        closed_at: old.closed_at,
        archived: old.archived,
        updated_at: now(),
      });
      // Saving leaves the bound state, which is one of the three ways out.
      $("bound_task_id").value = "";
      $("typed_line").value = "";
      await reload();
      return run();
    }
    // Steps 2 and 3 of the duplicate rule already ran inside resolve(). The
    // dialog fires here and only here: while typing it would appear and vanish
    // under the next keystroke.
    if (out.capture.duplicate_dialog && !window.confirm(`${out.capture.duplicate_dialog}\n\nOK adds it anyway.`)) {
      return; // Cancel leaves the typed text where it is, to be edited.
    }
    await tasks.add(out.task);
    await undo.remove(UNDO_ID);
    await undo.add({ id: UNDO_ID, action: "create", task_id: out.task.id, prior_state: null, created_at: now() });
    $("typed_line").value = "";
    $("date_chip_tap").value = "";
    $("type_chip_tap").value = "";
    $("significance_tap").value = "";
    $("new_id").value = crypto.randomUUID();
    await reload();
    run();
  } catch (e) {
    if (e && e.refused) return log("add", e.message);
    loud("app.js add", e);
  }
});

// Tapping a result binds that task for editing, which is the only way in.
// Every other path risks editing a task while believing you are capturing one.
$("results").addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-bind]");
  if (!el) return;
  const task = OPEN.find((t) => t.id === el.dataset.bind);
  if (!task) return;
  $("bound_task_id").value = task.id;
  // The title, never `raw_text`. Once a task is added its typed line is gone
  // from the screen; the words on the edit screen are the ones on the list.
  $("typed_line").value = task.title;
  run();
});

$("rows").addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button");
  if (!btn) return;
  try {
    if (btn.id === "undo") {
      const entry = (await undo.all())[0];
      if (!entry) return;
      if (entry.action === "create") await tasks.remove(entry.task_id);
      else if (entry.prior_state) {
        // Restoring is an update when the task is still there and an add when
        // it is not. It was a delete followed by an add for both, which is only
        // right for the delete: the pair is not atomic, so a connection lost
        // between the two left the task gone from the server with its return
        // sitting in a queue, and every other device saw an ordinary edit
        // arrive as a delete and then an insert.
        //
        // The restored record carries a fresh `updated_at` rather than the one
        // it had. Undo is a change made now — a press, a moment ago — and under
        // newest-wins a change made now is the one that should stand. The old
        // stamp would also have been refused by the trigger, silently, on any
        // task that had been touched since. `prior_state` is still a whole
        // record; this is the one field of it that is not restored.
        const back = { ...entry.prior_state, updated_at: now() };
        if (ALL.some((t) => t.id === entry.task_id)) await tasks.update(entry.task_id, back);
        else await tasks.add(back);
      }
      await undo.remove(UNDO_ID);
      return reload().then(run);
    }
    const id = btn.closest("[data-id]")?.dataset.id;
    const task = OPEN.find((t) => t.id === id);
    if (!task) return;
    const act = btn.dataset.act;
    await remember(act, task);
    if (act === "push") {
      const opts = (window.__cards ?? []).find((c) => c.card_title === task.title)?.push_options ?? [];
      const opt = opts[Number(btn.dataset.i)];
      if (!opt) return;
      await tasks.update(id, pushed(task, opt.push_to, now()));
    }
    else if (act === "delete") await tasks.remove(id);
    else if (act === "undone") {
      // Undoing a done takes back what the done created. Without this the press
      // leaves two rows: the one that came back and the one that was spawned.
      for (const t of ALL) if (t.spawned_from === id) await tasks.remove(t.id);
      await tasks.update(id, { ...task, task_state: "ready", closed_at: null, updated_at: now() });
    }
    else if (act === "done") {
      await tasks.update(id, { ...task, task_state: "done", closed_at: now(), updated_at: now() });
      // A repeat spawns its next occurrence here and only here, so there is
      // never more than one open at a time.
      const next = spawn({ ...task, task_state: "done" }, crypto.randomUUID(), now());
      if (next) await tasks.add(next);
    }
    else if (act === "pin") await tasks.update(id, { ...task, pinned: !task.pinned, updated_at: now() });
    await reload();
    run();
  } catch (e) { loud("app.js row action", e); }
});

// A task arriving from another device changes the list without anything here
// being pressed, so the redraw is hung on the store's own event rather than on
// a call site. `store.js` never fires it and the local shell never listens.
window.addEventListener("cascade:store-changed", () => { reload().then(run); });

await reload();
run();
