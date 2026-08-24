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
// It is also the only place in the app that says which version is running. That
// mattered the moment a design change landed and the browser went on serving the
// previous stylesheet: there was no way to tell a build that had not arrived from
// a build that had arrived and looked wrong.
//
// The export is the answer to the one failure that gets worse every day: the
// tasks live in one account and one browser cache and there is no other copy.
// It writes what the store holds, unchanged, so a restore later reads records
// this version wrote rather than a shape invented for the file.

const v = new URL(import.meta.url).search;
const { tasks, undo, mode } = await import(`./store.select.js${v}`);
const { account } = await import(`./auth.js${v}`);
const { partAConfig } = await import(`./config.js${v}`);
const { SHELL_VERSION } = await import(`./render.js${v}`);
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
  ["Alarms in the browser", "A web page cannot wake a phone, loop a sound through Do Not Disturb, or draw over a lock screen. The Android build rings; this copy records the alarm and stays quiet. Not a gap: a decision about where ringing lives.", "decided"],
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
      "Every task as it is stored, in one file."));
    root.appendChild(out);

    // What is running. `shell` is the number `index.html` loads the stylesheet
    // under and `gate2.py` holds those two together, so a mismatch on screen is
    // a browser serving something old rather than a repository disagreeing with
    // itself. `config` is the version every task captured now is stamped with.
    const build = el("div", "group");
    build.appendChild(el("div", "label", "This build"));
    const shell = el("div", "stat");
    shell.appendChild(el("span", "stat-label", "Shell"));
    shell.appendChild(el("span", "stat-value", String(SHELL_VERSION)));
    build.appendChild(shell);
    const conf = el("div", "stat");
    conf.appendChild(el("span", "stat-label", "Config"));
    conf.appendChild(el("span", "stat-value", partAConfig.version));
    build.appendChild(conf);
    build.appendChild(el("div", "said",
      "If the app looks like the last version, this number is how you tell. A phone can hold on to an old copy; closing the app fully and opening it again fetches this one."));
    root.appendChild(build);

    // WHETHER ANYTHING CAN RING, and it says so rather than being inferred. Two
    // installs of this app look identical on a phone: the browser's own home
    // screen shortcut and the Android APK. Only the second carries the alarm
    // plugin, and until this block existed a silent alarm had three possible
    // causes and no way to tell them apart. A permission is asked for here, on a
    // press, and not at launch: a prompt with no reason attached gets refused.
    const ring = el("div", "group");
    ring.appendChild(el("div", "label", "Alarms"));
    const shellRow = el("div", "stat");
    shellRow.appendChild(el("span", "stat-label", "Alarm shell"));
    const shellVal = el("span", "stat-value", "checking");
    shellRow.appendChild(shellVal);
    ring.appendChild(shellRow);
    const said = el("div", "said", "");
    ring.appendChild(said);
    root.appendChild(ring);

    (async () => {
      try {
        const bridge = await import(`./alarm.bridge.js${v}`);
        if (!bridge.isNativeShell()) {
          shellVal.textContent = "not present";
          said.textContent = "This is the browser copy, so nothing can ring: a web page cannot wake a phone, sound through Do Not Disturb, or draw over a lock screen. Install the Android build to get alarms. Everything else works here.";
          return;
        }
        shellVal.textContent = "present";

        // ONE ROW PER PERMISSION, each with its own state and its own button.
        // They fail differently — one silences the app, one moves the ring, one
        // takes the lock screen away — so "something is missing" is not an
        // answer a person can act on. Redrawn on every visit, because the only
        // way to learn what Android granted is to ask it again.
        const draw = async () => {
          for (const dead of [...ring.querySelectorAll("[data-perm]")]) dead.remove();
          // TWO BUILDS IN ONE APP (session 119). The web half updates itself on
          // every open; the Kotlin half only changes when the APK is rebuilt.
          // When the plugin is older than this screen, its readings are not
          // wrong — they are absent, and every row used to dress that absence
          // as `off` while every button called a method that was not there and
          // failed silently. The difference is now the first thing said.
          const shellBuild = await bridge.alarmShellVersion();
          const stale = shellBuild < bridge.ALARM_SHELL_EXPECTED;
          if (stale) {
            const loud = el("div", "said",
              `The alarm shell inside this APK is build ${shellBuild} and the app expects build ${bridge.ALARM_SHELL_EXPECTED}. ` +
              "The web half updates itself; the Kotlin half cannot. Rebuild and reinstall the APK, then come back here. " +
              "A row reading `unknown` below is a switch this old shell cannot read.");
            loud.dataset.perm = "stale";
            ring.appendChild(loud);
          }
          // THE APK, ONE PRESS AWAY (session 129, his ask). A sentence telling
          // a person to rebuild and reinstall is only useful to the person who
          // can build it; a link is useful to everyone else, and the sentence
          // above is exactly where somebody reads that they need one.
          //
          // It is drawn whether or not the shell is stale, because the other
          // reason to want it is having no APK at all.
          const apk = el("a", "act apk-link", "Download the alarm APK");
          apk.href = "https://freezigo-raj.github.io/cascade/app-debug.apk";
          apk.setAttribute("download", "");
          apk.rel = "noopener";
          ring.appendChild(apk);
          const p = await bridge.alarmPermissionStatus();
          said.textContent = p.needed
            ? "Each of these is a switch Android holds and the app cannot set. What is missing is listed below."
            : stale ? "" : "Alarms can ring, on the lock screen, on time.";
          for (const x of bridge.PERMISSIONS) {
            const known = typeof p[x.key] === "boolean";
            const row = el("div", "stat");
            row.dataset.perm = x.key;
            row.appendChild(el("span", "stat-label", x.label));
            row.appendChild(el("span", "stat-value", known ? (p[x.key] ? "on" : "off") : "unknown"));
            ring.appendChild(row);
            // A button on `off` AND on `unknown` (session 121, his call): a
            // switch the old shell cannot read may still be off, and a person
            // staring at `unknown` with nothing to press is stuck. Pressing it
            // on a too-old shell answers with the rebuild sentence below.
            if (p[x.key] === true) continue;
            // The reason sits with the switch rather than in a paragraph above
            // it: a person reading a row wants to know what THIS one costs.
            const note = el("div", "said", x.why);
            note.dataset.perm = x.key;
            ring.appendChild(note);
            const go = button("act", `Turn on ${x.label.toLowerCase()}`, async () => {
              const opened = await bridge.requestAlarmPermission(x.key);
              // A press that cannot work says so, once, where it was pressed.
              if (!opened) {
                const why = el("div", "said",
                  "This APK is too old to open that screen. Rebuild and reinstall it.");
                why.dataset.perm = x.key;
                go.after(why);
              }
            });
            go.dataset.perm = x.key;
            ring.appendChild(go);
          }
          if (p.needed) {
            const all = button("act", "Ask for everything missing", async () => {
              await bridge.requestAlarmPermissions();
            });
            all.dataset.perm = "all";
            ring.appendChild(all);
            const again = el("div", "said",
              "Android shows one screen at a time and each has to be closed before the next appears. Come back here afterwards to see what it granted.");
            again.dataset.perm = "all";
            ring.appendChild(again);
          }
        };
        await draw();
        // Coming back from a system screen is the only moment the answers can
        // have changed, and it is the moment a person is looking at this list.
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) draw().catch(() => {});
        });
      } catch (e) {
        shellVal.textContent = "unknown";
        said.textContent = "The alarm module did not load: " + (e?.message ?? e);
      }
    })();

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
