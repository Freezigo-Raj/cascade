// Cascade Part A — pull the list down to refresh it (session 163, his request:
// "need refresh when pulling screen from top").
//
// WHY IT IS NOT FREE. The page scrolls the DOCUMENT — `#app` has padding and
// no `overflow`, which is what lets a phone's own momentum scrolling and the
// address bar behave normally. So there is no scroll container to hang a
// native pull-to-refresh on, and the WebView provides none. The gesture is
// read here, from touch events, and the one thing that must not break is
// ordinary scrolling.
//
// THE RULES THAT KEEP IT FROM FIGHTING THE SCROLL, each of which is a way this
// kind of gesture usually goes wrong:
//
//   - It arms only at the very top. `scrollY > 0` and the finger belongs to
//     the scroll, always.
//   - It arms only on a DOWNWARD first move. A finger that goes up first is
//     scrolling, and deciding that once at the start stops the indicator
//     appearing halfway through a flick back to the top.
//   - It never touches a horizontal strip. The date chips, the push rungs and
//     the unit chips all scroll sideways; a pull starting inside one of those
//     is left alone entirely.
//   - It is dead while a dialog is open, because the thing under a dialog is
//     not what the finger is aimed at.
//   - `preventDefault` happens only AFTER it has armed, so a scroll that was
//     never a pull is never interfered with.
//
// WHAT A REFRESH IS. Everything this app can be behind on, in one press: the
// task pull and its outbox, the offers and their queue, and the block list.
// The caller supplies it; this file decides nothing about what refreshing
// means.

const v = new URL(import.meta.url).search;
const { el } = await import(`./mvp.paint.js${v}`);

/** How far to pull before it fires, and how far the indicator can travel. */
const ARM = 72;
const LIMIT = 112;

/** A touch that began inside something that scrolls sideways is not a pull. */
function inSideScroller(node) {
  for (let n = node; n && n !== document.body; n = n.parentElement) {
    // `scrollWidth` on its own, rather than an `instanceof HTMLElement` test:
    // the global is not in the lint config's browser set and the property is
    // what the question actually is.
    if (typeof n.scrollWidth !== "number") continue;
    if (n.scrollWidth > n.clientWidth + 4) return true;
  }
  return false;
}

/**
 * @param {HTMLElement} host  where the indicator is inserted, at the top
 * @param {object} on  { refresh(): Promise<string|void>, say(text) }
 */
export function mountPull(host, on) {
  const band = el("div", "pull-band");
  const word = el("div", "pull-word", "");
  band.appendChild(word);
  host.prepend(band);

  let startY = 0;
  let pulling = false;
  let armed = false;
  let busy = false;
  let shown = 0;

  const draw = (y) => {
    shown = y;
    band.style.height = `${y}px`;
    band.style.opacity = String(Math.min(1, y / ARM));
    word.textContent = busy
      ? "refreshing…"
      : y >= ARM ? "let go to refresh" : "pull to refresh";
  };

  const reset = () => {
    pulling = false;
    armed = false;
    band.style.transition = "height 180ms ease, opacity 180ms ease";
    draw(0);
    setTimeout(() => { band.style.transition = ""; }, 200);
  };

  const onStart = (e) => {
    if (busy) return;
    if (document.querySelector("[data-dialog]")) return;
    if (window.scrollY > 0) return;
    if (e.touches.length !== 1) return;
    if (inSideScroller(e.target)) return;
    startY = e.touches[0].clientY;
    pulling = true;
    armed = false;
  };

  const onMove = (e) => {
    if (!pulling || busy) return;
    const dy = e.touches[0].clientY - startY;
    // UPWARD FIRST MEANS SCROLLING, and the decision is made once.
    if (!armed && dy < 6) { if (dy < -2) pulling = false; return; }
    // Still at the top? A finger that pulled the page down past the top is the
    // only case this is for; anything else has become a scroll.
    if (window.scrollY > 0) { reset(); return; }
    armed = true;
    // RUBBER BAND, not a straight follow: the further it goes the less it
    // moves, so the limit is felt rather than hit.
    const eased = Math.min(LIMIT, dy * 0.55);
    draw(eased);
    // Only now, and only while armed: a scroll that was never a pull keeps
    // every one of its default behaviours.
    if (e.cancelable) e.preventDefault();
  };

  const onEnd = async () => {
    if (!pulling || busy) { if (!busy) reset(); return; }
    const go = armed && shown >= ARM;
    if (!go) { reset(); return; }
    busy = true;
    draw(ARM);
    try {
      const said = await on.refresh();
      if (said) on.say(said);
    } catch (e) {
      // A REFRESH THAT FAILED SAYS SO. The gesture's whole promise is that the
      // screen now shows what the server has; silence after a pull reads as
      // "nothing has changed", which is a different and untrue statement.
      on.say(`Could not refresh — ${e?.message ?? e}`);
    } finally {
      busy = false;
      reset();
    }
  };

  // `passive: false` on the move, because it is the one that may cancel. The
  // other two never do, so they stay passive and cost the scroll nothing.
  document.addEventListener("touchstart", onStart, { passive: true });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd, { passive: true });
  document.addEventListener("touchcancel", onEnd, { passive: true });

  draw(0);

  return {
    unmount() {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      band.remove();
    },
  };
}
