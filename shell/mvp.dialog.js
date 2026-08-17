// Cascade Part A — the one dialog.
//
// MVP.md counts one dialog, not two. The duplicate warning and the clash
// warning are the same interruption arriving for two reasons, and a person who
// has typed a line that is both a repeat and a collision should be stopped
// once and told both things, rather than pressing [Add anyway] twice.
//
// Neither fires while typing. The duplicate fires on Add; the clash fires on
// Add, on save and on a push. Both are asked here, so the two callers cannot
// draw the same question two ways.
//
// Cancel resolves false and changes nothing. The caller keeps the typed text,
// which is the whole reason Cancel is worth offering: the line is nearly right
// and is about to be edited.

/**
 * @param {string[]} lines  one or two sentences, already written by the engine
 * @param {string} goLabel  `Add anyway` on a capture, `Save anyway` on an edit
 * @returns {Promise<boolean>} true to go ahead
 */
export function ask(lines, goLabel) {
  const said = lines.filter(Boolean);
  if (!said.length) return Promise.resolve(true);

  return new Promise((settle) => {
    const veil = document.createElement("div");
    veil.className = "veil";
    veil.dataset.dialog = "1";
    const box = document.createElement("div");
    box.className = "dialog";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    for (const line of said) {
      const p = document.createElement("p");
      p.className = "dialog-said";
      p.textContent = line;
      box.appendChild(p);
    }

    const row = document.createElement("div");
    row.className = "dialog-acts";
    const close = (answer) => { veil.remove(); document.removeEventListener("keydown", onKey); settle(answer); };
    const onKey = (e) => { if (e.key === "Escape") close(false); };

    // Cancel is first in the source and last on the row, so the destructive
    // reading — press the nearest thing — lands on the one that changes nothing.
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "act";
    // Marked so a back gesture can find it. A dialog is the nearest thing on the
    // screen, so a back aimed at anything is most likely aimed at closing it.
    cancel.dataset.cancel = "1";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => close(false));

    const go = document.createElement("button");
    go.type = "button";
    go.className = "act go";
    go.textContent = goLabel;
    go.addEventListener("click", () => close(true));

    row.appendChild(cancel);
    row.appendChild(go);
    box.appendChild(row);
    veil.appendChild(box);
    veil.addEventListener("click", (e) => { if (e.target === veil) close(false); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(veil);
    go.focus();
  });
}
