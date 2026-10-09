// Cascade Part A — when this app looks for a newer build of itself.
//
// HIS CALL, session 155: "the app should not check for updates every time it
// opens. Once a week, and when I press the button."
//
// WHAT WAS ACTUALLY HAPPENING, because it is smaller than it sounds. Every
// module already carries `?v=<SHELL_VERSION>` and `sw.js` has served those
// cache-first since session 119: a versioned URL names immutable content, so a
// matching number means matching bytes and there is nothing to ask. ONE request
// left on every cold start — `index.html` itself, which cannot carry a version
// because it IS the address, and which `sw.js` fetches with `cache: "reload"`
// to get past the browser's own ten-minute lifetime on GitHub Pages.
//
// That one request is the whole update mechanism. A new build reaches the phone
// because the fresh `index.html` names new `?v=` addresses. Serving it from the
// cache instead is therefore the only change needed to stop checking, and it is
// also the only thing that could stop a fix arriving.
//
// THE COST, STATED RATHER THAN DISCOVERED. A defect fixed in the morning used
// to reach the phone on the next open. It now waits for the weekly check or for
// him to press the button. Eleven of the last eighteen sessions shipped a fix
// he installed the same day, so this is not a small cost — it is his to accept,
// and the button is what makes it acceptable rather than a trap.
//
// THIS FILE DECIDES WHEN, AND `sw.js` DOES IT. The interval is config, like
// every other stated number; the worker holds no policy at all and answers one
// message.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { SHELL_VERSION } = await import(`./version.js${v}`);

const WHEN_KEY = "cascade:update-checked";
const FOUND_KEY = "cascade:update-found";
const DAY = 24 * 60 * 60 * 1000;

/** When it last looked, as epoch milliseconds, or 0 for never. */
export function lastChecked() {
  try {
    return Number(window.localStorage.getItem(WHEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

/**
 * The build it found waiting, or 0.
 *
 * REMEMBERED ACROSS OPENS on purpose. He checks, a newer build is there, and
 * the app has to be closed and reopened for it to load — so the sentence saying
 * so has to survive exactly the thing it is asking him to do. Cleared when the
 * app comes back running that build.
 */
export function updateWaiting() {
  try {
    const n = Number(window.localStorage.getItem(FOUND_KEY)) || 0;
    return n > SHELL_VERSION ? n : 0;
  } catch {
    return 0;
  }
}

function remember(when, found) {
  try {
    window.localStorage.setItem(WHEN_KEY, String(when));
    if (found) window.localStorage.setItem(FOUND_KEY, String(found));
    else window.localStorage.removeItem(FOUND_KEY);
  } catch {
    // A browser refusing storage means it checks every open, which is the old
    // behaviour and is not worth throwing over.
  }
}

/** Whether a week has gone by. His number lives in config, not here. */
export function checkDue(now = Date.now()) {
  const days = partAConfig?.update?.check_days ?? 7;
  return now - lastChecked() >= days * DAY;
}

/**
 * Ask the worker to look, and say what it found.
 *
 * THE WORKER DOES THE FETCH because it owns the cache: a fetch from here would
 * land in the browser's HTTP cache and prove nothing. It answers on a
 * `MessageChannel` port rather than by broadcasting, so the button knows its
 * own answer rather than any answer.
 *
 * @returns {Promise<{ok: boolean, found: number, why?: string}>}
 */
export async function checkNow() {
  const reg = navigator.serviceWorker && (await navigator.serviceWorker.ready.catch(() => null));
  const worker = reg && (reg.active || navigator.serviceWorker.controller);
  if (!worker) return { ok: false, found: 0, why: "No service worker is running, so there is nothing to ask." };

  const answer = await new Promise((done) => {
    const ch = new MessageChannel();
    // A phone with no signal never answers, and a button that says `Checking…`
    // for ever is worse than one that says it could not.
    const bail = setTimeout(() => done({ ok: false, found: 0, why: "No answer in 15 seconds. No signal?" }), 15000);
    ch.port1.onmessage = (ev) => { clearTimeout(bail); done(ev.data || { ok: false, found: 0 }); };
    worker.postMessage({ type: "cascade:check-update" }, [ch.port2]);
  });

  // THE CLOCK MOVES EVEN ON A FAILED CHECK, deliberately. Otherwise a phone
  // that is offline for a fortnight tries on every single open, which is the
  // behaviour he asked to remove, arriving by the back door.
  remember(Date.now(), answer.found || 0);
  return answer;
}

/**
 * The weekly check, from the boot path.
 *
 * NEVER AWAITED BY ANYTHING. Session 141 is the whole reason: three awaits on
 * the boot path turned an offline launch into twenty-six seconds of blank
 * screen and then the sign-in page, with no alarm armed. Nothing this file does
 * is worth one frame of the list not being there.
 */
export function checkWeekly() {
  if (!checkDue()) return;
  // A check that cannot reach anything is not a check. `navigator.onLine` is a
  // weak signal and is used only to skip the attempt, never to claim success.
  if (navigator.onLine === false) return;
  checkNow().catch(() => {});
}
