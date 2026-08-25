// Cascade Part A — Gate 4. The command that runs the answer key.
//
// Gate 4 passes when every runnable case FAILS and each failure prints the
// expected value written by hand in answer_key.md. A case that passes at this
// stage is not good news: no logic exists, so agreement is coincidence and it
// would be indistinguishable from a real pass at Stage 5.
//
// Failing is not enough. The placeholder returns a fixed id and a fixed
// config_version, so a contract invariant differs on every case before the key
// is read at all: "everything failed" is true before the key exists. Each case
// that runs must therefore disagree on at least one value the key states. A
// case that fails only on invariants proves nothing here and would go green at
// Stage 5 without ever having been checked, so it fails the gate. A case that
// genuinely cannot disagree names its gate in `Handled by` and is not run.
//
// No expected value is written in this file. Every value compared is read out
// of answer_key.md at run time. What this file holds is structure: which column
// of which table is an input, which is a field, and how a section builds its
// typed line. If an expected value ever appears below, the key has been forked
// and the gate is worthless.
//
// Run: node gate4.mjs  [--section A] [--verbose]

import { readFileSync } from "node:fs";
import { partAConfig } from "./shell/config.js";

const KEY = new URL("./answer_key.md", import.meta.url);
const argv = process.argv.slice(2);
const only = argv.includes("--section") ? argv[argv.indexOf("--section") + 1] : null;
const verbose = argv.includes("--verbose");
// `--placeholder` is gone with the Stage 3 file it ran against (session 137).
const _engine = await import("./shell/resolve.js");
const { resolve } = _engine;
// The model loads behind the app; a runner is the one caller that must not race it.
if (_engine.lemmaReady) await _engine.lemmaReady;

// A fixed input, not an answer. Any UUID v7 would do.
const NEW_ID = "019876e2-0000-7000-8000-000000000000";

const src = readFileSync(KEY, "utf8");

// The same command is read differently either side of Stage 5. At Stage 4 a case
// that agrees with the placeholder tests nothing, so every case must fail. From
// Stage 5 a case that fails names a rule not yet written, so the count that
// matters inverts. The stage is read from spec.md rather than passed as a flag,
// because a flag is a second place to forget.
const STAGE = Number(
  (readFileSync(new URL("./spec.md", import.meta.url), "utf8").match(/^Current stage:\s*(\d+)/m) || [])[1]
);

// ---------------------------------------------------------------- key reading

/**
 * FIELD KINDS. Two kinds of cell, and only one of them can be wrong.
 *
 * A `fact` is a value a rule produced and the world can contradict: a weekday,
 * a title after the engine consumed words out of it, a similarity score. A
 * `choice` is a number or a label this project picked: that a `call` takes 15
 * minutes, that `pay` is a `deadline`. Nothing can contradict a choice, so a
 * choice that differs is this project changing its mind — reported, counted,
 * and NOT a failure. A fact that differs is a regression and fails the gate.
 *
 * Before this, both failed identically, so editing a guess read as breaking the
 * build. That is what made a third of the key feel impossible to keep green.
 *
 * Read out of the key at run time like every other value here. A row with an
 * `Only in` cell is scoped to those sections and beats the unscoped row for the
 * same field. Fail closed: a field compared and not classified fails the run.
 */
function readKinds(text) {
  const start = text.indexOf("## FIELD KINDS");
  if (start < 0) die("answer_key.md states no FIELD KINDS table; no cell can be read as fact or choice");
  const block = text.slice(start, text.indexOf("\n## ", start + 4));
  const general = new Map();
  const scoped = new Map(); // "letter:field" -> kind
  for (const line of block.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const c = line.trim().slice(1, -1).split("|").map((x) => x.trim());
    if (c.length < 3) continue;
    const field = (c[0].match(/^`(\w+)`$/) || [])[1];
    const kind = c[1];
    if (!field || (kind !== "fact" && kind !== "choice")) continue;
    const only = c[2].replace(/[^A-I]/g, "");
    if (only) for (const L of only) scoped.set(`${L}:${field}`, kind);
    else general.set(field, kind);
  }
  if (!general.size) die("the FIELD KINDS table declares nothing");
  return (letter, field) => scoped.get(`${letter}:${field}`) ?? general.get(field) ?? null;
}

/** `now` for every case, stated once in the key. */
function anchorFrom(t) {
  return { now: t, year: Number(t.slice(0, 4)), offset: t.slice(-6) };
}

function readAnchor(text) {
  const m = text.match(/`now` for every case:\*\*\s*`([^`]+)`/);
  if (!m) die("answer_key.md states no `now` anchor; every date case is unrunnable");
  const t = m[1];
  const year = Number(t.slice(0, 4));
  const offset = t.slice(-6);
  return { now: t, year, offset };
}

/**
 * The cases the key itself declares open, read from its closing section. Only
 * list items count. Reading the whole block meant a case mentioned in a
 * sentence there was parked without anyone deciding to park it, which is a
 * silent way out of the gate.
 */
function readParked(text) {
  const block = text.split("## Open, and blocking Gate 4")[1] || "";
  const ids = new Set();
  for (const line of block.split("\n")) {
    if (!/^\s*[-*]\s/.test(line)) continue;
    for (const id of line.match(/\b[A-I]\d+\b/g) || []) ids.add(id);
  }
  return ids;
}

// The key writes "no value" as an italic parenthetical: *(empty)*, *(none)*,
// *(no date)*. All three mean the same thing to a comparison: nothing there.
const cell = (s) =>
  s
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\*\([^)]*\)\*/g, "")
    .trim();

// An expected cell that points at something instead of stating a value. The
// runner refuses to guess what it resolves to and reports the case instead.
const REFERENCES = [/^same as input$/i, /^see /i];

// An input cell that describes more than a typed line, e.g. a line plus a tap.
const COMPOUND_INPUT = /\+.*\bchip\b/i;

/** Split a markdown file into `## X.` sections, keyed by the leading letter. */
function sections(text) {
  const out = {};
  let key = null;
  for (const line of text.split("\n")) {
    const h = line.match(/^## ([A-I])\. /);
    if (h) key = h[1];
    if (key) (out[key] ||= []).push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join("\n");
  return out;
}

/** Every table in a section, as {headers, rows}. */
function tables(text) {
  const found = [];
  let block = [];
  for (const line of text.split("\n").concat([""])) {
    if (line.startsWith("|")) block.push(line);
    else {
      if (block.length >= 3) {
        const cells = (r) => r.slice(1, -1).split("|").map((c) => c.trim());
        found.push({ headers: cells(block[0]), rows: block.slice(2).map(cells) });
      }
      block = [];
    }
  }
  return found;
}

// ------------------------------------------------------------------ structure
//
// Per section: where the typed line comes from and what the expectation is
// about. Column names only. No values.

const INPUT_COLUMNS = ["Input", "Input date part", "Existing", "New"];
// `trigram` and `word_match` are section D's workings: `resolve()` returns
// `similarity` and neither number behind it, so there is nothing to compare
// them against. They were excluded until now only because their headers carry
// no backticks, which is an accident of formatting rather than a decision.
const IGNORED_COLUMNS = ["#", "Note", "Domain", "Expected", "max", "Dialog", "Chip",
                         "Handled by", "Rejects", "Existing normalised",
                         "trigram", "word_match"];

// Where a compared value lives in what resolve() returns. Sections that state
// plain field names mean the saved record; section D names two columns that do
// not, so the manifest below says which object answers for them.
const RECORD = "task";

const SECTIONS = {
  A: {
    target: "task",
    input: (r) => r["Input"],
    columns: {
      list: { at: "list", name: "list_header" },
      due_phrase: { at: "working", name: "due_phrase" },
    },
  },
  B: {
    target: "task",
    input: (r, ctx) => composeB(r["Input date part"], ctx.body),
    columns: {
      list: { at: "list", name: "list_header" },
      due_phrase: { at: "working", name: "due_phrase" },
    },
  },
  C: { target: "task", input: (r) => r["Input"] },
  D: {
    target: RECORD,
    input: (r) => r["New"],
    // `—` is a fresh install with nothing open. ` / ` separates two open tasks,
    // which is the case that says whether the dialog names one match or all.
    existing: (r) => {
      const raws = cell(r["Existing"]);
      if (!raws || raws === "—") return [];
      const norms = cell(r["Existing normalised"]).split(" / ");
      return raws.split(" / ").map((t, i) => ({ raw_text: t.trim(), normalised: (norms[i] ?? "").trim() }));
    },
    // "max" is the similarity working value. "Dialog" says whether a dialog
    // string is there at all, so it is compared as present or absent.
    columns: {
      similarity_max: { at: "working", name: "similarity" },
      Dialog: { at: "capture", name: "duplicate_dialog", presence: (v) => /fires/i.test(v) },
      // Both live on `working`, not on the record, so they are named here
      // rather than left to the plain-field rule below.
      compare_key: { at: "working", name: "compare_key" },
      numeric_variant: { at: "working", name: "numeric_variant" },
    },
  },
  E: {
    target: "task",
    input: (r) => r["Input"],
    columns: { chip_spans: { at: "task", name: "chip_spans" } },
    columns: {
      list: { at: "list", name: "list_header" },
      due_phrase: { at: "working", name: "due_phrase" },
    },
  },
  F: {
    target: "task",
    input: (r) => r["Input"],
    columns: {
      list: { at: "list", name: "list_header" },
      due_phrase: { at: "working", name: "due_phrase" },
    },
  },
  G: { target: "task", input: (r) => r["Input"] },
  H: {
    target: "task",
    input: (r) => r["Input"],
    columns: {
      list: { at: "list", name: "list_header" },
      due_phrase: { at: "working", name: "due_phrase" },
    },
  },
  // The taps. A row states what it tapped in prose, so the runner reads that
  // column into the three inputs no other section ever sets.
  I: {
    target: "task",
    input: (r) => r["Input"],
    taps: (r) => {
      const t = cell(r["Tap"] ?? "");
      const type = /type `?(\w+)`?/.exec(t);
      const sig = /significance (\d+)/.exec(t);
      const bound = /bound to `?(\w+)`?/.exec(t);
      return {
        type_chip_tap: type ? type[1] : null,
        significance_tap: sig ? Number(sig[1]) : null,
        bound_task_id: bound ? bound[1] : null,
      };
    },
    existing: () => [{ id: "t1", title: "Reply to bharti singhal", normalised: "reply to bharti singhal" }],
    columns: {
      is_hard: { at: "working", name: "is_hard" },
      type_chip: { at: "capture", name: "type_chip" },
      add_button: { at: "capture", name: "add_button" },
      input_field: { at: "capture", name: "input_field" },
      bound_task_chip: { at: "capture", name: "bound_task_chip" },
    },
  },
};

/** Section B states one body and varies the date part around it. */
function composeB(part, body) {
  const p = cell(part);
  if (!p || /^\(no date\)$/i.test(p)) return body;
  if (p.includes("…")) return p.replace("…", body);
  return `${body} ${p}`;
}

function readBBody(text) {
  const m = text.match(/same body,\s*`([^`]+)`/);
  if (!m) die("section B states no shared body; its typed lines cannot be built");
  return m[1];
}

// ---------------------------------------------------------------- case census
//
// Every id the key mentions anywhere, so a case declared only in prose is
// counted as a gap rather than silently skipped.

function census(sectionText, letter) {
  return new Set((sectionText.match(new RegExp(`\\b${letter}\\d+\\b`, "g")) || []));
}

// Cells the key left blank in a column its own table declares. A blank passed
// silently until now: the runner skipped it and the engine could return anything.
const unfinished = [];

// A field compared with no row in FIELD KINDS. Nobody decided whether it can be
// wrong, so the run says so rather than guessing.
const unclassified = [];

function parseCases(sectionText, letter, ctx) {
  const spec = SECTIONS[letter];
  const cases = [];
  for (const t of tables(sectionText)) {
    if (t.headers[0] !== "#") continue;
    const mapped = new Set(Object.keys(spec.columns ?? {}));
    const fields = t.headers
      .map((h, i) => ({ i, name: cell(h) }))
      .filter((c) => /^`\w+`$/.test(t.headers[c.i]) && !IGNORED_COLUMNS.includes(c.name) && !mapped.has(c.name));
    for (const row of t.rows) {
      const id = cell(row[0]);
      if (!new RegExp(`^${letter}\\d+$`).test(id)) continue;
      const named = {};
      t.headers.forEach((h, i) => (named[cell(h)] = row[i] ?? ""));
      const expected = {};
      for (const f of fields) {
        const raw = row[f.i] ?? "";
        if (cell(raw) === "—") continue; // stated as not applicable
        if (!raw.trim()) { unfinished.push(`${id}: \`${f.name}\` is blank`); continue; }
        expected[f.name] = { want: cell(raw), at: RECORD };
      }
      for (const [col, m] of Object.entries(spec.columns ?? {})) {
        const raw = named[col] ?? "";
        if (cell(raw) === "—") continue;
        if (col in named && !raw.trim()) { unfinished.push(`${id}: \`${col}\` is blank`); continue; }
        if (!raw.trim()) continue;
        expected[m.name] = m.presence
          ? { want: m.presence(cell(raw)) ? "(a string)" : "", at: m.at, presence: true }
          : { want: cell(raw), at: m.at };
      }
      const rawInput = INPUT_COLUMNS.map((c) => named[c]).find((v) => v !== undefined) ?? "";
      cases.push({
        id,
        letter,
        target: spec.target,
        compound: COMPOUND_INPUT.test(rawInput),
        chip: cell(named["Chip"] ?? "") || null,
        // Every case shares the key's anchor unless its own row states one, which
        // is how a rule that reads the wall clock instead of `now` gets caught.
        now: (() => { const v = cell(named["now"] ?? ""); return v && v !== "—" ? v : null; })(),
        taps: spec.taps ? spec.taps(named) : null,
        // A case that carries its own clock writes it the way every other date is written.
        handledBy: cell(named["Handled by"] ?? "") || null,
        rejects: !!cell(named["Rejects"] ?? ""),
        existing: spec.existing ? spec.existing(named) : [],
        typed_line: spec.input ? cell(spec.input(named, ctx)) : null,
        expected,
        row: named,
        hasInput: INPUT_COLUMNS.some((c) => c in named),
      });
    }
  }
  return cases;
}

// ------------------------------------------------------------------ comparing

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The key writes dates as `Fri 7 Aug 16:30`, with seconds when they matter. The
 * weekday is not decoration: it is checked against the date, so a row that says
 * Friday about a Thursday fails here rather than being read past.
 */
function expand(value, anchor) {
  const m = String(value).match(
    /^(?:([A-Za-z]{3}) )?(\d{1,2}) ([A-Za-z]{3})(?: (\d{4}))? (\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return value;
  const mi = MONTHS.indexOf(m[3]);
  if (mi < 0) return value;
  const year = m[4] ? Number(m[4]) : anchor.year;
  if (m[1]) {
    const real = DAYS[new Date(Date.UTC(year, mi, Number(m[2]))).getUTCDay()];
    if (real !== m[1]) die(`the key says ${m[1]} for ${m[2]} ${m[3]} ${year}, which is a ${real}`);
  }
  const p = (v) => String(v).padStart(2, "0");
  return `${year}-${p(mi + 1)}-${p(m[2])}T${p(m[5])}:${m[6]}:${m[7] ?? "00"}${anchor.offset}`;
}

// A list is written out rather than stringified: `String([])` is the empty
// string, which reads as "the engine returned nothing" when it returned a list
// with nothing in it. Those are different answers.
const shown = (v) =>
  Array.isArray(v) || (v && typeof v === "object")
    ? JSON.stringify(v).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ")
    : v === "" || v === null || v === undefined
    ? "(empty)"
    : String(v);

function same(expected, actual) {
  if (expected === "") return actual === "" || actual === null || actual === undefined;
  // A ratio is a number and the key writes it to two decimals, so `1.00` and the
  // number 1 are the same value written two ways. Compared as numbers when both
  // sides are numbers, and as text otherwise.
  // A list or an object is compared as what it is. `String([])` is the empty
  // string and `Number([])` is zero, so both branches below would have read an
  // empty list as an empty value and then as the number zero.
  if (Array.isArray(actual) || (actual && typeof actual === "object")) {
    return shown(actual) === expected;
  }
  const a = Number(expected), b = Number(actual);
  if (expected.trim() !== "" && Number.isFinite(a) && Number.isFinite(b) && typeof actual !== "boolean") {
    return a === b;
  }
  return String(actual) === expected;
}

/**
 * Invariants, from the contract rather than from the key, so they hold for
 * every case without a hand-written value: raw_text is the typed line, the
 * id and clock are the ones handed in, the record carries the config in force.
 */
function invariants(input) {
  return {
    raw_text: input.typed_line,
    id: input.new_id,
    created_at: input.now,
    config_version: input.config.version,
  };
}

// ----------------------------------------------------------------- the runner

function run(c, anchor, kindOf) {
  // A chip types its words into the box, so the case's chip is appended to the
  // line rather than handed in beside it. The engine has no chip input.
  const input = {
    typed_line: c.chip ? `${c.typed_line} ${c.chip}` : c.typed_line,
    // The engine has no chip input; what it is handed is where the chip's
    // words landed in the line.
    chip_spans: c.chip
      ? [{ start: c.typed_line.length + 1, end: c.typed_line.length + 1 + c.chip.length }]
      : [],
    // Every section but I leaves all four taps unset. The spread has to come
    // last: written first it was overwritten by the nulls below it.
    type_chip_tap: null,
    significance_tap: null,
    bound_task_id: null,
    row_action: null,
    ...(c.taps ?? {}),
    now: anchor.now,
    new_id: NEW_ID,
    config: partAConfig,
    existing_tasks: c.existing,
  };

  // The placeholder logs every call. Keep the report readable unless asked.
  let out, thrown = null;
  const chatter = console.log;
  if (!verbose) console.log = () => {};
  try {
    out = resolve(input);
  } catch (e) {
    thrown = e;
  } finally {
    console.log = chatter;
  }

  // The key marks lines the screen never registers. Reaching the engine with
  // one is a defect, so the case passes only when resolve() refuses.
  if (c.rejects) {
    return thrown
      ? { id: c.id, verdict: "PASS", typed_line: c.typed_line, diffs: [], unreadable: [] }
      : { id: c.id, verdict: "FAIL", typed_line: c.typed_line, unreadable: [],
          diffs: [{ field: "resolve()", want: "throws", got: "returned a record", src: "key", kind: "fact" }] };
  }
  if (thrown) {
    return { id: c.id, verdict: "ERROR", note: `resolve() threw: ${thrown.message}`, diffs: [], unreadable: [] };
  }

  const task = out && out.task;
  if (!task) {
    return {
      id: c.id,
      verdict: "ERROR",
      note: "resolve() returned no `task`; the key targets Task fields and there is no record to read",
      diffs: [],
      unreadable: [],
    };
  }

  const diffs = [];
  const unreadable = [];
  let keyAgrees = true;
  for (const [field, e] of Object.entries(c.expected)) {
    const where = out[e.at];
    // Classified when it is COMPARED, not when it differs. Looking the kind up
    // only inside the failure branch meant an unclassified field was invisible
    // for exactly as long as it agreed, which is every run until the one that
    // needed it.
    const kind = kindOf(c.letter, field);
    if (!kind) unclassified.push(`${c.id}: \`${field}\` is compared and FIELD KINDS does not classify it`);
    if (REFERENCES.some((p) => p.test(e.want))) {
      unreadable.push(`${field}: the key states ${JSON.stringify(e.want)}, a reference rather than a value`);
      continue;
    }
    if (!where || !(field in where)) {
      diffs.push({ field, want: shown(e.want), got: `(no such field on ${e.at})`, src: "key", kind: "fact" });
      keyAgrees = false;
      continue;
    }
    const got = where[field];
    const ok = e.presence
      ? (e.want === "" ? got === null || got === "" : typeof got === "string" && got !== "")
      : same(expand(e.want, anchor), got);
    if (!ok) {
      diffs.push({
        field,
        want: shown(e.presence ? e.want : expand(e.want, anchor)),
        got: shown(got),
        src: "key",
        kind: kind ?? "fact", // an unclassified field is treated as a fact and the run fails anyway
      });
      keyAgrees = false;
    }
  }
  for (const [field, want] of Object.entries(invariants(input))) {
    if (!same(want, task[field])) {
      diffs.push({ field, want: shown(want), got: shown(task[field]), src: "contract", kind: "fact" });
    }
  }

  // A case whose only differences are choices has not broken. It says the
  // project changed its mind about a number, which is a thing to read, not fix.
  const hard = diffs.filter((d) => d.kind !== "choice");
  return {
    id: c.id,
    verdict: hard.length ? "FAIL" : diffs.length ? "CHOICE" : "PASS",
    choices: diffs.filter((d) => d.kind === "choice").length,
    typed_line: c.typed_line,
    diffs,
    unreadable,
    // A failure the key did not cause. Counted separately; it fails the gate.
    nonDiagnostic: hard.length > 0 && keyAgrees,
    note:
      hard.length && keyAgrees
        ? "every key-stated field agreed; this case fails on contract invariants only, so it tests nothing"
        : null,
  };
}

// -------------------------------------------------------------------- reports

function die(msg) {
  console.error(`gate4: ${msg}`);
  process.exit(2);
}

const anchor = readAnchor(src);
const kindOf = readKinds(src);
const parked = readParked(src);
const secs = sections(src);
const letters = Object.keys(SECTIONS).filter((l) => secs[l] && (!only || only === l));

let declared = 0;
const results = [];
const skipped = [];

for (const letter of letters) {
  const text = secs[letter];
  const ctx = letter === "B" ? { body: readBBody(text) } : {};
  const ids = census(text, letter);
  declared += ids.size;

  const cases = parseCases(text, letter, ctx);
  const seen = new Set(cases.map((c) => c.id));
  for (const id of [...ids].sort()) {
    if (!seen.has(id)) skipped.push({ id, why: "declared in prose, not in a case table" });
  }

  console.log(`\n── ${letter} ${"─".repeat(60)}`);
  for (const c of cases.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }))) {
    if (c.handledBy) {
      skipped.push({ id: c.id, why: `not a resolve() case; the key hands it to: ${c.handledBy}` });
      continue;
    }
    if (c.compound) {
      skipped.push({ id: c.id, why: "the input cell states a typed line and a tap together; the runner cannot build one input from it" });
      console.log(`  SKIP  ${c.id.padEnd(4)} ${c.typed_line ?? ""}`);
      continue;
    }
    if (parked.has(c.id)) {
      skipped.push({ id: c.id, why: "parked: the key marks it open, so there is nothing definite to fail against" });
      console.log(`  PARK  ${c.id.padEnd(4)} ${c.typed_line ?? ""}`);
      continue;
    }
    if (c.target === "prose") {
      skipped.push({ id: c.id, why: "expectation is prose, not field and value" });
      continue;
    }
    if (c.target === "duplicate") {
      skipped.push({ id: c.id, why: "no input carries the existing task set; `CaptureInput` has nine inputs and none is a store" });
      continue;
    }
    if (!Object.keys(c.expected).length && !c.rejects) {
      skipped.push({ id: c.id, why: "the table states no field and value to compare" });
      continue;
    }

    const r = run(c, c.now ? anchorFrom(expand(c.now, anchor)) : anchor, kindOf);
    results.push(r);
    console.log(`  ${r.verdict.padEnd(5)} ${r.id.padEnd(4)} ${JSON.stringify(c.typed_line)}`);
    if (r.note) console.log(`        note: ${r.note}`);
    for (const u of r.unreadable) console.log(`        unread: ${u}`);
    for (const d of r.diffs) {
      if (!verbose && d.src === "contract" && r.diffs.some((x) => x.src === "key")) continue;
      const tag =
        d.src === "contract" ? "  [contract invariant]" : d.kind === "choice" ? "  [choice, not a failure]" : "";
      console.log(`        ${d.field.padEnd(17)} expected ${d.want.padEnd(34)} got ${d.got}${tag}`);
    }
  }
}

const failed = results.filter((r) => r.verdict === "FAIL").length;
const passed = results.filter((r) => r.verdict === "PASS").length;
const moved = results.filter((r) => r.verdict === "CHOICE");
const errored = results.filter((r) => r.verdict === "ERROR").length;
const blind = results.filter((r) => r.nonDiagnostic);

console.log(`\n${"═".repeat(66)}`);
console.log(`declared in the key   ${declared}`);
console.log(`run                   ${results.length}`);
console.log(`  failed              ${failed}`);
console.log(`    on the key        ${failed - blind.length}`);
console.log(`    on invariants only ${blind.length}`);
console.log(`  passed              ${passed}`);
console.log(`  choice moved        ${moved.length}   (a value this project picked, changed; not a failure)`);
console.log(`  errored             ${errored}`);
console.log(`not run               ${skipped.length}`);

const byWhy = {};
for (const s of skipped) (byWhy[s.why] ||= []).push(s.id);
for (const [why, ids] of Object.entries(byWhy)) {
  console.log(`  ${ids.sort((a, b) => a.localeCompare(b, "en", { numeric: true })).join(" ")}`);
  console.log(`      ${why}`);
}

if (blind.length) {
  console.log(`\n${blind.map((r) => r.id).join(" ")}`);
  console.log("      failed on a contract invariant and on nothing the key states.");
  console.log("      Either state a value the placeholder cannot return, or name the");
  console.log("      gate that answers the case in a `Handled by` cell.");
}

if (moved.length) {
  console.log(`\n${moved.map((r) => r.id).join(" ")}`);
  console.log("      differ only on a `choice` field. Nothing is broken: a number or a");
  console.log("      label this project picked has changed. Update the key, or change it back.");
}

if (unclassified.length) {
  console.log(`\n${unclassified.length} field(s) compared with no row in FIELD KINDS:`);
  for (const u of unclassified) console.log(`      ${u}`);
  console.log("      Classify it as `fact` or `choice`. An unclassified cell is one nobody decided about.");
}

if (!STAGE) die("spec.md states no current stage; the run has no reading");

if (unfinished.length) {
  console.log(`\n${unfinished.length} cell(s) blank in a column their own table declares:`);
  for (const u of unfinished) console.log(`      ${u}`);
  console.log("      A blank is not an assertion. State the value, or write — for not applicable.");
}

const complete =
  results.length > 0 && blind.length === 0 && errored === 0 && unfinished.length === 0 && unclassified.length === 0;
const ok =
  STAGE <= 4
    ? complete && failed === results.length
    : complete && failed === 0;

const why = () => {
  if (unclassified.length) return `${unclassified.length} compared field(s) FIELD KINDS does not classify`;
  if (unfinished.length) return `${unfinished.length} cell(s) the key leaves blank`;
  if (errored) return `${errored} case(s) could not be evaluated`;
  if (blind.length) return `${blind.length} case(s) failed on contract invariants alone and test nothing`;
  if (STAGE <= 4) return `${passed} case(s) agreed with a placeholder that holds no logic`;
  return `${failed} case(s) name a rule not yet written`;
};

console.log(
  `\nGATE 4 (stage ${STAGE}): ${ok ? "PASS" : "FAIL"} — ${
    ok
      ? STAGE <= 4
        ? "every case run disagreed with the placeholder on a value the key states"
        : "every case run agrees with the engine on every fact it states"
      : why()
  }`
);
if (STAGE > 4 && !ok && !errored && !blind.length) {
  console.log(`      ${passed} of ${results.length} agree. Stage 5 is finished when that is all of them.`);
}
process.exit(ok ? 0 : 1);
