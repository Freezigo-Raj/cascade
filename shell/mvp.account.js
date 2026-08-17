// Cascade Part A — screen 3, the account.
//
// It exists because there was no way out. Sign-in had a screen from session 96
// and sign-out had no control anywhere in the app, so leaving an account meant
// clearing browser storage by hand. That is the whole reason this screen is
// here; everything else on it is what a person needs to see before pressing it.
//
// The four counts are read from the same store the list reads and are not
// stored anywhere. They are the only numbers in the app a person is shown, and
// they are allowed because none of them is a per-task guess: a count of rows is
// a fact, where `est_duration_min` is a default. The quiet-fields rule is about
// guesses appearing as though they were measurements, and it stands.
//
// The export is the answer to the one failure that gets worse every day: the
// tasks live in one account and one browser cache and there is no other copy.
// It writes what the store holds, unchanged, so a restore later reads records
// this version wrote rather than a shape invented for the file.

const v = new URL(import.meta.url).search;
const { tasks, undo, mode } = await import(`./store.select.js${v}`);
const { account } = await import(`./auth.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);

const open = (t) => t.task_state === "ready" && !t.archived;

/**
 * @param {HTMLElement} root
 * @param {object} on  { onBack, onSignedOut }
 */
export function mountAccount(root, { onBack, onSignedOut } = {}) {
  let all = [];
  let undos = [];
  let who = null;
  let busy = false;

  function count(label, n) {
    const line = el("div", "stat");
    line.appendChild(el("span", "stat-label", label));
    line.appendChild(el("span", "stat-value", String(n)));
    return line;
  }

  /** One file, the records as stored, and the date in the name so two are not one. */
  async function exportAll() {
    const stamp = new Date().toISOString().slice(0, 10);
    const body = JSON.stringify({ exported_at: new Date().toISOString(), tasks: all }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cascade-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    if (busy) return;
    busy = true;
    await account.signOut();
    onSignedOut && onSignedOut();
  }

  function draw() {
    root.innerHTML = "";

    const bar = el("div", "bar");
    bar.appendChild(button("act", "\u2039 Back", () => onBack && onBack()));
    root.appendChild(bar);

    const who_ = el("div", "group");
    who_.appendChild(el("div", "label", "Account"));
    // Local mode is a real answer, not a failure: `env.js` is empty and the
    // store is the browser's. Saying so is better than an empty line, because
    // nothing on this screen would otherwise explain a missing sign-out.
    who_.appendChild(el("div", "said",
      who ? who.email : mode === "local" ? "Running on this device only. No account." : "Signed in."));
    root.appendChild(who_);

    const stats = el("div", "group");
    stats.appendChild(el("div", "label", "This device"));
    stats.appendChild(count("Open tasks", all.filter(open).length));
    stats.appendChild(count("Done", all.filter((t) => t.task_state === "done").length));
    stats.appendChild(count("Repeating", all.filter((t) => open(t) && t.recurrence).length));
    stats.appendChild(count("Undo held", undos.length));
    root.appendChild(stats);

    const out = el("div", "group");
    out.appendChild(el("div", "label", "Your data"));
    out.appendChild(button("act", "Export tasks (JSON)", exportAll));
    out.appendChild(el("div", "said",
      "Every task as it is stored, in one file. Alarms are recorded and ring nothing until Part B."));
    root.appendChild(out);

    if (who) {
      const bye = el("div", "group");
      bye.appendChild(el("div", "label", "Leaving"));
      bye.appendChild(button("act", "Sign out", signOut));
      // The cache is emptied on sign-out, which is session 96's rule and is the
      // one consequence a person cannot see coming. It is said here rather than
      // in a dialog, because a dialog on the way out is a fourth interruption.
      bye.appendChild(el("div", "said",
        "This clears the copy held on this device. Anything not yet synced is lost."));
      root.appendChild(bye);
    }
  }

  (async () => {
    all = await tasks.all();
    undos = await undo.all();
    who = await account.current();
    draw();
  })();
}
