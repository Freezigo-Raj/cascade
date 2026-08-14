// Cascade Part A — Stage 3 output screen.
//
// Padding only. This file decides where characters sit, never what they say.
// Every string it draws came out of resolve().

// The shell's own version, so Gate 3's signature has something to go stale
// against. It lives here because render.js is the file Gate 3 is about: the
// panel is what the hand checks. Bump it when anything under shell/ that the
// panel depends on changes. `gate2.py` reads it and VERSIONS in spec.md states
// it, the same way config.ts states its own.
export const SHELL_VERSION = 20;

export const W = 68; // total panel width, from spec/example.md section 1

const IN = W - 2; // interior columns between the two box characters

function row(text) {
  if (text.length > IN) {
    throw new Error(`render.js: row overflows the panel by ${text.length - IN}: ${text}`);
  }
  return "│" + text + " ".repeat(IN - text.length) + "│";
}

const rule = (l, m, r) => l + "─".repeat(IN) + r;

/** Title on its own line, the sentence under it when there is one. */
function card(c, badgeCol) {
  // Title, then the sentence if there is one. No badge on any row: duration is
  // the engine's to reason with and the verb without it explained nothing.
  const lines = [row("   " + c.card_title)];
  if (c.card_reason) lines.push(row("   " + c.card_reason));
  return lines;
}

/**
 * @param {ListView} list
 * @param {CaptureView} capture
 * @param {{ badgeCol: number }} opts  badgeCol is the interior column the badge ends at
 */
export function renderDefaultList(list, capture, opts = { badgeCol: IN - 2 }) {
  // The heading names the list being drawn, which is always Default here: the
  // first screen draws Default only. `list_header` is a fact about the task
  // being typed, not about this panel, and drawing it here made the heading
  // flip to `Ideas` mid-sentence while the Default list sat underneath it.
  // Nothing could see that until the cards stopped being constants.
  const out = [rule("┌", "", "┐"), row("  " + (opts.heading ?? "Default")), rule("├", "", "┤")];

  out.push(row(""));
  for (const c of list.cards) {
    out.push(...card(c, opts.badgeCol));
    out.push(row(""));
  }

  out.push(rule("├", "", "┤"));

  // The search panel, drawn only when a query produced one. A box inside the
  // box, because it belongs to the line being typed rather than to the list.
  // Two leading columns, two trailing, so the corners sit under nothing.
  if (list.results && list.results.length) {
    const inner = IN - 6;
    const line = (content) => row("  \u2502" + content.padEnd(inner) + "\u2502  ");
    const cap = "\u2500\u2500\u2500\u2500 results ";
    out.push(row("  \u250c" + cap + "\u2500".repeat(inner - cap.length) + "\u2510  "));
    for (const g of list.results) {
      out.push(line("  " + g.group_header));
      for (const r of g.rows) {
        // The right-hand half is fixed width, so a long title is cut rather
        // than pushing the line past the border. A row that will not fit is a
        // row nobody reads: it threw before this, on the first real query.
        const room = inner - 6 - 2 - r.result_row.length;
        const title = r.title.length > room ? r.title.slice(0, room - 1) + "\u2026" : r.title;
        out.push(line("      " + title.padEnd(room) + " " + r.result_row + " "));
      }
    }
    out.push(row("  \u2514" + "\u2500".repeat(inner) + "\u2518  "));
    out.push(rule("\u251c", "", "\u2524"));
  }

  const boxW = 48;
  const btnW = 8;
  out.push(row("  ┌" + "─".repeat(boxW) + "┐  ┌" + "─".repeat(btnW) + "┐  "));
  const label = capture.add_button;
  const lpad = Math.floor((btnW - label.length) / 2);
  // The box holds what was typed. Blank before anything is.
  const typed = (capture.typed_line ?? "").slice(0, boxW - 1);
  out.push(
    row("  │" + (typed ? " " + typed.padEnd(boxW - 1) : " ".repeat(boxW)) +
        "│  │" + " ".repeat(lpad) + label +
        " ".repeat(btnW - label.length - lpad) + "│  ")
  );
  out.push(row("  └" + "─".repeat(boxW) + "┘  └" + "─".repeat(btnW) + "┘  "));

  // The chips wrap rather than drop: the example puts `[Pick date][Park]` on a
  // second line once a parsed chip has taken the space on the first.
  //
  // The budget is IN - 2 for the lead and one more for the space inside the
  // border, which every chip line carries. At IN - 2 the six presets fit exactly
  // and left nothing for the tail below, so the empty screen — the one the app
  // opens on — threw out of `row()` rather than drawing.
  const chips = list.chip_row.map((c) => `[${c}]`);
  const lines = [[]];
  let width = 0;
  for (const c of chips) {
    if (width + c.length > IN - 3) { lines.push([]); width = 0; }
    lines[lines.length - 1].push(c);
    width += c.length;
  }
  for (const l of lines.slice(0, -1)) out.push(row("  " + l.join("")));

  // The last chip line shares its row with the type chip and the significance
  // buttons. With no text typed there is no type chip and the gap is empty.
  const last = "  " + lines[lines.length - 1].join("");
  const mid = capture.type_chip ?? "";
  const sig = capture.significance_row.map((b) => `[${b}]`).join("");
  // Three spaces after the chips, then the fill, then one space inside the
  // border. This is the one layout: T14 is closed and both panels in the
  // example are drawn this way. The `· · ·` leader section 1 used is gone.
  const fill = IN - last.length - 3 - mid.length - sig.length - 1;
  if (fill < 1) {
    // The tail does not fit beside the chips, so it takes a row of its own.
    // This is the same rule as the chips above: wrap rather than drop. The
    // clamp that stood here instead turned a line one column too long into a
    // thrown error, and the state that reached it is an ordinary one — six
    // presets on screen because no date was read, with a type chip beside
    // them. The example never had both at once, so nothing saw it.
    out.push(row(last));
    const tailFill = Math.max(1, IN - 2 - mid.length - sig.length - 1);
    out.push(row("  " + mid + " ".repeat(tailFill) + sig + " "));
  } else {
    out.push(row(last + "   " + mid + " ".repeat(fill) + sig + " "));
  }

  out.push(rule("└", "", "┘"));
  return out.join("\n");
}
