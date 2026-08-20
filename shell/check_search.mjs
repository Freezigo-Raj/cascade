// Cascade — the search tiers, checked.
//
// WHY THIS FILE EXISTS. No key case names `results` and none ever could: the
// key runs `resolve()` over a typed line, and a search tier is a comparison
// between that line and STORED tasks. The largest untested surface in this
// project has been named in spec.md since session 96 — cards, ideas, done,
// rank_key, results, push_options, the dialogs — and every defect a person has
// found by running the app has been inside it. `check_alarm.mjs` took the first
// bite of it in session 111. This takes the second.
//
// The defect that produced it (session 125, his slides): typing `Plant` found
// nothing while `Plants` found two tasks called `Water plants`. The prefix tier
// compared against the START OF THE WHOLE TITLE, so a prefix of any word but
// the first fell through to the fuzzy tier — and `plant` against `water plants`
// scores 0.42 on a 0.5 threshold, which is a miss by four hundredths.
//
// Run: node shell/check_search.mjs

import { partAConfig as config } from "./config.js";
import { matchTier } from "./search.js";

let bad = 0;
const say = (ok, what) => {
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
};

const tier = (q, t) => matchTier(q, t, config).tier;

// THE CASE FROM THE SLIDE, both halves.
say(tier("plant", "water plants") === 2, "a prefix of the SECOND word matches");
say(tier("plants", "water plants") === 2, "the fuller prefix matches on the same tier");
say(tier("pcb", "pcb pin requirement") === 2, "a prefix of the first word still matches");

// The tiers above and below it are untouched.
say(tier("water plants", "water plants") === 1, "exact stays tier 1");
say(tier("water the plants", "water plants") === 3, "a shared word stays tier 3");
say(tier("bhati", "bharti") === 4, "the fuzzy tier still reaches a transliteration");
// AND ITS LIMIT, recorded rather than smoothed over: the tier compares whole
// strings, so the same misspelling inside a longer title is out of reach —
// `bhati` against `bharti enterprises` scores below the threshold and always
// did. The word-prefix tier does not help here, because a misspelling is not a
// prefix. Named so a later session knows it is a decision and not a miss.
say(tier("bhati", "bharti enterprises") === 0, "a misspelling inside a longer title is still out of reach");
say(tier("xylophone", "water plants") === 0, "nothing matching still matches nothing");

// A WORD PREFIX SORTS BELOW A WHOLE-TITLE PREFIX, which is what the 0.9 factor
// on the score is for: `water` opening the title is a better answer to `wat`
// than `water` sitting inside another one.
const head = matchTier("wat", "water plants", config);
const tail = matchTier("wat", "plants water", config);
say(head.tier === 2 && tail.tier === 2, "both reach the prefix tier");
say(head.score > tail.score, "the title's own opening still ranks first");

// The empty query draws no panel; the list screen relies on this rather than
// checking for itself.
say(tier("", "water plants") === 0, "an empty query is not a search for everything");

console.log(`\n${bad === 0 ? "CHECK SEARCH: PASS" : `CHECK SEARCH: ${bad} FAILED`}\n`);
process.exit(bad ? 1 : 0);
