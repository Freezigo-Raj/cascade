// Cascade Part A — a press is a press, and a drag is a scroll.
//
// Session 124 put a guard on the push ladder alone: touch only, the Y axis
// only, no time bound. His session-125 slide says it is still firing by
// mistake, and the ladder was never the only scroller — the date column, the
// times row and every chip group in the panel scroll too and had nothing.
//
// So the rule lives once, here, and every scrolling strip wears it.
//
// THREE TESTS, and a press has to pass all three:
//   moved   — more than `slop` on EITHER axis is a drag. A ladder scrolls
//             vertically and a chip row scrolls sideways, so one axis was
//             never enough.
//   held    — a touch held longer than `hold` is a person deciding, and the
//             momentum of a flick that ends on a rung is exactly what an
//             ordinary click looks like afterwards. His words: "the selection
//             should only happen if a click lasts less than a few
//             milliseconds, otherwise scroll."
//   pointer — a keyboard press arrives as a click with no pointer before it,
//             and that one is always allowed. A mouse is not held to the time
//             test either: a slow deliberate click with a mouse is still a
//             click, and a mouse does not carry a strip along with it.
//
// `hold` is 600ms rather than "a few milliseconds", which nothing physical
// could pass: a deliberate thumb tap runs 80–200ms, a scroll that ends in a
// rest runs longer. That number is mine and it is the one to move if a real
// press is still being eaten.

const SLOP = 8;
const HOLD = 600;

/**
 * @param {HTMLElement} strip  the scrolling container; every press inside it
 *                             is judged, so it is bound once and covers every
 *                             control the container will ever hold.
 */
export function tapGuard(strip, { slop = SLOP, hold = HOLD } = {}) {
  let x = 0, y = 0, t = 0, kind = "", live = false, swallow = false;

  strip.addEventListener("pointerdown", (ev) => {
    x = ev.clientX; y = ev.clientY; t = Date.now();
    kind = ev.pointerType || "mouse";
    live = true; swallow = false;
  }, { passive: true });

  strip.addEventListener("pointermove", (ev) => {
    if (!live) return;
    if (Math.abs(ev.clientX - x) > slop || Math.abs(ev.clientY - y) > slop) swallow = true;
  }, { passive: true });

  strip.addEventListener("pointerup", (ev) => {
    if (!live) return;
    // A touch that lingered is a scroll that came to rest, not a press.
    if (kind !== "mouse" && Date.now() - t > hold) swallow = true;
    live = false;
  }, { passive: true });

  strip.addEventListener("pointercancel", () => { live = false; swallow = true; }, { passive: true });

  // Capture, so the rung's own listener never hears it.
  strip.addEventListener("click", (ev) => {
    if (!swallow) return;
    swallow = false;
    ev.stopPropagation();
    ev.preventDefault();
  }, true);
}
