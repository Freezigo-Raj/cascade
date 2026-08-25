// Cascade Part A — live search.
//
// The results appear while the line is being typed, which is the point: seeing
// the task you already wrote redirects you, where a dialog after the fact reads
// as a correction. The decision log puts 45% of real input in that bucket.
//
// Four tiers, best first. A task is placed by the highest tier it reaches and
// never appears twice. The fuzzy tier exists for transliterated names, which
// typo inconsistently: `bhati` against `bharti` is reachable no other way.
//
// **The fuzzy tier never fires the duplicate dialog.** That is a separate rule
// with its own threshold, and a fuzzy match is far too weak to interrupt anyone
// with. False positives here cost nothing, because a result is not a question.

/** Tokens of a normalised string. Empty in, empty out. */
function tokens(s) {
  return String(s || "").split(/\s+/).filter(Boolean);
}

function trigrams(text) {
  const padded = `  ${text} `;
  const out = [];
  for (let i = 0; i + 3 <= padded.length; i++) out.push(padded.slice(i, i + 3));
  return out;
}

/** Sørensen–Dice over a multiset, the same measure the duplicate rule uses. */
function diceBags(a, b) {
  const A = trigrams(a), B = trigrams(b);
  if (!A.length || !B.length) return 0;
  const counts = new Map();
  for (const g of A) counts.set(g, (counts.get(g) || 0) + 1);
  let shared = 0;
  for (const g of B) {
    const n = counts.get(g) || 0;
    if (n > 0) { shared++; counts.set(g, n - 1); }
  }
  return (2 * shared) / (A.length + B.length);
}

function diceWords(a, b) {
  const A = new Set(tokens(a)), B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of B) if (A.has(w)) shared++;
  return (2 * shared) / (A.size + B.size);
}

/**
 * The tier a stored task reaches for this query, and its score inside that
 * tier. Tier 0 means it does not surface at all.
 *
 * 1 exact, 2 prefix, 3 a shared word, 4 fuzzy above the threshold.
 */
function tierOf(query, target, threshold) {
  if (!query || !target) return { tier: 0, score: 0 };
  if (query === target) return { tier: 1, score: 1 };
  // THE PREFIX TIER IS PER WORD (session 125, his slides): `Plant` found
  // nothing while `Plants` found two, because the tier only ever compared the
  // START OF THE WHOLE TITLE. `water plants` does not begin with `plant`, so a
  // typed prefix of any word but the first fell through to the fuzzy tier and
  // usually missed it — 0.42 against a 0.5 threshold for that exact pair.
  // A word beginning with what was typed is what a person means by searching.
  if (target.startsWith(query)) return { tier: 2, score: query.length / target.length };
  if (tokens(target).some((w) => w.startsWith(query)))
    return { tier: 2, score: (query.length / target.length) * 0.9 };
  const shared = diceWords(query, target);
  if (shared > 0) return { tier: 3, score: shared };
  const fuzzy = Math.max(diceBags(query, target), shared);
  if (fuzzy >= threshold) return { tier: 4, score: fuzzy };
  return { tier: 0, score: 0 };
}

/**
 * Only open tasks are searched. A done or archived task is out of the way on
 * purpose, and searching one back into view undoes the reason it was closed.
 * `DONE` stays in the header vocabulary and draws no rows in v1.
 *
 * Nothing is capped. The panel is a small area on the capture screen and it
 * scrolls; cutting the list would hide the row being looked for and say nothing
 * about having cut it.
 */
function searchable(t) {
  // The same test `cards.js` exports as `isOpen`, written out rather than
  // imported: this file has no imports, and adding a static one would be a
  // relative import with no version, which gate2 refuses for good reason
  // (session 129). Consolidating the engine's four copies of this predicate
  // needs the engine's import style settled first, and that is a job of its
  // own — named in spec.md rather than half-done here.
  return Boolean(t) && typeof t === "object" && t.task_state === "ready" && !t.archived;
}

/**
 * The right-hand half of a result line. `due Wed`, and nothing else.
 *
 * It carried the verb and the minutes until the badge was dropped from every
 * row. Duration is the engine's to reason with and not the reader's to see, and
 * the verb without it was one word explaining nothing.
 */
export function readResultRow(task, shortPhrase) {
  return shortPhrase || "";
}

/**
 * The same four tiers, exposed for the list screen's own search box, which
 * filters the tab in place rather than opening a panel. One matcher, so the two
 * boxes cannot disagree about what counts as a match.
 */
export function matchTier(query, target, config) {
  return tierOf(String(query || "").trim(), String(target || "").trim(),
                config.search.fuzzy_threshold);
}

/**
 * @param {string} query      the typed line, normalised, so a date word in it
 *                            never becomes something to search for
 * @param {Array} existing    every stored task
 * @param {object} config     `search.fuzzy_threshold` is read here
 * @param {function} shortFor (task) => `due_phrase_short`
 * @returns {Array} `[{ group_header, rows: [{ task_id, title, result_row }] }]`
 */
export function readResults(query, existing, config, shortFor) {
  const q = String(query || "").trim();
  // No query, no panel. An empty box is not a search for everything.
  if (!q || !Array.isArray(existing)) return [];
  const threshold = config.search.fuzzy_threshold;

  const hits = [];
  for (const t of existing) {
    if (!searchable(t)) continue;
    const target = String(t.normalised || "").trim();
    const { tier, score } = tierOf(q, target, threshold);
    if (tier === 0) continue;
    hits.push({ task: t, tier, score });
  }

  // Best tier first, then the better score, then the most recently touched.
  // Nothing is capped: a query matching twenty tasks shows twenty and scrolls,
  // because a cut list hides the one you were looking for and says nothing.
  hits.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.score - a.score ||
      Date.parse(b.task.updated_at || 0) - Date.parse(a.task.updated_at || 0)
  );

  // The same routing as the lists: a date puts a task in ACTIVE, and a task
  // with none is an idea. `DONE` is drawn by nothing while only open tasks are
  // searched, and is left out rather than drawn permanently empty.
  const groups = [
    { group_header: "ACTIVE", rows: [] },
    { group_header: "IDEAS", rows: [] },
  ];
  for (const h of hits) {
    const dated = Boolean(h.task.due_at || h.task.earliest_start);
    groups[dated ? 0 : 1].rows.push({
      task_id: h.task.id,
      title: h.task.title,
      result_row: readResultRow(h.task, shortFor(h.task)),
    });
  }
  // A group with nothing in it is not drawn, and a query matching nothing draws
  // no panel at all. `(none)` was written to keep the panel from changing shape
  // under the cursor, which was a concern while the box and the list shared one
  // screen. Capture is its own screen now, and two headers over nothing is a
  // panel saying "no" twice.
  return groups.filter((g) => g.rows.length);
}
