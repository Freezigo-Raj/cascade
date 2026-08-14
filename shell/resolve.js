import { lemmas } from "./lemma.js";
import { readCards, readIdeas, readDone, rankKeyFor } from "./cards.js";
import { readResults } from "./search.js";
import { readPushOptions } from "./push.js";
import { readClashes, readClashDialog } from "./clash.js";

// Cascade Part A — Stage 5, rule 1: the verb.
//
// Everything except the verb is still the fixed hand-written record copied from
// section 1 of spec/example.md. One rule is written at a time, and a field with
// no rule yet keeps its placeholder value until the session that writes it.
//
// Break this file deliberately (return null, drop a field) and app.js must
// show a loud error naming this function, not a blank screen.

/**
 * The lexicon matches one token at a time. Every token of the typed line,
 * lowercased and stripped of punctuation, is looked up in `verb_lexicon` in the
 * order it was typed, and the first match wins. No grammar, no word order, no
 * language. `verb_phrase` keeps the matched token exactly as the user typed it.
 *
 * Nothing matched means `verb_phrase` is empty and `action_verb` is `other`,
 * which invariants 10 and 11 then carry into `context`.
 */
/**
 * What a word becomes when its ending is taken off. The lexicon holds 52 tokens
 * for 18 verbs and a third of them are endings someone typed once and added by
 * hand, which is a list that can never be finished: `replied`, `booked` and
 * `paid` were all missing. These rules are English spelling, not vocabulary, so
 * they are code; the irregular words are vocabulary and sit in config.
 */
function stems(token) {
  const out = [token];
  const add = (t) => { if (t && t.length > 2 && !out.includes(t)) out.push(t); };
  if (token.endsWith("ied")) add(token.slice(0, -3) + "y");
  if (token.endsWith("ies")) add(token.slice(0, -3) + "y");
  if (token.endsWith("ing")) { add(token.slice(0, -3)); add(token.slice(0, -3) + "e"); }
  if (token.endsWith("ed")) { add(token.slice(0, -2)); add(token.slice(0, -1)); }
  if (token.endsWith("es")) add(token.slice(0, -2));
  if (token.endsWith("s") && !token.endsWith("ss")) add(token.slice(0, -1));
  // `submitting`, `planned`: a doubled last letter goes with the ending.
  const m = /^(.*?)([bdgklmnprt])\2(ing|ed)$/.exec(token);
  if (m) add(m[1] + m[2]);
  return out;
}

function readVerb(typed_line, config, lemmas) {
  const words = String(typed_line ?? "").split(/\s+/).filter(Boolean);
  const clean = (w) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  const tokens = words.map(clean);
  const irregular = config.verb_irregulars ?? {};

  for (let i = 0; i < tokens.length; i++) {
    // A verb of two words is looked up before either word alone, so `follow up`
    // is not `follow`. One token at a time could not express it at all.
    const pair = tokens[i + 1] ? `${tokens[i]} ${tokens[i + 1]}` : null;
    const both = pair && (config.verb_lexicon[pair] ?? config.verb_lexicon[irregular[pair]]);
    if (both) return { verb_phrase: `${words[i]} ${words[i + 1]}`, action_verb: both };
    // The lexicon, then the irregulars table, then spelling, then the model.
    // The model is last so it can only add: on the day it shipped it reached
    // nothing the three before it did, and every case in the key stayed green.
    for (const form of [tokens[i], irregular[tokens[i]], ...stems(tokens[i]), lemmas?.[i]]) {
      const verb = form && config.verb_lexicon[form];
      // `verb_phrase` keeps the word as typed, whichever form matched.
      if (verb) return { verb_phrase: words[i], action_verb: verb };
    }
  }
  return { verb_phrase: "", action_verb: "other" };
}

/**
 * The three fields config derives from the verb. `verb_to_context` holds only
 * the verbs that imply one, so a missing entry is `undetermined` rather than a
 * defect, and `other` reaches `undetermined` by the same route.
 */
function fromVerb(action_verb, config) {
  return {
    commitment_type: config.verb_to_type[action_verb],
    context: config.verb_to_context[action_verb] ?? "undetermined",
    est_duration_min: config.duration_defaults[action_verb],
  };
}

// ------------------------------------------------- rule 5: normalised, compare_key
//
// `normalised` is the line with the same spans taken out that `title` drops,
// then lowercased, punctuation stripped, whitespace collapsed and trimmed. It is
// derived from `title` rather than from `raw_text` a second time: the two would
// have to strip the same spans by the same rules, and one of the copies would
// eventually stop matching the other.

function readNormalised(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** `normalised` with every purely numeric token removed, so `file form 8` and
 * `file form 9` compare as the same words. A token with a digit inside letters
 * stays: `gstr1` is a name, not a number. */
function readCompareKey(normalised) {
  return normalised
    .split(" ")
    .filter((t) => t && !/^\d+$/.test(t))
    .join(" ");
}

// -------------------------------------------------- rule 10: the taps
//
// Two of the four taps write the saved record. A tap outranks what the line
// implied, because the person tapped it after reading what the line gave them,
// and `type_source` records which of the two it was.

function readTaps(input, derivedType) {
  const tapped = input.type_chip_tap;
  const sig = input.significance_tap;
  return {
    commitment_type: tapped || derivedType,
    type_source: tapped ? "user" : "derived",
    // 30 is the untouched default, not 70. The placeholder carried 70 because
    // the line it was copied from had tapped High.
    significance: sig === null || sig === undefined ? 30 : Number(sig),
  };
}

// ------------------------------------------- rule 11: what the capture row shows
//
// A bound task is one being edited: the button reads Edit, the field is bound,
// the chip names what is bound, and the row offers what can be done to it. With
// nothing bound, all four say the opposite and the row is empty.

function readCapture(input, task, duplicate, config) {
  const bound = input.bound_task_id
    ? (input.existing_tasks ?? []).find((t) => t.id === input.bound_task_id) ?? { title: input.bound_task_id }
    : null;
  return {
    add_button: bound ? "Edit" : "Add",
    input_field: bound ? "bound" : "unbound",
    // The box draws what was typed, so the renderer needs the line.
    typed_line: String(input.typed_line ?? ""),
    // The example marks the current button: `[Low][Normal][**High**]`. It is
    // drawn rather than styled, so it belongs in the string.
    significance_row: config.significance_buttons.map((b) =>
      b.value === task.significance ? `**${b.label}**` : b.label
    ),
    // Absent when there is no text: a type chip on an empty box offers to change
    // the type of nothing.
    type_chip: String(input.typed_line ?? "").trim() ? `\u27e8${task.commitment_type} \u25be\u27e9` : null,
    bound_task_chip: bound ? `\u27e8 ${bound.title ?? bound.raw_text} \u2715 \u27e9` : null,
    action_row: bound ? ["[Done]", "[Cancel]", "[Archive]"] : [],
    // The clash warning, alongside the duplicate one and fired the same way:
    // on Add, on save and on a push, never while typing.
    clash_dialog: readClashDialog(readClashes(task, input.existing_tasks)),
    duplicate_dialog: duplicate.duplicate_dialog,
  };
}

/**
 * The chip row leads with the date the line already carries, ticked, so tapping
 * it is visibly a no-op and the presets are alternatives to it rather than to
 * nothing. `sort_header` belongs to the Ideas list, which is the only one sorted
 * rather than ranked.
 */
function readListChrome(task, due_phrase_short, list_header, config) {
  // render.js draws the brackets, so the labels are bare here. The row holds
  // what fits: the example drops `Pick date` and `Park` once a parsed chip has
  // taken the space, which is a rule the panel states and nothing implemented.
  // The chip says what the card says, minus the word `due`: the example draws
  // `\u2713 this morning` for a line whose `date_phrase` is `morning`, so it is the
  // rendered phrase and not the raw span.
  const parsed = due_phrase_short ? [`\u2713 ${due_phrase_short.replace(/^due /, "")}`] : [];
  // Every chip. The renderer wraps them, which is what the example's own panel
  // does once a parsed chip has taken the space on the first line.
  return {
    chip_row: [...parsed, ...config.chip_presets],
    // Always returned, never conditional. It belongs to the Ideas list, and
    // which list is on screen is the screen's question: reading `list_header`
    // here made it appear and disappear with the line being typed instead of
    // with the toggle, the same mistake the panel heading made.
    sort_header: "Sort:  [Duration \u25be]   Newest",
  };
}

// ------------------------------------- rule 9: the band, and what the card says
//
// `deadline_band` is how far off a task is. Today is the same calendar day,
// this week runs to the end of Sunday, and anything past Sunday is later.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function readBand(due, now) {
  if (!due) return "none";
  const d = readInstant(due).t, n = now.t;
  if (d < n) return "overdue";
  const today = midnight(n);
  if (d < today + DAY) return "today";
  if (d < today + 2 * DAY) return "tomorrow";
  // Sunday is day 0, so the days left in the week is 7 minus today's index.
  const daysToMonday = 7 - ((new Date(today).getUTCDay() + 6) % 7);
  if (d < today + daysToMonday * DAY) return "this_week";
  return "later";
}

/**
 * The card's lead clause, at the finest granularity that is true. A stated time
 * wins, then the way the day was described, then the band. A hedge reads
 * `Due around Wednesday`, but only where the phrase names a point: `around
 * today` says nothing and `around this morning` says less than `this morning`.
 */
/**
 * A task with a start and no due date says when it can begin. `Due` would be a
 * lie there and silence was what it said before this: a card with a title and
 * nothing under it. The forms mirror `due_phrase` exactly, so the two sentences
 * cannot drift apart in wording.
 */
function readFromPhrase(task, now) {
  if (!task.earliest_start || task.due_at) return "";
  const at = readInstant(task.earliest_start).t;
  const d = new Date(at);
  const clock = () => {
    const h = d.getUTCHours(), m = d.getUTCMinutes();
    const suffix = h < 12 ? "am" : "pm";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
  };
  const today = midnight(now.t), start = midnight(at);
  const day =
    start === today ? "today"
    : start === today + DAY ? "tomorrow"
    : start < today + (7 - ((new Date(today).getUTCDay() + 6) % 7)) * DAY && start > today
    ? DAY_NAMES[d.getUTCDay()]
    : `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
  // A stated time carries its day, exactly as a due date does, and a time today
  // says only the time: `From 5pm` is unambiguous where `From today at 5pm` is
  // longer and says no more.
  if (task.has_time) return start === today ? `From ${clock()}` : `From ${day} at ${clock()}`;
  return `From ${day}`;
}

function readDuePhrase(task, band, now) {
  if (band === "none") return "";
  const due = readInstant(task.due_at).t;
  const clock = (t) => {
    const d = new Date(t), h = d.getUTCHours(), m = d.getUTCMinutes();
    const suffix = h < 12 ? "am" : "pm";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
  };
  const dayAndMonth = (t) => `${new Date(t).getUTCDate()} ${MONTH_NAMES[new Date(t).getUTCMonth()]}`;
  const soften = (phrase, point) =>
    task.date_firmness === "soft" && point ? phrase.replace(/^Due /, "Due around ") : phrase;

  // A length of time answers in a length of time. `in 30 mins` reads back the
  // way it was typed, which is the same rule as a span naming itself, and it
  // holds only while the answer stays a length: same day and inside twelve
  // hours. Past that the clock is the plainer thing to say.
  if (/^in \d/i.test(task.date_phrase) && band !== "overdue") {
    const sameDay = midnight(due) === midnight(now.t);
    if (sameDay && due - now.t <= 12 * HOUR) return `Due ${task.date_phrase.toLowerCase()}`;
  }

  if (band === "overdue") {
    const since = now.t - due < 7 * DAY ? DAY_NAMES[new Date(due).getUTCDay()] : dayAndMonth(due);
    return `Overdue since ${since}`;
  }
  if (band === "today") {
    if (task.has_time) return soften(`Due at ${clock(due)}`, true);
    if (task.date_precision === "band") {
      // `tonight` already carries its day; `morning` needs one.
      const word = task.date_phrase.toLowerCase().split(/\s+/).pop();
      return word.startsWith("to") ? `Due ${word}` : `Due this ${word}`;
    }
    return "Due today";
  }
  // A span wider than a day says the span, not a date inside it. `next month`
  // resolves to an instant so the task can be ranked, and reporting that instant
  // on the card would claim a precision the user did not give: `Due 16 Sep` for
  // a line that said `next month`. The typed words are the honest answer.
  if (["span", "week", "month"].includes(task.date_precision)) {
    const said = task.date_phrase.toLowerCase();
    const span = said === "weekend" ? "this weekend" : said;
    return soften(`Due ${span}`, true);
  }

  // A time on another day still needs the day: `Due at 5pm` on a Friday task
  // read as today and lost the four days between.
  const day = band === "tomorrow" ? "tomorrow"
    : band === "this_week" ? DAY_NAMES[new Date(due).getUTCDay()]
    : dayAndMonth(due);
  if (task.has_time) return soften(`Due ${day} at ${clock(due)}`, true);
  // The finest granularity that is TRUE: a day carrying a band knows the band,
  // and `Due tomorrow` for a line that said `tomorrow morning` throws away the
  // half of it the person cared about.
  //
  // Only where the day was NAMED. A bare band that rolled reads `Due tomorrow`,
  // because nobody said tomorrow: the roll is the engine's answer and B25 in the
  // key pins it. The discriminator is the phrase with its lead words off — if
  // what is left is the band alone, the band was the whole expression.
  if (task.date_precision === "band") {
    const said = task.date_phrase.toLowerCase().split(/\s+/)
      .filter((w) => !["this", "on", "next"].includes(w));
    if (said.length > 1) return soften(`Due ${day} ${said[said.length - 1]}`, true);
  }
  return soften(`Due ${day}`, true);
}

/** The same sentence for a search row: first word lowercased, day names cut to
 * three letters, which keep their capital. */
function shorten(phrase) {
  let out = phrase.replace(/^([A-Z])/, (c) => c.toLowerCase());
  for (const day of DAY_NAMES) out = out.replace(day, day.slice(0, 3));
  return out;
}

// ------------------------------------------------- rule 8: what never registers
//
// Two rules, one throw. A line below `limits.raw_text_min_chars` after trimming,
// or one holding no letter and no digit, is not a capture. `resolve()` throws
// rather than returning a record, because the screen keeps the Add button off
// until there is something to add: reaching here with an empty box is a defect
// in the caller, not a message for the user.

function refuse(typed_line, config) {
  const line = String(typed_line ?? "").trim();
  // Marked, so a caller watching every keystroke can tell "nothing typed yet"
  // from "the engine is broken". Both still throw; only one is a defect.
  const no = (why) => {
    const e = new Error(why);
    e.refused = true;
    throw e;
  };
  if (line.length < config.limits.raw_text_min_chars) {
    no(`resolve() was handed ${line.length} characters; nothing registers below ${config.limits.raw_text_min_chars}`);
  }
  if (!/[\p{L}\p{N}]/u.test(line)) {
    no("resolve() was handed a line with no letter and no digit; nothing registers");
  }
}

// ------------------------------------------------- rule 7: the comma sum
//
// The commas count the items: two commas are three things to do. The first
// chunk is one item whatever it holds, because it carries the verb and whatever
// the verb needed to reach its first object. Every chunk after a comma has to be
// a single word, which is what keeps `Meet Priya, the new CFO, on Thursday` a
// single meeting rather than three.

function readSum(line, action_verb, config) {
  // Counted on `title`, so a date after a comma is not a thing to do:
  // `call kushan, tomorrow` is one call, not two.
  const chunks = String(line).split(",");
  if (chunks.length < 2) return null;
  // A list with no verb in front of it is not a list of things to do.
  if (action_verb === "other") return null;
  for (const chunk of chunks.slice(1)) {
    const tokens = chunk.trim().split(/\s+/).filter(Boolean);
    if (tokens.length !== 1) return null;
  }
  const each = config.duration_defaults[action_verb];
  return { est_duration_min: each * chunks.length, duration_source: "summed" };
}

// ------------------------------------------------- rule 6: the duplicate check
//
// Three steps in order, from the contract. Build both `compare_key`s. If they
// match and the `normalised` do not, the two lines differ only by a number and
// are distinct items, so nothing is asked. Otherwise the dialog fires when the
// score reaches `threshold` and both keys reach `min_chars`.

/** Sørensen–Dice over character trigrams as a multiset, padded two spaces in
 * front and one behind. Spaces count: `srilanka hotel` and `sri lanka hotel`
 * are not the same string. */
function trigrams(text) {
  const padded = `  ${text} `;
  const bag = new Map();
  for (let i = 0; i + 3 <= padded.length; i++) {
    const g = padded.slice(i, i + 3);
    bag.set(g, (bag.get(g) ?? 0) + 1);
  }
  return bag;
}
function diceBags(a, b) {
  let shared = 0, size = 0;
  for (const [g, n] of a) { shared += Math.min(n, b.get(g) ?? 0); size += n; }
  for (const n of b.values()) size += n;
  return size ? (2 * shared) / size : 0;
}
/** The same measure over token sets, which is what separates a reordering from
 * a respelling. */
function diceWords(a, b) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  return A.size + B.size ? (2 * shared) / (A.size + B.size) : 0;
}
/** Half-up to two decimals, and the comparison with `threshold` happens after.
 * 0.4468 is 0.45, not 0.44. */
const round2 = (x) => Math.round(x * 100) / 100;

function readDuplicate(normalised, compare_key, existing, config, now) {
  const out = { similarity: 0, numeric_variant: false, duplicate_dialog: null };
  const mine = trigrams(compare_key);
  let best = null;
  for (const task of existing ?? []) {
    const theirNormalised = String(task.normalised ?? "");
    const theirKey = readCompareKey(theirNormalised);
    if (theirKey === compare_key && theirNormalised !== normalised) out.numeric_variant = true;
    const score = round2(Math.max(diceBags(mine, trigrams(theirKey)), diceWords(compare_key, theirKey)));
    if (!best || score > best.score) best = { score, key: theirKey, task };
  }
  if (!best) return out;
  out.similarity = best.score;
  if (out.numeric_variant) return out;
  const long = compare_key.length >= config.duplicate.min_chars && best.key.length >= config.duplicate.min_chars;
  if (best.score >= config.duplicate.threshold && long) {
    // The band clause names when the open task is due. A task with no due date
    // has nothing to say there, and the sentence stops after the name.
    const name = best.task.title ?? best.task.raw_text ?? best.key;
    const band = readBand(best.task.due_at, now);
    const phrase = band === "none" ? "" : shorten(readDuePhrase(best.task, band, now));
    out.duplicate_dialog = phrase ? `"${name}" already exists, ${phrase}.` : `"${name}" already exists.`;
  }
  return out;
}

// ----------------------------------------------------------------- rule 4: list
//
// Part A has two lists and no tabs. A task with a `due_at` is in Default and is
// ranked; a task without one is in Ideas and is sorted by duration. Nothing else
// decides it: not the verb, not the type, not whether a marker was typed.

function readList(task) {
  // Any resolved date puts a task in Default, not only a due one. `after friday`
  // is a task with a day attached and a person who typed one is not filing an
  // idea; Ideas is for a line with no date at all. A task with a start and no
  // due has no `deadline_band`, so it ranks below everything that does, which is
  // where it belongs rather than out of the list.
  return task.due_at || task.earliest_start ? "Default" : "Ideas";
}

/**
 * `task` is the saved output, `list` and `capture` are the shown outputs; the
 * contract's three groups, one per key. The four values below are handed in
 * rather than derived: the record carries the line it was typed from, the id
 * and clock it was given, and the config that read it.
 *
 * @param {import("./types.js").CaptureInput} input
 * @returns {{ task: Task, working: WorkingValues, list: ListView, capture: CaptureView }}
 */

// ---------------------------------------------------------------- rule 2: dates
//
// A date word is config and a date number is code. `date_lexicon` names the
// bands, the relative days, the weekdays and the spans; a calendar date and a
// clock time are patterns over numbers with no list to write.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Wall-clock arithmetic at the offset the input handed in. Never a real zone. */
function readInstant(iso) {
  const m = String(iso).match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)([+-]\d\d:\d\d)$/);
  if (!m) throw new Error(`resolve() was handed an unreadable instant: ${iso}`);
  const [, y, mo, d, h, mi, se, offset] = m;
  return { t: Date.UTC(+y, +mo - 1, +d, +h, +mi, +se), offset };
}
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
function writeInstant(t, offset) {
  const d = new Date(t), p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T` +
         `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${offset}`;
}
const midnight = (t) => Math.floor(t / DAY) * DAY;
const hhmm = (t, s) => t + Number(s.slice(0, 2)) * HOUR + Number(s.slice(3, 5)) * MIN;
const word = (w) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** The marker, longest phrase first so `no later than` beats `than`. */
/**
 * A marker word is only a marker when the date starts right after it. `submit by
 * friday` is a deadline; `pay by cheque` is how the payment is made, and through
 * version 25 both recorded `by`. The test is adjacency, not presence: in `pay by
 * cheque friday` the date is Friday, `by` stays in the title, and nothing is a
 * deadline. Words the expression carries in front of itself, `next` and `this`
 * and `on`, are part of the date, so `by next friday` still counts.
 */
function readMarker(line, config, span) {
  const lows = line.split(/\s+/).filter(Boolean).map(word);
  // The first marker typed wins, and a longer phrase beats a shorter one that
  // starts in the same place, so `no later than` beats `than`. Length alone
  // decided this until version 25, which meant `by after friday` took `after`
  // and reversing the words changed nothing.
  let best = null;
  for (const [group, words] of Object.entries(config.marker_words))
    for (const w of words) {
      const parts = w.split(" ");
      for (let i = 0; i + parts.length <= lows.length; i++) {
        if (!parts.every((p, k) => lows[i + k] === p)) continue;
        // A weak, start or point marker has to sit right in front of the date:
        // `pay by cheque` is how a payment is made, not a deadline. A strong
        // marker counts anywhere, because it needs no date to mean anything —
        // `GST filing deadline` is hard with no date at all.
        if (group !== "strong" && (!span || !span.words.includes(i + parts.length))) continue;
        if (best && (best.from < i || (best.from === i && best.word.length >= w.length))) continue;
        best = { group, word: w, from: i, at: [...parts.keys()].map((k) => i + k) };
      }
    }
  // A marker that lost still leaves the line: both were relating the same date,
  // and one of them left behind is a stranded preposition.
  if (best) {
    best.at = [...best.at];
    for (const words2 of Object.values(config.marker_words))
      for (const w of words2) {
        const parts = w.split(" ");
        for (let i = 0; i + parts.length <= lows.length; i++) {
          if (!parts.every((p, k) => lows[i + k] === p)) continue;
          for (let k = 0; k < parts.length; k++) if (!best.at.includes(i + k)) best.at.push(i + k);
        }
      }
  }
  return best;
}

/**
 * The temporal expression. A clock time and a day expression can both be there,
 * and then the day supplies the date and the time supplies the instant.
 */
/** Where a word starts in the line, so a span can be tested against a chip's range. */
function charAt(words, i) {
  let at = 0;
  for (let k = 0; k < i; k++) at += words[k].length + 1;
  return at;
}

function readSpan(line, config, chipSpans) {
  const words = line.split(/\s+/).filter(Boolean);
  // Shorthand is expanded before anything is looked up, so `tmrw` and `fri` are
  // the words they stand for from here on. The typed word is still what the
  // title drops and what `date_phrase` reports.
  const lows = words.map((w) => config.date_aliases[word(w)] ?? word(w));
  const span = { day: null, time: null, rel: null, words: [] };

  // `in 30 mins`, `in 2 hours`. The word `in` belongs to the expression, the way
  // `this` does in `this friday`, and not to `marker_words`: a bare `30 min` is a
  // duration and `in` is the whole of what makes it a time.
  const UNITS = { min: 1, mins: 1, minute: 1, minutes: 1, hr: 60, hrs: 60, hour: 60, hours: 60 };
  for (let i = 0; i + 2 < lows.length + 1; i++) {
    if (lows[i] !== "in" || !/^\d+$/.test(lows[i + 1] ?? "") || !(lows[i + 2] in UNITS)) continue;
    span.rel = { minutes: Number(lows[i + 1]) * UNITS[lows[i + 2]] };
    span.words.push(i, i + 1, i + 2);
    break;
  }

  // Clock time. `5pm`, `5:30pm`, `5.30pm`, `17:00`, and `5 pm` where the meridiem
  // was typed as its own word. A minute separator can be a colon, a dot or
  // nothing; people write all three and only one of them was read.
  const CLOCK = /^(\d{1,2})(?:[:.]?(\d{2}))?(am|pm)?$/;
  for (let i = 0; i < words.length; i++) {
    const m = CLOCK.exec(lows[i]);
    if (!m) continue;
    let meridiem = m[3];
    let took = [i];
    // `5 pm`: the hour and the meridiem as two words.
    if (!meridiem && /^(am|pm)$/.test(lows[i + 1] ?? "")) { meridiem = lows[i + 1]; took.push(i + 1); }
    // A bare number with no meridiem and no separator is not a time: `form 8`
    // and `pump 4` are numbers in a name, and `17:00` carries its colon.
    if (!meridiem && !/[:.]/.test(lows[i])) continue;
    let h = Number(m[1]);
    if (meridiem) { h = h % 12; if (meridiem === "pm") h += 12; }
    if (h > 23 || Number(m[2] ?? 0) > 59) continue;
    span.time = { h, min: Number(m[2] ?? 0), at: i };
    span.words.push(...took);
    break;
  }

  // A lexicon phrase, longest first, so `next week` beats `week`.
  // The first expression typed wins, and a longer phrase beats a shorter one
  // starting in the same place, so `next week` beats `week`. Length alone
  // decided this until version 25, which meant `friday tomorrow` and
  // `tomorrow friday` both took `tomorrow`: the engine read no order at all.
  const phrases = Object.keys(config.date_lexicon).sort((a, b) => b.length - a.length);
  const hits = [];
  for (const phrase of phrases) {
    const parts = phrase.split(" ");
    for (let i = 0; i + parts.length <= lows.length; i++) {
      if (!parts.every((p, k) => lows[i + k] === p)) continue;
      hits.push({ phrase, parts, i });
    }
  }
  // A tapped date beats a typed one. A tap is nearly always the correction, and
  // the screen clears the chip the moment the line is edited afterwards, so a
  // chip span only ever exists when the tap was the last thing that happened.
  // That pair of rules is what "the later one wins" means when the engine sees
  // a finished line rather than the order of events.
  const tapped = (h) => {
    const at = charAt(words, h.i);
    return (chipSpans ?? []).some((r) => at >= r.start && at < r.end);
  };
  hits.sort((a, b) => Number(tapped(b)) - Number(tapped(a)) || a.i - b.i || b.phrase.length - a.phrase.length);
  // Every date expression leaves `title`, winner or not. A second one is the
  // person correcting themselves, and leaving it behind puts a date on the card
  // that the record does not hold.
  for (const h of hits) {
    if (h.i === hits[0].i && h.phrase !== hits[0].phrase) continue;
    // A loser takes its lead word with it too. `this` and `on` and `next` were
    // being kept for the winner only, so `friday This afternoon` dropped
    // `afternoon` and stranded `This` in the title.
    if (h.i > 0 && ["this", "on", "next"].includes(lows[h.i - 1])) span.words.push(h.i - 1);
    for (let k = 0; k < h.parts.length; k++) span.words.push(h.i + k);
  }
  for (const { phrase, parts, i } of hits.slice(0, 1)) {
    {
      const kind = config.date_lexicon[phrase];
      const take = [];
      // `this friday` picks which Friday and `on thursday` points at one. Neither
      // changes an anchor, so both belong to the expression and leave `title`
      // with it, which is what stops the card reading `Meet Priya, the new CFO, on`.
      // `this friday` picks which Friday, `on thursday` points at one, and
      // `next friday` picks the one after. None changes an anchor, so all three
      // belong to the expression and leave `title` with it.
      const lead = i > 0 ? lows[i - 1] : "";
      if (["this", "on", "next"].includes(lead)) take.push(i - 1);
      for (let k = 0; k < parts.length; k++) take.push(i + k);
      span.day = { kind, phrase, at: i, next: lead === "next" };
      span.words.push(...take);
      // A band word touching a named day narrows it. `tomorrow morning` was two
      // hits, the day won on position and the band supplied nothing, so it read
      // the same as a bare `tomorrow` and the word left the title having changed
      // no field. Adjacency decides, as it does between two markers: only a band
      // that starts where the day ends belongs to it, so `tomorrow call about
      // the evening slot` is still one date.
      const after = hits.find((h) => h.i === i + parts.length && config.date_lexicon[h.phrase] === "band");
      if (after && kind === "day") span.day.band = after.phrase;
    }
  }

  // A calendar date: `20 aug` or `aug 20`.
  //
  // It is looked for when the lexicon found nothing, and also when the only
  // thing the lexicon found was a band: `20 Aug morning` had `morning` winning
  // on position, so the date never got read at all and `20 Aug` stayed in the
  // title of a task due this morning. A band is the one lexicon kind a date can
  // take over from, because the band is what the date is being narrowed by.
  if (!span.day || span.day.kind === "band") {
    const bandOnly = span.day && span.day.kind === "band" ? span.day : null;
    for (let i = 0; i < lows.length - 1; i++) {
      const a = lows[i], b = lows[i + 1];
      const dm = /^\d{1,2}$/.test(a) && MONTHS.indexOf(b.slice(0, 3)) >= 0 ? [Number(a), MONTHS.indexOf(b.slice(0, 3))]
               : /^\d{1,2}$/.test(b) && MONTHS.indexOf(a.slice(0, 3)) >= 0 ? [Number(b), MONTHS.indexOf(a.slice(0, 3))]
               : null;
      if (!dm) continue;
      // Only when the band is touching it. A band somewhere else in the line
      // won on position and keeps winning: `morning call about 20 Aug` is a
      // task for this morning, and the date is what it is about.
      if (bandOnly && bandOnly.at !== i + 2 && bandOnly.at !== i + 3) break;
      span.day = { kind: "date", date: dm[0], month: dm[1], at: i };
      span.words.push(i, i + 1);
      if (bandOnly) span.day.band = bandOnly.phrase;
      // A four-digit year directly after the date belongs to it. Without this
      // `20 Aug 2027` resolved to this year and left `2027` stranded in the
      // title, which is the shape `Pick date` writes the moment it reaches a
      // date outside the current year.
      const y = lows[i + 2];
      if (y && /^\d{4}$/.test(y)) {
        span.day.year = Number(y);
        span.words.push(i + 2);
      } else if (!bandOnly) {
        const near = hits.find((h) => h.i === i + 2 && config.date_lexicon[h.phrase] === "band");
        if (near) span.day.band = near.phrase;
      }
      break;
    }
  }
  // A band and a clock time contradict each other: 14:00 is not the morning. The
  // time wins, as it does over a day, and the band supplies no date. Both words
  // stay in the expression so both leave `title` together.
  if (span.day && span.day.kind === "band" && span.time) span.day.dropped = true;
  if (!span.day && !span.time && !span.rel) return null;
  span.words = [...new Set(span.words)].sort((a, b) => a - b);
  // Trailing punctuation was never part of the expression. `pay a tomorrow, b`
  // read its span as `tomorrow,` and took the comma out of the line with it,
  // which lost the separator and merged two items into one.
  // Where the expression's words sit in the line. `date_phrase` says WHAT was
  // read and never WHERE, so a screen could show `\u2713 this morning` and had no
  // way to take those words back out of the box when the chip was tapped.
  // Offsets are found by walking the line rather than by adding word lengths,
  // because internal spacing survives into `title` and two spaces would have
  // shifted every offset after them.
  const at = [];
  for (const m of line.matchAll(/\S+/g)) at.push([m.index, m.index + m[0].length]);
  span.spans = [];
  for (const i of span.words) {
    const here = at[i];
    if (!here) continue;
    const last = span.spans[span.spans.length - 1];
    // Words that touch merge into one range, so `20 Aug 2027` is one span to
    // delete rather than three.
    if (last && here[0] <= last.end + 1) last.end = here[1];
    else span.spans.push({ start: here[0], end: here[1] });
  }
  span.keep = {};
  span.phrase = span.words
    .map((i) => {
      const w = words[i];
      const m = /^(.*?)([^\p{L}\p{N}]*)$/u.exec(w);
      if (m[2]) span.keep[i] = m[2];
      return m[1];
    })
    .join(" ");
  return span;
}

/** The window the expression names, half-open, before `now` clips it. */
function windowFor(span, now, config) {
  const anchor = config.day_start_anchor;
  const today = midnight(now.t);
  const d = span.day;
  /**
   * The window a named day opens, cut down to a band when one is touching it.
   *
   * A band on its own rolls: `morning` typed at 14:00 is tomorrow's. A band
   * attached to a day does NOT, because the day was named, and a named day or
   * date in the past stays in the past. `today morning` at 14:00 is an overdue
   * task and not a task for tomorrow, which is the same answer the day rule
   * already gives without the band.
   */
  const dayWindow = (start) => {
    const whole = { start: hhmm(start, anchor), end: start + DAY };
    if (!d || !d.band) return whole;
    const name = d.band === "tonight" ? "night" : d.band;
    const b = config.time_bands[name];
    if (!b) return whole;
    const from = hhmm(start, b.start);
    const to = b.end === "24:00" ? start + DAY : hhmm(start, b.end);
    // Half-open and inside the day, like every other window here.
    return { start: Math.max(whole.start, from), end: Math.min(whole.end, to) };
  };

  if (!d || d.dropped) return { start: null, end: null, kind: "time" };
  if (d.kind === "open") return { start: null, end: null, kind: "open" };
  if (d.kind === "band") {
    const band = d.phrase === "tonight" ? "night" : d.phrase;
    const b = config.time_bands[band];
    let start = hhmm(today, b.start), end = b.end === "24:00" ? today + DAY : hhmm(today, b.end);
    // The third arm: a band that has already ended is the same band tomorrow.
    if (now.t >= end) { start += DAY; end += DAY; }
    return { start, end, kind: "band" };
  }
  if (d.kind === "span") {
    const sat = today + ((6 - new Date(today).getUTCDay() + 7) % 7 || 7) * DAY;
    return { start: hhmm(sat, anchor), end: sat + 2 * DAY, kind: "span" };
  }
  if (d.kind === "week") {
    const mon = today + ((1 - new Date(today).getUTCDay() + 7) % 7 || 7) * DAY;
    return { start: hhmm(mon, anchor), end: mon + 7 * DAY, kind: "week" };
  }
  if (d.kind === "month") {
    const t = new Date(today);
    const first = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1);
    const next = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 2, 1);
    return { start: hhmm(first, anchor), end: next, kind: "month" };
  }
  if (d.kind === "date") {
    // A named date in the past stays in the past, as a named day does. Only a
    // band rolls, and rolling a date the user spelled out would move a missed
    // deadline a year rather than showing it overdue.
    // A stated year is taken as stated, past or future: someone who spells out
    // 2027 means 2027, and someone who spells out last year means last year.
    const t = new Date(today);
    return dayWindow(Date.UTC(d.year ?? t.getUTCFullYear(), d.month, d.date));
  }
  // A relative day or a weekday.
  if (d.phrase === "today") return dayWindow(today);
  if (d.phrase === "tomorrow") return dayWindow(today + DAY);
  if (d.phrase === "yesterday") return dayWindow(today - DAY);
  // A weekday that names today means today: the day window runs to midnight, so
  // there is still a day left to do it in.
  const want = WEEKDAYS.indexOf(d.phrase);
  const ahead = (want - new Date(today).getUTCDay() + 7) % 7;
  // `next friday` is the one after the coming Friday. `this friday` and a bare
  // `friday` are the coming one, and a weekday naming today means today.
  return dayWindow(today + (ahead + (d.next ? 7 : 0)) * DAY);
}

// ---------------------------------------------------------------- rule 3: title
//
// `title` is the line with the words the engine consumed taken out, and nothing
// else touched. `raw_text` keeps every character typed, so nothing is lost.

/**
 * Drop the words at these positions, keeping every space the user typed between
 * the words that stay. `call    kushan` comes back with its four spaces.
 */
function dropWords(line, drop, keep = {}) {
  const parts = String(line).split(/(\s+)/);
  const kept = [];
  let w = -1;
  for (const part of parts) {
    if (/^\s+$/.test(part) || part === "") { kept.push(part); continue; }
    w += 1;
    // A dropped word can leave punctuation behind: what was removed is the
    // expression, and a comma beside it was separating something else.
    kept.push(drop.has(w) ? (keep[w] ?? null) : part);
  }
  // A separator is dropped when the word before it went and the run is empty.
  const out = [];
  for (let i = 0; i < kept.length; i++) {
    if (kept[i] === null) { if (/^\s+$/.test(kept[i + 1] ?? "")) i += 1; continue; }
    // Punctuation left by a dropped word joins the word before it.
    if (keep && out.length && /^[^\p{L}\p{N}\s]+$/u.test(kept[i]) && /^\s+$/.test(out[out.length - 1] ?? "")) out.pop();
    out.push(kept[i]);
  }
  // A comma that was separating something from the words just removed has
  // nothing left to separate: `call kushan, tomorrow` must not draw as
  // `call kushan,`.
  return out.join("").replace(/^\s+|\s+$/g, "").replace(/[,;]+$/, "").trimEnd();
}

/**
 * A strong marker always leaves `title`: it is metadata and carries no content.
 * A weak, start or point marker leaves only with the date it governs, because
 * without one it is still relating the words around it — `after audit` keeps
 * `after`. A hedge leaves too: `date_hedge` holds the word and the title is the
 * task, not the mood. If taking the span out would leave nothing, the whole line
 * stays, because a label has to say something.
 */
function readTitle(line, span, marker, hedgeAt) {
  const drop = new Set();
  if (span) for (const i of span.words) drop.add(i);
  if (marker && (marker.group === "strong" || span)) for (const i of marker.at) drop.add(i);
  for (const i of hedgeAt) drop.add(i);
  if (!drop.size) return String(line);
  const title = dropWords(line, drop, span ? span.keep : {});
  return title === "" ? String(line) : title;
}

/**
 * The date fields. The anchor comes from the marker when there is one and from
 * the expression when there is not, and a strong marker sets firmness alone.
 */
function readDates(input) {
  const line = String(input.typed_line ?? "");
  const config = input.config;
  const now = readInstant(input.now);
  const empty = { title: line, resolved_window: null, clipped_window: null, from_phrase: "",
                  date_phrase: "", date_spans: [], date_hedge: "", date_marker: "", date_precision: "none",
                  date_firmness: "normal", date_anchor: "none", earliest_start: "", due_at: "", has_time: false };

  const lowWords = line.split(/\s+/).filter(Boolean).map(word);
  const hedgeAt = [];
  let hedge = "";
  lowWords.forEach((w, i) => {
    if (hedge || !config.hedge_words.includes(w)) return;
    hedge = w;
    hedgeAt.push(i);
  });
  const span = readSpan(line, config, input.chip_spans);
  const marker = readMarker(line, config, span);
  const out = { ...empty, date_hedge: hedge, date_marker: marker ? marker.word : "" };
  out.title = readTitle(line, span, marker, hedgeAt);
  if (hedge) out.date_firmness = "soft";
  // A strong marker is firmness and nothing else, and hard outranks a hedge.
  if (marker && marker.group === "strong") out.date_firmness = "hard";
  if (!span) return out;

  out.date_phrase = span.phrase;
  out.date_spans = span.spans;
  const win = windowFor(span, now, config);
  // The window the rule resolved, and the same window after `now` cut it. Both
  // were computed and thrown away, so the two fields held the hand-copied
  // morning band on every line whatever date was typed.
  if (win.start !== null && win.end !== null) {
    const at = (t) => writeInstant(t, now.offset);
    const cut = now.t > win.start && now.t < win.end ? now.t : win.start;
    out.resolved_window = { start: at(win.start), end: at(win.end) };
    out.clipped_window = { start: at(cut), end: at(win.end) };
  }
  out.date_precision = span.time || span.rel ? "time"
    : span.day.dropped ? "time"
    // A day carrying a band is a band: `tomorrow morning` is three hours, not a
    // day, and ranking factor 4 puts a band above a day for exactly that.
    : span.day.band ? "band"
    : span.day.kind === "date" ? "day"
    : span.day.kind === "open" ? "open"
    : ["band", "span", "week", "month"].includes(span.day.kind) ? span.day.kind
    : "day";
  if (out.date_precision === "open") return out;
  out.has_time = out.date_precision === "time";

  // An instant when a time was typed; a window otherwise.
  let instant = null;
  if (span.rel) instant = now.t + span.rel.minutes * MIN;
  else if (span.time) {
    const base = win.start === null ? midnight(now.t) : midnight(win.start);
    instant = base + span.time.h * HOUR + span.time.min * MIN;
    // A time of day that has already gone means the next one, as a band does.
    // Only when the time stood alone: `1 aug at 5pm` names a day, and a day the
    // person named is not moved. Nobody types 10AM at 10:40 meaning forty
    // minutes ago, and resolving it there makes a task overdue as it is typed.
    //
    // A start is the exception. `after 5pm` typed at six means today, because
    // the person is saying when they can begin and they can already begin. A due
    // date in the past is a task born late; a start in the past is a task that
    // has started, which is what they meant.
    const starts = marker && marker.group === "start";
    if (!span.day && !starts && instant < now.t) instant += DAY;
  }
  const group = marker ? marker.group : null;
  out.date_anchor = group === "weak" ? "end" : group === "start" ? "start"
    : group === "point" || span.time || span.rel ? "point" : "window";
  if (group === "weak" || group === "strong") out.date_firmness = "hard";

  const iso = (t) => writeInstant(t, now.offset);
  if (out.date_anchor === "point") { out.due_at = iso(instant); return out; }
  if (out.date_anchor === "end") {
    out.due_at = iso(instant !== null ? instant : win.end - 1000);
    return out;
  }
  if (out.date_anchor === "start") {
    out.earliest_start = iso(instant !== null ? instant : win.start);
    return out;
  }
  // A window: clipped by `now` when `now` is inside it, and the midpoint of what is left.
  const start = now.t > win.start && now.t < win.end ? now.t : win.start;
  out.earliest_start = iso(start);
  out.due_at = iso(start + Math.floor((win.end - start) / 2 / MIN) * MIN);
  return out;
}

/**
 * The three lists, with nothing typed.
 *
 * The list screen opens on an empty box, and `resolve()` refuses an empty line
 * — correctly, because there is no capture in it. The lists are not a capture:
 * they are what is already stored, and they exist whether or not anything is
 * being typed. Without this the opening screen had nothing to draw and the only
 * way out was to hand the engine a line nobody wrote.
 *
 * `resolve()` calls it too, so one pass builds the cards for both callers and
 * the list on screen 1 cannot disagree with the list under the capture box.
 */
export function listOnly(existing, config, now) {
  const nowAt = readInstant(now);
  const bandOf = (t) => readBand(t.due_at, nowAt);
  const listing = readCards(
    existing,
    config,
    (t) => readDuePhrase(t, bandOf(t), nowAt) || readFromPhrase(t, nowAt),
    bandOf,
    (t) => readPushOptions(t, existing, config, now)
  );
  return {
    cards: listing.cards,
    ideas: readIdeas(existing),
    done: readDone(existing),
  };
}

export function resolve(input) {
  console.log("[resolve] called with typed_line=%o", input.typed_line);

  refuse(input.typed_line, input.config);

  const { verb_phrase, action_verb } = readVerb(input.typed_line, input.config, lemmas(input.typed_line));
  const derived = fromVerb(action_verb, input.config);
  const dates = readDates(input);
  const normalised = readNormalised(dates.title);
  const compare_key = readCompareKey(normalised);
  const duplicate = readDuplicate(normalised, compare_key, input.existing_tasks, input.config, readInstant(input.now));
  const summed = readSum(dates.title, action_verb, input.config);
  const taps = readTaps(input, derived.commitment_type);
  const nowAt = readInstant(input.now);
  const deadline_band = readBand(dates.due_at, nowAt);
  const due_phrase = readDuePhrase(dates, deadline_band, nowAt) || readFromPhrase(dates, nowAt);

  const task = {
      id: input.new_id,
      raw_text: input.typed_line,
      // Handed in and stored unread. The engine derives nothing from these and
      // would behave identically without them; they are here so a later session
      // can ask which chips people tap and then edit away.
      chip_spans: (input.chip_spans ?? []).map((r) => ({ start: r.start, end: r.end })),
      title: dates.title,
      normalised: normalised,
      notes: "",
      verb_phrase,
      action_verb,
      commitment_type: taps.commitment_type,
      type_source: taps.type_source,
      context: derived.context,
      significance: taps.significance,
      date_phrase: dates.date_phrase,
      date_spans: dates.date_spans ?? [],
      date_hedge: dates.date_hedge,
      date_marker: dates.date_marker,
      date_precision: dates.date_precision,
      date_firmness: dates.date_firmness,
      date_anchor: dates.date_anchor,
      earliest_start: dates.earliest_start,
      due_at: dates.due_at,
      has_time: dates.has_time,
      est_duration_min: summed ? summed.est_duration_min : derived.est_duration_min,
      duration_source: summed ? summed.duration_source : "default",
      recurrence: null,
      // Part A records what alarm was asked for and fires nothing. A capture
      // asks for none; the advanced panel is what changes it.
      alarm_type: "none",
      alarm_lead_min: null,
      alarm_repeat_min: null,
      blocked: false,
      blocker_reason: "none",
      blocker_ref: null,
      project_id: null,
      task_state: "ready",
      archived: false,
      pinned: false,
      config_version: input.config.version,
      created_at: input.now,
      updated_at: input.now,
      closed_at: null,
      // Nothing has been pushed on capture. `first_due_at` fills on the first
      // push and never again, so the distance between it and `due_at` is the
      // whole drift rather than the last leg of it.
      push_count: 0,
      first_due_at: null,
      // A capture never repeats and never came from one. Both are set by the
      // advanced panel and by `done`, which are the screen's and the store's.
      spawned_from: null,
    };

  const list_header = readList(task);
  const capture = readCapture(input, task, duplicate, input.config);
  const chrome = readListChrome(task, shorten(due_phrase), list_header, input.config);
  // The list, ranked. `rank_key` and `decided_by` are properties of a position
  // in it, so they cannot be computed from the line being typed: they come back
  // from the same pass that ordered the cards.
  const bandOf = (t) => readBand(t.due_at, nowAt);
  const listing = listOnly(input.existing_tasks, input.config, input.now);
  // Live search, on `normalised` rather than on the raw line, so a date word
  // typed into the box is never something to search for. The same string the
  // duplicate rule starts from, which is why one line cannot match on a word
  // the other ignores.
  const results = readResults(normalised, input.existing_tasks, input.config, (t) =>
    shorten(readDuePhrase(t, bandOf(t), nowAt) || readFromPhrase(t, nowAt))
  );

  return {
    task,
    working: {
      due_phrase,
      due_phrase_short: shorten(due_phrase),
      deadline_band,
      is_hard: task.date_firmness === "hard",
      workflow_position: 0,
      reminder_fatigue: 0,
      resolved_window: dates.resolved_window,
      clipped_window: dates.clipped_window,
      compare_key,
      similarity: duplicate.similarity,
      numeric_variant: duplicate.numeric_variant,
      // The task being typed is not on the list until it is added, so it has no
      // position and nothing has been decided about it. `rank_key` is its own
      // terms, which is a fact about the task; `decided_by` is a fact about a
      // position and stays empty until there is one.
      rank_key: rankKeyFor(task, input.config, bandOf),
      decided_by: "",
    },
    list: {
      list_header,
      sort_header: chrome.sort_header,
      chip_row: chrome.chip_row,
      cards: listing.cards,
      // Both lists come back on every call and the screen toggles between them.
      // Deciding which one to draw with an input would have made the engine
      // answer a question about the screen.
      ideas: listing.ideas,
      // The Done tab. Finished tasks were reachable by nothing until the tabs
      // arrived; they have a home now and it is the only one.
      done: listing.done,
      // The search panel: one entry per group, each carrying its own header and
      // its rows. `group_header` and `result_row` are the names inside it.
      results,
    },
    capture,
  };
}
