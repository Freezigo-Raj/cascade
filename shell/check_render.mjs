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
const E = readFileSync(new URL("../example.md", import.meta.url), "utf8").split("\n");
const at = E.findIndex((l) => l.includes("│ Call markan morning"));
const want = E.slice(at - 1, at + 4).join("\n");

const out = resolve({ typed_line: "Call markan morning", now: "2026-08-03T10:40:00+05:30",
                      new_id: "", config: partAConfig, row_action: null,
                      bound_task_id: null, type_chip_tap: null,
                      significance_tap: 70, existing_tasks: [] });
const full = renderDefaultList(out.list, out.capture).split("\n");
const got = full.slice(-6, -1).join("\n");

if (got === want) { console.log("RENDER: exact match with the example typed capture row"); process.exit(0); }
console.log("RENDER: differs\n");
const a = want.split("\n"), b = got.split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) console.log(`line ${i + 1}\n  example ${JSON.stringify(a[i])}\n  shell   ${JSON.stringify(b[i])}`);
}
process.exit(1);
