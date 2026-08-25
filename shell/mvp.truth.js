// Cascade Part A — the loud line about the build.
//
// It left `mvp.js` in session 125, when that file crossed the 400-line cap
// adding the repeat catch-up. The seam is by concern and it is the right one:
// nothing here routes, mounts or unmounts, and nothing that does needs to know
// how a stylesheet version is read. The rule it enforces is unchanged, and so
// is every one of the four states `check_loud`-adjacent testing covered:
// agreeing and silent, stale, wide sheet missing, no stylesheet at all.
//
// `app` and `ROOMY` are handed in rather than reached for, because the two
// numbers this file compares against live in exactly one place each and a
// second copy of either is how two copies come to disagree.

const v = new URL(import.meta.url).search;
const { SHELL_VERSION } = await import(`./version.js${v}`);

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

export async function tellTheTruth(app, ROOMY) {
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

