// Cascade Part A — what a chip does to the words in the box.
//
// A date arrives one way, through the words in the box. Every chip types words
// and nothing on screen 2 sets a date field directly, so all four chips, both
// pickers and the tick chip come down to the same three edits on one string.
//
// Pure on purpose: string in, string and span out. Splitting it off the screen
// keeps `mvp.edit.js` under the cap and makes the one part of the chip rule
// that is arithmetic readable without a browser.
//
// The span is where the last tapped words landed. A second tap replaces the
// first rather than adding to it, so two taps never leave two dates in a line.
// The screen clears the span on any keystroke afterwards, which is what makes
// "a tapped date beats a typed one" true only while the tap was the last thing
// that happened.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `20 Aug`, and `20 Aug 2027` only when the year is not this one. */
export function dateWords(iso, year) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}` + (y === year ? "" : ` ${y}`);
}

/** `5pm`, `5:30pm`, `12am` — the five shapes the date rule reads, in one. */
export function timeWords(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? ":" + String(m).padStart(2, "0") : ""}${suffix}`;
}

/**
 * A chip's words go where the last chip's words were, or on the end.
 * @returns {{ line: string, span: {start:number,end:number} }}
 */
export function typeInto(line, span, words) {
  if (span) {
    return {
      line: line.slice(0, span.start) + words + line.slice(span.end),
      span: { start: span.start, end: span.start + words.length },
    };
  }
  const stem = line.replace(/\s+$/, "");
  const start = stem ? stem.length + 1 : 0;
  return { line: (stem ? stem + " " : "") + words, span: { start, end: start + words.length } };
}

/**
 * A picked time is written beside the picked date rather than after the
 * sentence, because `20 Aug 5:30pm` is one expression and `20 Aug ... 5:30pm`
 * is two dates with words between them.
 */
export function typeBeside(line, span, words) {
  if (!span) return typeInto(line, span, words);
  const at = span.end;
  return {
    line: line.slice(0, at) + " " + words + line.slice(at),
    span: { start: span.start, end: at + 1 + words.length },
  };
}

/**
 * The tick chip shows the date the engine read; tapping it takes exactly those
 * words back out. Walked from the end so an earlier removal cannot move a later
 * offset.
 */
export function removeSpans(line, spans) {
  if (!spans || !spans.length) return { line, span: null };
  const out = [...spans]
    .sort((a, b) => b.start - a.start)
    .reduce((t, r) => t.slice(0, r.start) + t.slice(r.end), line)
    .replace(/\s+/g, " ")
    .trim();
  return { line: out, span: null };
}
