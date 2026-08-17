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
// It also carries the NOT BUILT register: every control the design draws, or
// the record carries, that has no working control behind it yet. It lives on a
// screen rather than only in `MVP.md` because a gap nobody can see is a gap that
// gets rediscovered, and this project has rediscovered four of them.
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
 * Drawn but dead, or in the design and not drawn at all. Each line names the
 * thing, why it does not work, and which Part owns it.
 *
 * The rule for being on this list: a person could reasonably expect it to work.
 * Decisions that went the other way on purpose are here too, marked `decided`,
 * because "we chose not to" and "we have not got to it" are different answers
 * and the second one is the only one worth chasing.
 */
const NOT_BUILT = [
  ["Alarms ring", "Every alarm is recorded and nothing fires. A browser cannot wake itself, so the scheduler is Part B.", "Part B"],
  ["Reminder timing", "Lead times, repeats and the notification budget are set and read by nothing yet.", "Part B"],
  ["Workflow", "One task activating the next. Decided in full — dependencies, and/or, if/else, bounded loops — and no column exists yet.", "Part C"],
  ["Projects", "`project_id` is on every record and nothing writes it. No grouping screen.", "Part C"],
  ["Cancel and Archive", "Both are `row_action` members with no control anywhere. A row carries Pin, Delete and its push targets.", "decided"],
  ["Swipe on a row", "Buttons only, no gesture. A control hidden behind a swipe cannot be found by reading the screen.", "decided"],
  ["Notes on a row", "Notes are read in the editor and never previewed on a row, which stays a title and a sentence.", "decided"],
  ["Delivery channels", "The design offers alarm, notification and in-app. The record holds one alarm field, not three channels.", "later"],
  ["Streaks and percent done", "A repeat spawns its next occurrence and keeps no history of the ones before it.", "later"],
  ["People and tags", "Two vocabularies the design draws and the record has no column for.", "later"],
  ["Context", "Derived from the verb, stored, and read by nothing. Config holds two members.", "later"],
  ["Import", "The export writes a file and nothing reads one back.", "later"],
  ["Dark theme", "One set of tokens, tuned for the light ground.", "later"],
];

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

    const later = el("div", "group");
    later.appendChild(el("div", "label", "Not built yet"));
    later.appendChild(el("div", "said",
      "Everything the app or the design offers that does not work. `decided` means it was chosen against, not forgotten."));
    for (const [what, why, when] of NOT_BUILT) {
      const item = el("div", "later-item");
      item.appendChild(el("div", "what", what));
      item.appendChild(el("div", "why", why));
      item.appendChild(el("span", "when", when));
      later.appendChild(item);
    }
    root.appendChild(later);

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
