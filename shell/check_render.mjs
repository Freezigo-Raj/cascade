// Headless Gate 3 harness: does the placeholder, rendered, equal example section 1?
import { readFileSync } from "node:fs";
import { resolve } from "./resolve.js";
import { renderDefaultList } from "./render.js";
import { partAConfig } from "./config.js";

// Section 2's capture row, which is the one the example draws for a line that
// has been typed. Section 1's panel shows an empty box and `resolve()` refuses
// an empty line, so that panel is not something this engine can produce: the
// harness compared against it for as long as `chip_row` was a copied constant,
// and stopped the moment a rule wrote the field.
// The window is found, not counted. It ran from `at - 1` to `at + 4` for five
// sessions, which was exactly right while the chip row was two lines and wrong
// the moment a longer label wrapped it to three: the check then compared five
// lines of panel against five lines that started one row further down and
// reported every one of them as a difference. It reads from the box down to the
// panel's closing rule instead, so a chip row is free to grow.
const E = readFileSync(new URL("../example.md", import.meta.url), "utf8").split("\n");
const at = E.findIndex((l) => l.includes("│ Call markan morning"));
const shut = E.findIndex((l, i) => i > at && l.startsWith("└"));
const want = E.slice(at - 1, shut).join("\n");

const out = resolve({ typed_line: "Call markan morning", now: "2026-08-03T10:40:00+05:30",
                      new_id: "", config: partAConfig, row_action: null,
                      bound_task_id: null, type_chip_tap: null,
                      significance_tap: 70, existing_tasks: [] });
const full = renderDefaultList(out.list, out.capture).split("\n");
const box = full.findIndex((l) => l.includes("│ Call markan morning"));
const got = full.slice(box - 1, full.length - 1).join("\n");

if (got === want) { console.log("RENDER: exact match with the example typed capture row"); process.exit(0); }
console.log("RENDER: differs\n");
const a = want.split("\n"), b = got.split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) console.log(`line ${i + 1}\n  example ${JSON.stringify(a[i])}\n  shell   ${JSON.stringify(b[i])}`);
}
process.exit(1);
