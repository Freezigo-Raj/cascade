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
const rail = document.getElementById("rail");
const capture = document.getElementById("capture");
const screen = document.getElementById("screen");
const aside = document.getElementById("aside");
const gateEl = document.getElementById("gate");

/**
 * TWO numbers, and each is stated in one stylesheet and here.
 *
 * `ROOMY` (940) is where the capture box moves above the list instead of being a
 * screen you navigate to. `WIDE` (1180) is where the rail and the detail panel
 * appear, because those need a first and a third column. CSS cannot decide
 * whether a row press navigates, loads a box, or selects into a panel, so the
 * numbers live in both places and must agree: `mvp.wide.css` holds 940 and
 * `mvp.web.css` holds 1180.
 */
const ROOMY = window.matchMedia("(min-width: 940px)");
const WIDE = window.matchMedia("(min-width: 1180px)");

let started = false;
let here = null;      // what is in `#screen`
let panel = null;     // the capture box, in `#capture` on wide
let bar = null;       // the left rail, wide only
let detail = null;    // the selected task, in `#aside`, wide only
let picked = null;    // the task id the detail panel is showing
let route = "list";   // where a narrow layout would be
// A word the next list mount should say. An add on the narrow layout now
// returns to the list (session 125), and the toast it drew belonged to the
// screen it just left — so the message travels rather than the screen staying
// open to hold it. The undo entry outlives both either way.
let pending = null;

async function put(into, mod, name, args) {
  if (into === screen) { here?.unmount?.(); here = null; }
  into.innerHTML = "";
  into.dataset.screen = name;
  const handle = mod(into, args);
  if (into === screen) here = handle;
  return handle;
}

/**
 * THE PHONE'S OWN BACK, and it is the only back that is always in reach.
 *
 * A drawn Back button lives at the top of a screen, which is the one place a
 * thumb cannot get to on a tall phone, and it scrolls away the moment a screen
 * is longer than the window. The system gesture has neither problem: it is the
 * same swipe on every app on the phone, it works from anywhere on the screen,
 * and it is what a person already reaches for.
 *
 * The list is the base state and every navigation away pushes one entry, so a
 * back from the list has nothing left and Android closes the app, which is the
 * right answer there. The drawn Back stays as well: two ways out is not two
 * controls disagreeing, because both do the same single thing.
 */
function mark(name, push) {
  const state = { screen: name };
  if (push) history.pushState(state, "");
  else history.replaceState(state, "");
}

window.addEventListener("popstate", (e) => {
  // Whatever the phone went back to. An unknown state is the list, because an
  // entry this app did not write is one it cannot restore.
  const name = e.state?.screen ?? "list";
  if (name === "list") { showList(); return; }
  if (name === "account") { showAccount(); return; }
  if (name === "alarms") { showAlarms(); return; }
  showList();
});

/**
 * THE ANDROID SHELL ASKS THIS BEFORE IT DOES ANYTHING WITH A BACK GESTURE.
 *
 * `popstate` is enough in a browser. Inside a WebView the gesture reaches the
 * activity first, and what happens there is the shell's default rather than a
 * decision this app made: history entries added with `pushState` are same-page,
 * and whether the WebView counts them as somewhere to go back to varies. That is
 * a thing to be told rather than guessed at, so `MainActivity` calls this and
 * acts on the answer.
 *
 * Returns true when the app handled it, and the gesture stops there. False means
 * there is nothing left to go back to and Android should close the app, which is
 * the right answer on the list.
 */
window.__cascadeBack = () => {
  // A dialog first: it is the nearest thing on the screen and the thing a back
  // gesture is most likely aimed at.
  const dialog = document.querySelector("[data-dialog] [data-cancel]");
  if (dialog) { dialog.click(); return true; }
  if (route === "list") return false;
  history.back();
  return true;
};

async function showList() {
  const { mountList } = await import(`./mvp.list.js${v}`);
  route = "list";
  mark("list", false);
  const list = await put(screen, mountList, "list", {
    openEdit: openTask,
    openAccount: showAccount,
    openAlarms: showAlarms,
    onTasks: (tasks) => { bar?.setTasks(tasks); detail?.draw(); },
    onGo: null,
  });
  if (pending) { list?.say?.(pending); pending = null; }
  if (ROOMY.matches) await openPanel(null, { keepFocus: true });
  if (WIDE.matches) await wideFrame();
}

/**
 * The three panes. The rail and the detail panel exist only here: a phone has one
 * screen's worth of room and both of them are things you look at while doing
 * something else, which is what a second and third column are for.
 */
async function wideFrame() {
  const [{ mountRail }, { mountDetail }] = await Promise.all([
    import(`./mvp.rail.js${v}`),
    import(`./mvp.detail.js${v}`),
  ]);
  if (!bar) {
    bar = mountRail(rail, {
      tab: () => here?.state?.().tab,
      slot: () => here?.state?.().slot,
      go: (tab, slot) => here?.go?.(tab, slot),
      capture: () => openPanel(null),
      openAccount: showAccount,
      email: () => whoEmail,
      say: (text) => here?.say?.(text),
    });
  }
  if (!detail) {
    detail = mountDetail(aside, {
      task: () => (picked ? here?.cardFor?.(picked) : null),
      act: (what, index) => here?.act?.(picked, what, index),
      edit: (id) => openPanel(id),
      close: () => { picked = null; detail.draw(); },
      say: (text) => here?.say?.(text),
    });
  }
  bar.setTasks(here?.tasks?.() ?? []);
  detail.draw();
}

/**
 * Tapping a row. On a phone it is a navigation. In the wide layout it SELECTS:
 * the detail panel on the right fills, the list keeps its scroll and its tab, and
 * the capture box above it is left alone — because a row press is "show me this"
 * and the box is for the thing you have not written down yet. `Edit` in the detail
 * panel is what puts the words back in the box.
 */
async function openTask(taskId) {
  // Three columns: a press SELECTS, and the detail panel on the right fills.
  if (WIDE.matches) { picked = taskId; detail?.draw(); return; }
  // Two columns and no detail panel: a press loads the box above the list, which
  // is the only place the task can be shown at that width.
  if (ROOMY.matches) return openPanel(taskId);
  const { mountEdit } = await import(`./mvp.edit.js${v}`);
  route = "edit";
  mark("edit", true);
  // `onBack` unwinds through the phone's own history rather than jumping to the
  // list, so the drawn button and the gesture cannot end up one entry apart.
  await put(screen, mountEdit, "edit", {
    taskId,
    // The message an add wants to leave behind travels with the back.
    onBack: (msg) => { pending = msg || null; history.back(); },
  });
}

/**
 * `keepFocus` is the difference between the box being drawn because the page was
 * and being asked for. The first must not take the caret: a page that loads with
 * the cursor in a text box steals the first keystroke.
 */
async function openPanel(taskId, { keepFocus = false } = {}) {
  const { mountEdit } = await import(`./mvp.edit.js${v}`);
  if (panel) { if (!keepFocus) panel.load(taskId); return panel; }
  capture.dataset.screen = "edit";
  capture.innerHTML = "";
  panel = mountEdit(capture, { taskId, onBack: null, inPanel: true });
  return panel;
}

function closeWide() {
  panel?.unmount?.(); panel = null; capture.innerHTML = "";
  bar?.unmount?.(); bar = null; rail.innerHTML = "";
  detail?.unmount?.(); detail = null; aside.innerHTML = "";
  picked = null;
}

/**
 * Screen 4. It takes the whole window in both layouts, for the same reason the
 * account does: it is a place you go to settle something, not a thing you work
 * beside, and every control on it changes a task the list is showing.
 */
async function showAlarms() {
  const { mountAlarms } = await import(`./mvp.alarms.js${v}`);
  route = "alarms";
  mark("alarms", true);
  closeWide();
  await put(screen, mountAlarms, "alarms", {
    onBack: () => history.back(),
    // Straight to the editor, pushed over this screen, so a back from there
    // lands on the alarms again rather than on the list.
    openEdit: (id) => openTask(id),
  });
}

async function showAccount() {
  const { mountAccount } = await import(`./mvp.account.js${v}`);
  route = "account";
  mark("account", true);
  // The account screen takes the whole window in both layouts. It is a place you
  // go rather than a thing you work beside, and leaving the capture box open next
  // to a Sign out button offers to type into an account you are leaving.
  closeWide();
  await put(screen, mountAccount, "account", {
    onBack: () => history.back(),
    onSignedOut: () => { started = false; gate(); },
  });
}

/**
 * Crossing the breakpoint mid-session. Dragging a window narrow while the panel
 * is open has to land somewhere, and the answer is the route a phone would be
 * on: the list, with the panel closed.
 */
/**
 * Crossing a breakpoint mid-session lands on the route a smaller window would be
 * on: the list, with whatever that width does not have room for closed. Dragging a
 * window narrow with three columns open has to land somewhere.
 */
const settle = () => {
  if (!started) return;
  if (route !== "list") return;
  closeWide();
  showList();
};
WIDE.addEventListener("change", settle);
ROOMY.addEventListener("change", settle);

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

/**
 * WHAT ARRIVED, SAID OUT LOUD.
 *
 * Three sessions have now been spent working out whether a change had reached the
 * browser or reached it and looked wrong. The stylesheet states its own version
 * in `--css-version` and the wide layout sets `--wide`; this reads both and puts
 * a line at the top of the screen when either disagrees with what the modules
 * think. A stale stylesheet used to be invisible. Now it names itself.
 *
 * It draws nothing when everything agrees, which is the normal case.
 */
async function start() {
  if (started) return;
  started = true;
  gateEl.style.display = "none";
  app.style.display = "";
  whoEmail = (await account.current())?.email ?? "";
  // BEFORE THE LIST IS DRAWN AND BEFORE THE ALARMS ARE ARMED (session 125, his
  // call). A repeat the calendar walked past is closed as cancelled and its
  // next scheduled occurrence is spawned, so the list shows the row that is
  // actually next and the arming pass has a future instant to arm against.
  // Silent on purpose: nothing was asked for, so nothing is announced, and the
  // cancelled row is on the Done tab for anyone who looks.
  try {
    const { catchUpRepeats } = await import(`./catchup.js${v}`);
    const { tasks } = await import(`./store.select.js${v}`);
    await catchUpRepeats(tasks);
  } catch (e) {
    console.warn("catchup:", e?.message ?? e);
  }
  await showList();
  // The build's own honesty check, in `mvp.truth.js` since session 125. It is
  // handed the root and the breakpoint rather than reaching for them: this
  // file owns both.
  try {
    const { tellTheTruth } = await import(`./mvp.truth.js${v}`);
    await tellTheTruth(app, ROOMY);
  } catch (e) {
    console.warn("truth:", e?.message ?? e);
  }
  // The alarms, last. Off the Android shell every call in here is a no-op, so
  // this line is the whole of what the web app knows about ringing. It runs
  // after the list because the first thing it does is drain presses that
  // happened while the WebView was dead, and those are writes to the store.
  try {
    const { initAlarms } = await import(`./alarm.bridge.js${v}`);
    await initAlarms();
  } catch (e) {
    // An alarm that cannot arm is not a reason for a blank screen.
    console.warn("alarm: not started —", e?.message ?? e);
  }
}

let whoEmail = "";

function gate() {
  app.style.display = "none";
  closeWide();
  here?.unmount?.();
  here = null;
  gateEl.style.display = "";
  mountGate(gateEl, start);
}

if (!configured()) await start();
else if (recoveryInUrl()) gate();
else if (await account.session()) await start();
else gate();
