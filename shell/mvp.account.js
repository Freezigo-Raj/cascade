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
const { tasks, mode } = await import(`./store.select.js${v}`);
const { account } = await import(`./auth.js${v}`);
const { partAConfig } = await import(`./config.js${v}`);
const { SHELL_VERSION } = await import(`./version.js${v}`);
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

    // THE ANDROID APP, AND WHY IT HAS A GROUP OF ITS OWN (session 146, his
    // ask: "give a link for the APK in the app itself just like alarm apk").
    //
    // THE LINK ALREADY EXISTED AND WAS IN THE ONE PLACE IT WAS NO USE. It sat
    // inside the Alarms block, after the line that returns early when the
    // plugin is not present — so it was drawn ONLY inside the Android app, and
    // never in the browser copy, which is the only place a person would be
    // looking for it. An APK download offered exclusively to people who have
    // already installed the APK.
    //
    // It is also no longer the alarm's. The APK now carries the alarm shell and
    // the calendar shell, and naming it after one of them is how somebody comes
    // to think there are two.
    //
    // A Capacitor WebView hands a link to the system browser only when its host
    // is NOT the app's own. The app is served from `freezigo-raj.github.io` and
    // so is the APK, so every version of this link up to session 132 — plain,
    // `download`, `target="_blank"` — asked the WebView to navigate to a binary
    // on its own host, and it does nothing at all with that: no download, no
    // error, no sound. `raw.githubusercontent.com` serves the same file from a
    // DIFFERENT host, which is the whole fix.
    //
    // The address is drawn as text underneath either way. A link that silently
    // does nothing is the failure this has already had twice, and an address a
    // person can read and type is the one thing that cannot fail.
    const APK_HOST = "https://raw.githubusercontent.com/freezigo-raj/cascade/main/app-debug.apk";
    const APK_PAGE = "https://freezigo-raj.github.io/cascade/app-debug.apk";
    {
      const app = el("div", "group");
      app.appendChild(el("div", "label", "The Android app"));
      const apk = el("a", "act apk-link", "Download the Android app (APK)");
      apk.href = APK_HOST;
      apk.target = "_blank";
      apk.rel = "noopener";
      app.appendChild(apk);
      app.appendChild(el("div", "said apk-where", APK_PAGE));
      const copy = el("button", "act", "Copy the address");
      copy.type = "button";
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(APK_PAGE);
          copy.textContent = "Copied";
        } catch {
          // A clipboard refused is not a dead end: the address is already on
          // the screen above, selectable.
          copy.textContent = "Select the address above";
        }
      });
      app.appendChild(copy);
      app.appendChild(el("div", "said",
        "The alarms and the Google Calendar writing are in this build and nowhere else. A browser cannot wake a phone, ring through Do Not Disturb, draw over a lock screen, or write to a calendar. " +
        "Android will ask twice: once to allow installing from this source, and once for the app itself. Both are expected. " +
        "Installing over the version already on the phone keeps every task — nothing is signed out and nothing is lost."));
      root.appendChild(app);
    }

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
              "The web half updates itself; the Kotlin half cannot. The download is under The Android app above: install it over this one and come back here. " +
              "A row reading `unknown` below is a switch this old shell cannot read.");
            loud.dataset.perm = "stale";
            ring.appendChild(loud);
          }
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

    // THE CALENDAR (session 145, his five answers). It is OFF until he turns it
    // on here: writing to a person's main calendar is not a thing to start
    // doing because an update landed. The switch, the calendar it writes to and
    // the two permissions all live on this screen, because all four are facts
    // about THIS PHONE and none of them is a fact about the account.
    const cal = el("div", "group");
    cal.appendChild(el("div", "label", "Google Calendar"));
    const calRow = el("div", "stat");
    calRow.appendChild(el("span", "stat-label", "Calendar shell"));
    const calVal = el("span", "stat-value", "checking");
    calRow.appendChild(calVal);
    cal.appendChild(calRow);
    const calSaid = el("div", "said", "");
    cal.appendChild(calSaid);
    root.appendChild(cal);

    (async () => {
      try {
        const bridge = await import(`./calendar.bridge.js${v}`);
        if (!bridge.isCalendarShell()) {
          calVal.textContent = "not present";
          calSaid.textContent =
            "This copy cannot write to a calendar. The Android build writes tasks straight into the phone's own calendar, and Google's sync carries them up — no Google sign-in, no permissions to approve online, and it works with no signal. The download is under The Android app above. If this IS the Android build, that APK is older than this plugin and a newer one has to be installed over it.";
          return;
        }
        calVal.textContent = "present";

        const drawCal = async () => {
          for (const dead of [...cal.querySelectorAll("[data-cal]")]) dead.remove();
          const perm = await bridge.calendarPermission();
          const on = bridge.calendarOn();

          const permRow = el("div", "stat");
          permRow.dataset.cal = "perm";
          permRow.appendChild(el("span", "stat-label", "Permission"));
          permRow.appendChild(el("span", "stat-value", perm.read && perm.write ? "granted" : "not granted"));
          cal.appendChild(permRow);

          if (!perm.read || !perm.write) {
            // BOTH, AND READING IS NOT OPTIONAL. Writing alone would let the app
            // insert rows and never see them again, so every sync would be an
            // insert and the calendar would fill with copies.
            const ask = button("act", "Allow calendar access", async () => {
              await bridge.requestCalendarPermission();
              setTimeout(drawCal, 800);
            });
            ask.dataset.cal = "ask";
            cal.appendChild(ask);
            const why = el("div", "said",
              "Android asks once. Read and write together: the app has to see what it already put there, or every sync would add another copy.");
            why.dataset.cal = "why";
            cal.appendChild(why);
            return;
          }

          // WHICH CALENDAR, ALWAYS DRAWN AND ALWAYS DECIDED (session 147).
          //
          // It used to appear only when the phone had more than one writable
          // calendar, and otherwise the choice was left empty for the Kotlin to
          // make. So on a phone where nothing arrived there was no way to tell
          // WHICH calendar the app had been writing to — and "the one it picked"
          // is not an answer anybody can check. It is drawn whatever the count,
          // and the first draw WRITES the answer down, so the two halves cannot
          // hold different ideas of where the events are going.
          const list = await bridge.writableCalendars();
          const pickRow = el("div", "stat");
          pickRow.dataset.cal = "pick";
          pickRow.appendChild(el("span", "stat-label", "Writes to"));
          if (!list.length) {
            pickRow.appendChild(el("span", "stat-value", "no writable calendar"));
            cal.appendChild(pickRow);
            const none = el("div", "said",
              "This phone has no calendar the app is allowed to write to. A Google account has to be added in Android Settings, and its calendar has to be switched on in the Google Calendar app.");
            none.dataset.cal = "none";
            cal.appendChild(none);
            return;
          }
          const sel = el("select", "cal-pick");
          for (const c of list) {
            const o = el("option", "", `${c.name}${c.account && c.account !== c.name ? " · " + c.account : ""}`);
            o.value = c.id;
            sel.appendChild(o);
          }
          const already = bridge.chosenCalendar();
          const fallback = (list.find((c) => c.primary && c.google) || list.find((c) => c.google) || list[0]).id;
          sel.value = list.some((c) => c.id === already) ? already : fallback;
          if (sel.value !== already) bridge.rememberCalendar(sel.value);
          sel.addEventListener("change", () => {
            bridge.rememberCalendar(sel.value);
            if (bridge.calendarOn()) bridge.setCalendarOn(true, sel.value);
          });
          pickRow.appendChild(sel);
          cal.appendChild(pickRow);

          const sw = button("act" + (on ? " on" : ""), on ? "Turn off" : "Turn on", async () => {
            await bridge.setCalendarOn(!on, bridge.chosenCalendar());
            setTimeout(drawCal, 400);
          });
          sw.dataset.cal = "switch";
          cal.appendChild(sw);

          // SYNC NOW, AND SAY WHAT HAPPENED (session 147, his report that
          // nothing reaches the calendar). The background pass swallows every
          // failure into `console.warn`, and a phone has no console, so the
          // plugin rejecting, no writable calendar, a refused insert and simply
          // having no dated task all look identical: nothing happens.
          const now = el("button", "act", "Sync now");
          now.type = "button";
          now.dataset.cal = "now";
          const out = el("div", "said");
          out.dataset.cal = "now";
          now.addEventListener("click", async () => {
            now.textContent = "Syncing…";
            out.textContent = "";
            let r;
            try {
              r = await bridge.syncCalendarNow();
            } catch (e) {
              r = { ok: false, why: "The sync threw: " + (e?.message ?? e) };
            }
            now.textContent = "Sync now";
            const lines = [];
            if (r.tasks !== undefined) {
              lines.push(`${r.tasks} tasks, ${r.wanted} of them dated.`);
              lines.push(`The calendar already held ${r.had} from this app; wrote ${r.written}, removed ${r.removed}.`);
              if (r.nowThere !== null && r.nowThere !== undefined) lines.push(`It now holds ${r.nowThere}.`);
              lines.push(`Calendar: ${r.calendarId}.`);
            }
            if (r.why) lines.push(r.why);
            for (const e of r.errors ?? []) lines.push(e);
            if (r.ok && !lines.length) lines.push("Done.");
            out.textContent = lines.join(" ");
          });
          cal.appendChild(now);
          cal.appendChild(out);

          // ---------------------------------------------------------------
          // READING FROM THE CALENDAR (session 148). A second list, because it
          // answers a different question: `Writes to` is where tasks GO, this
          // is where events COME FROM. A phone writes to one calendar and may
          // read from five, and `Holidays in India` is readable by everybody
          // and writable by nobody.
          //
          // HIS QUESTION ANSWERED BY THIS LIST RATHER THAN BY A SETTING. There
          // is no field on a calendar row saying event, holiday or birthday:
          // each of those IS its own calendar, with its own name and its own
          // account. So ticking is the whole of the answer, and the list is
          // grouped by account because a phone with three Google accounts shows
          // three groups and he asked to choose between them.
          const readable = (await bridge.allCalendars()).filter((c) => c.visible !== false);
          if (readable.length && bridge.importOn !== undefined) {
            const importing = bridge.importOn();
            const head = el("div", "stat");
            head.dataset.cal = "read";
            head.appendChild(el("span", "stat-label", "Read from"));
            head.appendChild(el("span", "stat-value", importing ? "on" : "off"));
            cal.appendChild(head);

            const ticked = new Set(bridge.readCalendars());
            const byAccount = new Map();
            for (const c of readable) {
              const key = c.account || "this phone";
              byAccount.set(key, [...(byAccount.get(key) ?? []), c]);
            }
            for (const [account, items] of byAccount) {
              const group = el("div", "cal-account");
              group.dataset.cal = "read";
              group.appendChild(el("div", "said cal-account-name", account));
              for (const c of items) {
                const row = el("label", "cal-tick");
                const box = el("input", "");
                box.type = "checkbox";
                box.checked = ticked.has(c.id);
                box.addEventListener("change", () => {
                  if (box.checked) ticked.add(c.id);
                  else ticked.delete(c.id);
                  bridge.setReadCalendars([...ticked]);
                });
                row.appendChild(box);
                row.appendChild(el("span", "", c.name || "(unnamed)"));
                group.appendChild(row);
              }
              cal.appendChild(group);
            }

            const sw2 = button("act" + (importing ? " on" : ""),
              importing ? "Stop reading the calendar" : "Start reading the calendar",
              async () => {
                bridge.setImportOn(!importing);
                setTimeout(drawCal, 300);
              });
            sw2.dataset.cal = "read";
            cal.appendChild(sw2);

            // IMPORT NOW, AND SAY WHAT HAPPENED. Same reasoning as `Sync now`
            // in session 147: a pass that swallows its failures into a console
            // nobody has is a pass with one appearance and five causes.
            const pull = el("button", "act", "Import now");
            pull.type = "button";
            pull.dataset.cal = "read";
            const pulled = el("div", "said");
            pulled.dataset.cal = "read";
            pull.addEventListener("click", async () => {
              pull.textContent = "Reading…";
              pulled.textContent = "";
              let r;
              try {
                r = await bridge.importCalendar();
              } catch (e) {
                r = { ok: false, why: "The import threw: " + (e?.message ?? e) };
              }
              pull.textContent = "Import now";
              const lines = [];
              if (r.read !== undefined) {
                lines.push(`Read ${r.read} events.`);
                lines.push(`Added ${r.added}, updated ${r.updated}, removed ${r.removed}, cancelled ${r.cancelled}.`);
                // WHICH ID THE PHONE COULD GIVE. `rowid` means the event
                // carried neither an iCalendar UID nor a Google id, so the same
                // meeting on another phone would import as a different task.
                // Printed rather than assumed, because nothing here can know it.
                lines.push(`Event ids from: ${r.uidFrom}.`);
              }
              if (r.why) lines.push(r.why);
              for (const e of r.errors ?? []) lines.push(e);
              pulled.textContent = lines.join(" ");
            });
            cal.appendChild(pull);
            cal.appendChild(pulled);

            const readSays = el("div", "said",
              importing
                ? "Events from the ticked calendars become tasks, 10 days back and 60 days forward. A repeating event is ONE task, the next one you have not finished. Edit a calendar task's title or date here and it stops following Google; everything else — alarm, type, notes, pin, done — is always yours. Delete the event in Google and the task goes, unless you had edited it, in which case it is cancelled so you can revive it."
                : "Off. Nothing is read. Tick the calendar named after your email address; leave Holidays and Birthdays unticked unless you want them as tasks.");
            readSays.dataset.cal = "read";
            cal.appendChild(readSays);
          }

          const says = el("div", "said",
            on
              ? "Every task with a date is on the calendar. A task with a time is a 30 minute block; a task without one is an all-day banner. ONE WAY: marking a task done, cancelling it or deleting it removes the event, and an event you move or delete in Google Calendar is put back on the next sync. Turning this off removes every event the app wrote."
              : "Off. Nothing is written to your calendar. Turning it on puts every task that has a date onto it, and dateless tasks — Ideas — are left alone.");
          says.dataset.cal = "says";
          cal.appendChild(says);
        };
        await drawCal();
      } catch (e) {
        calVal.textContent = "unknown";
        calSaid.textContent = "The calendar module did not load: " + (e?.message ?? e);
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
    who = await account.current();
    draw();
  })();
}
