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
const { SHELL_VERSION } = await import(`./render.js${v}`);

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
  showList();
});

async function showList() {
  const { mountList } = await import(`./mvp.list.js${v}`);
  route = "list";
  mark("list", false);
  await put(screen, mountList, "list", {
    openEdit: openTask,
    openAccount: showAccount,
    onTasks: (tasks) => { bar?.setTasks(tasks); detail?.draw(); },
    onGo: null,
  });
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
  await put(screen, mountEdit, "edit", { taskId, onBack: () => history.back() });
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
/**
 * THE STYLESHEET REPAIRS ITSELF BEFORE ANYTHING IS SAID ABOUT IT.
 *
 * `index.html` is the only file in this app carrying no cache-buster of its own.
 * Everything it loads is versioned and it is not, so a browser that has the page
 * cached serves an OLD index.html, whose `<link>` still points at the previous
 * version of the stylesheet, while `mvp.js` is imported under a timestamp and is
 * always fresh. New JavaScript, old HTML, old CSS, and the version behind is
 * always exactly one. That is the shape it showed twice: v29 against v30, then
 * v30 against v31. Closing the app cannot fix it, because nothing ever asks for
 * a new copy of the page.
 *
 * FOURTH APPEARANCE of the cache defect and the first fix that does not depend
 * on remembering something. Sessions 96, 98 and 105 each added a `?v=` to a
 * thing that had been missed. The page itself cannot carry one, so the app sets
 * the link's version from `SHELL_VERSION` instead: the number lives in the code
 * that reads it, and a stale page corrects itself on the next paint.
 *
 * What remains loud is the case this cannot repair: the stylesheet fetched AT
 * the right version still saying the wrong one, which means the repository is
 * disagreeing with itself rather than the browser being behind.
 */
function readCssVersion() {
  const style = getComputedStyle(document.documentElement);
  return {
    css: Number(style.getPropertyValue("--css-version").trim() || 0),
    wide: style.getPropertyValue("--wide").trim() === "1",
  };
}

/** Re-point the sheet at this build. Resolves when the new one has painted. */
function refetchStylesheet() {
  const link = document.querySelector('link[rel="stylesheet"][href*="mvp.edit.css"]');
  if (!link) return Promise.resolve(false);
  const href = link.getAttribute("href").split("?")[0] + `?v=${SHELL_VERSION}`;
  if (link.getAttribute("href") === href) return Promise.resolve(false);
  return new Promise((done) => {
    const fresh = link.cloneNode();
    fresh.setAttribute("href", href);
    // The old sheet stays until the new one has loaded, so the screen never
    // flashes unstyled on the way through.
    fresh.addEventListener("load", () => { link.remove(); done(true); }, { once: true });
    fresh.addEventListener("error", () => { fresh.remove(); done(false); }, { once: true });
    link.parentNode.insertBefore(fresh, link.nextSibling);
  });
}

async function tellTheTruth() {
  let { css, wide } = readCssVersion();
  // One repair attempt, and only when the sheet is behind. A sheet that is
  // absent entirely is a different fault and re-pointing a link that is not
  // there fixes nothing.
  if (css && css !== SHELL_VERSION && await refetchStylesheet()) {
    ({ css, wide } = readCssVersion());
  }
  const say = [];
  if (!css) say.push("No stylesheet loaded at all.");
  else if (css !== SHELL_VERSION) say.push(`Stylesheet is v${css}, app is v${SHELL_VERSION}, and refetching it at v${SHELL_VERSION} still returned v${css}. That is the repository disagreeing with itself, not your browser.`);
  if (css === SHELL_VERSION && ROOMY.matches && !wide) say.push("The wide layout stylesheet did not load, so this is the phone layout in a large window.");
  const old = document.getElementById("truth");
  if (old) old.remove();
  if (!say.length) return;
  const strip = document.createElement("div");
  strip.id = "truth";
  strip.className = "truth";
  strip.textContent = say.join(" ");
  app.prepend(strip);
}

async function start() {
  if (started) return;
  started = true;
  gateEl.style.display = "none";
  app.style.display = "";
  whoEmail = (await account.current())?.email ?? "";
  await showList();
  await tellTheTruth();
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
