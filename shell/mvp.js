// Cascade Part A — the app, booted and routed.
//
// The same three ways in as `boot.js`: no project runs local, a reset link opens
// the gate whatever the session says, and otherwise a session runs the app.
//
// TWO LAYOUTS, ONE SET OF SCREENS. A phone shows one screen at a time and
// navigates between them. A wide window shows the list and the capture panel at
// once, side by side, and there is nothing to navigate to — which is the whole
// difference between the two, and it lives here rather than inside a screen.
// Neither screen knows which layout it is in.
//
// Every mount returns a handle now, and this file calls `unmount()` before it
// mounts anything else. That is not tidiness. A screen's `window` listeners
// outlived the screen: emptying `#screen` took the list out of the document and
// left its closure listening, so the next sync event redrew the list over the
// top of whatever had replaced it. Typing a task and being thrown back to the
// list mid-word is what that produced.

const v = new URL(import.meta.url).search;
const { configured } = await import(`./env.js${v}`);
const { account, recoveryInUrl } = await import(`./auth.js${v}`);
const { mountGate } = await import(`./gate.js${v}`);

const app = document.getElementById("app");
const screen = document.getElementById("screen");
const aside = document.getElementById("aside");
const gateEl = document.getElementById("gate");

/** One number, in one place, and the stylesheet's `min-width` matches it. */
const WIDE = window.matchMedia("(min-width: 940px)");

let started = false;
let here = null;      // what is in `#screen`
let panel = null;     // the capture panel in `#aside`, wide layout only
let route = "list";   // where a narrow layout would be

async function put(into, mod, name, args) {
  if (into === screen) { here?.unmount?.(); here = null; }
  into.innerHTML = "";
  into.dataset.screen = name;
  const handle = mod(into, args);
  if (into === screen) here = handle;
  return handle;
}

async function showList() {
  const { mountList } = await import(`./mvp.list.js${v}`);
  route = "list";
  await put(screen, mountList, "list", { openEdit: openTask, openAccount: showAccount });
  if (WIDE.matches) await openPanel(null, { keepFocus: true });
}

/**
 * Tapping a row. On a phone this is a navigation; in a wide window it loads the
 * task into the panel that is already open beside the list, so the list stays
 * where it was and keeps its scroll, its tab and its search.
 */
async function openTask(taskId) {
  if (WIDE.matches) return openPanel(taskId, { keepFocus: false });
  const { mountEdit } = await import(`./mvp.edit.js${v}`);
  route = "edit";
  await put(screen, mountEdit, "edit", { taskId, onBack: () => showList() });
}

/**
 * `keepFocus` is the difference between the panel being opened because the list
 * was drawn and being opened because a row was pressed. The first must not take
 * the caret: a page that loads with the cursor in a text box scrolls itself to
 * that box on a phone-sized window and steals the first keystroke on a wide one.
 */
async function openPanel(taskId, { keepFocus = false } = {}) {
  const { mountEdit } = await import(`./mvp.edit.js${v}`);
  if (panel) { if (!keepFocus) panel.load(taskId); return panel; }
  aside.dataset.screen = "edit";
  aside.innerHTML = "";
  panel = mountEdit(aside, { taskId, onBack: null, inPanel: true });
  return panel;
}

function closePanel() {
  panel?.unmount?.();
  panel = null;
  aside.innerHTML = "";
}

async function showAccount() {
  const { mountAccount } = await import(`./mvp.account.js${v}`);
  route = "account";
  // The account screen takes the whole window in both layouts. It is a place you
  // go rather than a thing you work beside, and leaving the capture box open next
  // to a Sign out button offers to type into an account you are leaving.
  closePanel();
  await put(screen, mountAccount, "account", {
    onBack: () => showList(),
    onSignedOut: () => { started = false; gate(); },
  });
}

/**
 * Crossing the breakpoint mid-session. Dragging a window narrow while the panel
 * is open has to land somewhere, and the answer is the route a phone would be
 * on: the list, with the panel closed.
 */
WIDE.addEventListener("change", () => {
  if (!started) return;
  if (WIDE.matches) { if (route === "list") openPanel(null, { keepFocus: true }); }
  else { closePanel(); if (route === "list") showList(); }
});

/**
 * Three keys, and only where there is a keyboard to press them on. This is the
 * other half of "a web version": a window this size is being used with two hands,
 * and reaching for the mouse to put the caret in a box is the thing that makes a
 * stretched phone app feel like one.
 *
 * Nothing fires while a field has focus, so typing `n` into a task is typing an
 * `n`. Escape is the exception: it means "let go of this", which is only ever
 * asked from inside a field.
 */
window.addEventListener("keydown", (e) => {
  if (!started || e.metaKey || e.ctrlKey || e.altKey) return;
  const inField = /^(input|textarea)$/i.test(document.activeElement?.tagName ?? "");
  if (e.key === "Escape" && inField) { document.activeElement.blur(); return; }
  if (inField) return;
  if (e.key === "n") { e.preventDefault(); openTask(null); }
  else if (e.key === "/") { e.preventDefault(); here?.focusSearch?.(); }
});

async function start() {
  if (started) return;
  started = true;
  gateEl.style.display = "none";
  app.style.display = "";
  await showList();
}

function gate() {
  app.style.display = "none";
  closePanel();
  here?.unmount?.();
  here = null;
  gateEl.style.display = "";
  mountGate(gateEl, start);
}

if (!configured()) await start();
else if (recoveryInUrl()) gate();
else if (await account.session()) await start();
else gate();
