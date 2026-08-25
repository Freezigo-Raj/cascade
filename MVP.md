# Cascade Part A — the MVP, decided

Everything on this page is settled. Nothing here is a suggestion.
Positions, sizes, colours and spacing are not decided here.

**The visual system is `Cascade_Mobile_UI_Design_R2`**: warm ground `#f5ead8`, card `#fdf7f0`, terracotta accent `#c67139`, Fraunces over Figtree, 18px cards on a soft elevation. Colour means three states and no more: **accent** is what you can press, **warn** `#c0492b` is overdue, **good** `#e1eecc` is synced. The token block at the top of `shell/mvp.css` is the whole of it.

D-1: **Typing the thought is the whole of the work.**

---

## Three layouts

**One set of screens, arranged three ways.** `mvp.js` decides, and the two numbers are stated in `mvp.wide.css` (940) and `mvp.web.css` (1180).

| | Phone (under 940) | Tablet (940–1179) | Web (1180 and over) |
|---|---|---|---|
| Columns | One | One, wider | Three: rail, list, detail |
| Capture box | A screen you navigate to | Above the list, always open | Above the list, always open |
| Left rail | — | — | Nav with live counts, plus WIP items |
| Row press | Navigates to screen 2 | Loads the box above the list | SELECTS into the detail panel; the box is left alone |
| Detail panel | — | — | Everything the task carries, read-only, with WIP sections in place |
| Keys | — | `n` `/` `Esc` | `n` `/` `Esc` |

**WIP is one treatment everywhere.** A drawn control that does not work is dimmed, carries a `WIP` tag, and says on a press what is missing and which Part owns it. It is kept in place rather than removed, because a nav or a panel that grows later moves everything a person has learned the position of.

**Three things the design draws that are deliberately NOT drawn, and are not WIP.** A duration on every row, a day's load beside each push target, and a push count. All three are collected and none is shown: that is the quiet-fields rule from session 89, and drawing them would reverse a decision rather than fill a gap.

**Live in the rail:** Today, Tomorrow, Upcoming, Ideas, Done, all with real counts from the same pass the list uses; Capture; the account foot. **WIP in the rail:** Week, Day plan, Workflow, Activity, Projects.

**Live in the detail panel:** the type and firmness kicker, title, sentence, Done/Undone, Pin, Edit, Delete, the real push targets, notes, and a read-only list of what the task carries (duration and whether it was chosen, firmness, weight, alarm, repeat, pushes). **WIP:** Project, People, Tags, Blocked by, Activity.

**The detail panel is read-only on purpose.** Every field on it is set in the editor, and `Edit` hands the task to the capture box. A second control for one field is how two controls come to disagree.

---

## Two layouts

**One set of screens, arranged twice.** `mvp.js` decides which, at 940px, and no screen knows which it is in.

| | Phone (under 940px) | Web (940px and over) |
|---|---|---|
| Shape | One column, one screen at a time | Two columns: the list, and the capture panel beside it |
| Tapping a row | Navigates to screen 2 | Loads the task into the panel. The list keeps its scroll, its tab and its search |
| `+` | Navigates to an empty screen 2 | Unbinds the panel and puts the caret in it |
| Back | Not drawn (session 121): the gesture, the browser's own Back and a save's return are the ways out | Not drawn. There is nowhere to go back to |
| The panel | — | Sticky, so it does not leave the window when the list scrolls |
| Sentence on a row | `card_reason_short` under 600px | `card_reason` |
| Keys | — | `n` capture, `/` search, `Esc` let go. None fires while a field has focus |
| Account | Full width | Full width, and the panel closes: a capture box beside a Sign out button offers to type into an account you are leaving |

**Crossing the breakpoint mid-session lands on the list with the panel closed**, which is the route a phone would be on.

---

## Three screens

**Screen 1 — the list.** Three tabs, a toggle inside the first, and a search box.
**Screen 2 — capture and edit.** The same screen for both. Reached by `+` from the list, or by tapping a task.
**Screen 4 — the alarms.** Reached by `Alarms`, after `Done` in the tab row. Every alarm the shell will arm, in the order they will ring, with the controls a row cannot carry.

**Screen 3 — the account.** Reached by `ACCOUNT` on the list. Who is signed in, four counts, an export, and a sign-out. It exists because sign-out had a screen for signing in and no control anywhere for leaving.

---

## Screen 4, the alarms

Every task where `canAlarm()` holds and `alarm_type` is not `none` — the same filter the bridge arms against, sorted by `ringAt()`, the same instant that travels in the payload. A screen that listed anything else would be a second opinion about what is going to happen.

| Control | Count | What it does |
|---|---|---|
| Title | one per row | Opens screen 2 with the task loaded |
| Sentence | one per row | Three shapes, no clauses (session 126): `Rings 4:45pm on Monday`, `Snoozed until …`, or `Missed …. It will not ring again.` The third only reaches a one-off — a repeat's ring follows its rule |
| Note | 0 or 1 | The repeat in words, the unanswered count, and `NOT armed on this phone` when the Android shell does not hold this alarm (session 129) — the app's intention and the phone's state are two facts, and a silent phone needs both |
| Lead | one per row | The same 0-to-60 slider as the capture screen, writing the same field. It moves the RING |
| Alarm off | one per row | `alarm_type = "none"`. On a repeating task this ends the ring for the SERIES, because `spawn()` inherits `alarm_type`. Drawn as a pill (session 126, his call: button-like feel) |
| Clear snooze | 0 or 1 | Only while one is pending. The one piece of alarm state a person sets without seeing it |
| Stop repeat | 0 or 1 | Only on a repeating task. `recurrence = null`; the date and the alarm are left alone |
| Delete | one per row | The task, with undo. On a repeat this ends the series: a spawn needs a closed occurrence to count from |

**The lock screen carries four push rungs, two pickers and two cancels** (sessions 128 and 131). The rungs scroll sideways; `Tomorrow` and beyond are not offered there, because moving a task to another day is a decision worth being awake for. `Pick time` is one dialog for the same day and sends a time already gone to tomorrow; `Pick date & time` is two. Both sit on their own line below the rungs. `Cancel alarm` ends this ring and touches nothing else, so a repeat rings again on its own schedule. `Cancel this one` / `Cancel task` closes the occurrence as `cancelled` and hands a repeat its next occurrence. The wording follows the payload's `repeats` flag; the shell cannot see the record. It also carries five push targets in a sideways scroller and a `Pick…` button opening a date then a time dialog, which is the one place the Android shell composes a date.

**A repeat's ring follows its rule, not its open occurrence** (session 126). When the derived instant has gone, `nextRing()` steps it forward through the recurrence until it is ahead of the clock, so the screen can always answer "when next". The record is untouched: `due_at` still says when this occurrence was owed and it still reads as overdue. A one-off with a spent ring is not armed at all and the row says `Missed …`.

**Repeats the calendar walked past are stepped forward on open** (session 125, his call). An occurrence whose own date plus one whole interval has passed is closed as `cancelled` and the schedule's next future date is spawned, before the list draws and before the alarms are armed. `cancelled` and not `done`, because it was not done: the row keeps `closed_at` and shows on the Done tab beside the finished ones, so the miss is visible and countable. One interval and not one minute — a weekly task an hour late is still this week's task. Nothing else in the app ever moves a date on its own: a one-off is left exactly where it is, however late.

**The catch-up takes no undo slot.** Undo holds one entry and it belongs to the last thing a person did. The cancelled row is the way back.

**Two views: Alarms and Repeats** (session 129). `Alarms` is everything the shell will ring; `Repeats` is everything that recurs, alarm or not. They overlap and neither contains the other — a repeat with no alarm is invisible on the first, a one-off alarm invisible on the second. A repeat row carries Stop repeat, Alarm off and Delete.

**It is a screen and not a fourth tab.** The three tabs answer "when is this owed" and share one row shape, one toggle and one search. A row here answers "when will this ring", which is a different question about a smaller set.

**The empty state is the one exception to "an empty list screen shows nothing".** `Alarms` is a button a person pressed on purpose, and a blank answer to a press reads as broken rather than empty. It says what makes an alarm and stops.

---

## Screen 1, the list

Three tabs, and a toggle inside the first.

```
[ Tasks ]   Ideas   Done                    [ search        ]

Today  ·  Tomorrow  ·  Upcoming
```

| Control | Count | What it does |
|---|---|---|
| Tasks / Ideas / Done | 3 | The tabs |
| Today / Tomorrow / Upcoming | 3 | The toggle, inside Tasks only |
| Search box | 1 | Filters the tab you are on, in place |
| Task row | one per task | Tapping the row opens screen 2 with that task loaded |
| Done | one per row | The task moves to the Done tab |
| Delete for good | one per Done row | The only control in the app that erases a task. Reachable only from a row already closed, so erasing costs two decisions |
| Bell / loop | 0-2 per row | Not controls (session 132). A bell means the task has an alarm, a loop means it repeats. Beside the title, no hit area, `aria-hidden` with the fact in the title's label |
| Revive | one per Done row | A word beside the filled circle, doing the same thing (session 126, his word). The one control drawn twice on purpose: the circle has meant Undone since session 104 and nothing said so |
| Pin | one per row | A pin glyph, filled while pinned; the word stays for screen readers. Pinned tasks sort above everything |
| Delete | one per row | A bin glyph; the word stays for screen readers. The row goes for real. One step of undo holds the only copy |
| Push | 4 or 5 per row | Moves the date without opening the task. Each says only where it lands. A column that scrolls vertically, capped at two and a half rungs |
| Undone | one per Done row | Brings the task back |
| Alarms | 1 | After `Done` in the tab row (session 125, his ask). Not a tab: it opens screen 4, which lists every armed alarm |
| `+` | 2 | Opens screen 2 empty. One in the bar; one floats 60px at the bottom right on the narrow layout (session 119), where a thumb is. The wide layouts hide the float because the capture box is already on screen |

**A row is a title and a sentence.** No badge, no verb, no minutes.

**Mobile says less than web.** Both sentences come back on every call; the screen picks.

| | Web | Mobile |
|---|---|---|
| A hard deadline due today | `Due today. You called this a deadline.` | `Due today.` |
| High significance, due at 5 | `Due at 5pm, and you marked it high.` | `Due at 5pm.` |
| Four days late | `Overdue since Wednesday.` | `Overdue.` |
| A hedged date | `Due around Friday.` | `Due around Friday.` |

The trailing clauses explain a position the position already shows. `around` stays, because it changes what the date means.

```
Social alpha application
Due today. You called this a deadline.
```

**Duration appears in exactly one place: the slot totals** (session 121, his call — an amendment to session 89's quiet rule). Each of Today / Tomorrow / Upcoming wears the sum of the durations it holds (`Today · 1h 40m`), the verb's guess where nobody chose one, because that is the number a person needs to choose which day to open. Everywhere else the rule holds: no duration on any row, no load beside any push target, no push count.

| Tab | Holds | Order |
|---|---|---|
| Tasks · Today | overdue and today | ranked |
| Tasks · Tomorrow | tomorrow | ranked |
| Tasks · Upcoming | this week and later | ranked |
| Ideas | no date | shortest first |
| Done | finished and cancelled | most recently finished first |

Overdue sits in Today. A task three days late is a thing to deal with now, and a separate place for it means the tab you open first is not your real day.

A Done row is a title, the day it was closed — `Done today`, `Cancelled 16th August` (sessions 126 and 129) — and `Revive`. The verb follows the state: the tab holds both `done` and `cancelled`, and a task the calendar walked past is not an achievement. Reviving a repeat lands it on the next date its rule gives, because the catch-up would otherwise cancel a stale occurrence straight back again. `Overdue since Friday` on a finished task is a sentence about a deadline that no longer applies, so the reason is still not drawn.

**Pushing.** The targets come from how precisely the date was given, and each carries the load on the day it lands on.

```
call kushan          Due Friday.
   [Done] [Pin] [Delete]   ⇢ Next week   ⇢ +2 weeks
```

The targets are a standard ladder per precision (session 119), in a column that scrolls vertically (session 120), capped at two and a half rungs so the row keeps its height; no scrollbar is drawn, the half-cut rung is the affordance, and the first rung is always in view.

| The task says | Targets |
|---|---|
| `Due at 5pm` | +1 hour · +4 hours · Tomorrow · +2 days · Next week |
| `Due this morning` | Later today · Tomorrow · +2 days · Next week · +2 weeks |
| `Due today` / `Due Friday` | Tomorrow · +2 days · Next week · +2 weeks · Next month |
| `Due next week` | Next week · +2 weeks · Next month · +2 months |
| `Due next month` | Next month · +2 months · +3 months |
| `Overdue since Friday` | Today · Tomorrow · +2 days · Next week |
| No date | none |

**A full day is not offered while a lighter one further out is.** The app knows what each day holds and says none of it. In the example above Tomorrow is missing because it is already full.

Some fields exist only so the suggestions are better, and never appear on any screen: how long a task takes, how many times it has been pushed, where it was first due, and how loaded a day is.

A push is offered on everything, hard deadlines and pins included. The record counts the pushes and remembers where the task was first due.

**Repeats.**

A repeat spawns its next occurrence when the current one is marked done, and only then. There is never more than one open occurrence, so three weeks late on a weekly task is one row and not three.

The next date counts from the schedule, never from when you did it. Rent due the 1st and paid the 4th is next due the 1st.

A push moves one occurrence and leaves the series alone.

Undone takes back what the done created, so pressing it leaves one row rather than two.

**With nothing stored, the screen shows nothing.** No message, no illustration, no prompt.

## Screen 2, capture and edit

The box is at the top. The tap buttons are with it. The matching tasks are below.

| Control | Count | Notes |
|---|---|---|
| Text box | 1 | The only one in Part A. On edit it holds the **title**, never the typed line |
| Add / Edit | 1 | Reads `Add` when empty, `Edit` when a task is loaded |
| Date chips | 10 | From `chip_presets` (session 121), every phrase proved against the engine before joining (`day after tomorrow` failed and is out). Two columns side by side (session 123): near phrases (`This …`, `Tonight`) left, later right, each its own ~3-chip vertical scroll with a thin drawn scrollbar and a bottom fade |
| Pick date | 1 | A date picker, PINNED beside the tick with Pick time — the way into every unlisted date never scrolls away (session 121) |
| Pick time | 1 | A time picker, pinned |
| Time chips | 5 | `9am` `12pm` `3pm` `6pm` `9pm`, their own row below the date scroller, capped at one row with the same drawn scrollbar where they wrap |

**A pick puts no words in the box** (session 121). The box holds what the person typed; a tapped chip's or picker's words join the line the engine reads, beside the box and under a `chip_span`, and the tick chip is where the reading shows. Tapping the tick takes the picked words back. A date still arrives one way — through words in the one line — and the engine is untouched. A pick on an empty box waits, previewed on the tick, until there are words to date: date words alone are not a commitment.
| `✓ <date>` | 1 | The date the engine read. Tapping it removes those words from the box |
| Type | 1 + 1 | A dropdown of all fourteen types (session 122, his call — and what the design always drew: `⟨action ▾⟩`). The engine's guess is its value; changing it is the tap. The ⋯ beside it opens the advanced panel |
| Advanced | 1 | Opens a panel on the same screen. Everything that corrects what the typing already said, in one place |
| Takes about | 1 | In the advanced panel. A SLIDER (session 125, his call), reading beside it. It runs a ladder of the durations people actually give — 5 min to 7 days — rather than a linear range, because `limits.duration_max` is 182 days and a linear slider across that cannot land on twenty minutes. Sets `duration_tap`; the label says whether the number is the person's or the verb's. The number box, the three unit chips and the four suggestion chips are gone: seven controls for one number |
| How firm | 4 | In the advanced panel. `auto` / `normal` / `soft` / `hard`. `auto` gives the marker words their say back, so the tap is undoable |
| Repeat | 1 | In the advanced panel. An interval: every N days, weeks, months or years (`year` added session 123), the number and units on one line (session 124). The Never button sits beside the label and wears the app's reading once a repeat is set — `every Wednesday at 5pm` — tapping it always the way back to never. Marking one done spawns the next, from the list AND from the lock screen (session 123) |
| Alarm | 1 | ON THE CAPTURE SCREEN AND NOWHERE ELSE (the panel's group left in session 126, his call — one field, one control), directly under the box, while the line carries an exact time (sessions 123-124): a toggle plus the instant it will ring with its day — `rings 4:45pm today` / `tomorrow` / `on Monday` / `on 20th August` — and `· repeats` when the task does. The lead slider sits on the same row (session 125); without a time the row says `An alarm needs an exact time.` and there is nothing to press. While editing, the row speaks about the date the SAVE WILL KEEP, not the date in the box — the box holds `title` and its date words are gone (session 126) |
| Lead | 1 | A SLIDER beside the Alarm toggle, 0 to 60 minutes, reading its own value (session 125, his ask). 15 by default. It LEFT the advanced panel in the same session: one field, one control. Cost stated — `alarm_defaults.max_lead_min` is a week and this reaches an hour, so a longer lead is still honoured and can no longer be set |
| Notes | 1 | In the advanced panel, at the foot of it. Read, never matched: a note reaches neither search nor the duplicate warning |
| Low / Normal / High | 3 | Normal is the default and is marked |
| `⟨ task ✕ ⟩` | 1 | Only while editing. The ✕ leaves without saving |
| Match row | 0 or more | Tapping one loads that task for editing |

**Everything re-reads on every keystroke.** The date, the type, the duration, the matches.

**Going back is the phone's own gesture, and the app decides what it means.** The swipe or the system button leaves the editor and the account screen, closes an open dialog before either, and from the list it closes the app. In a browser that is `popstate`; in the Android shell the gesture reaches the activity first, so the activity asks the app and acts on the answer rather than guessing from WebView history. A drawn Back sits at the top of a screen, which is where a thumb cannot reach and where a long screen scrolls it out of sight; the gesture works from anywhere and is the same on every app on the phone. The drawn button LEFT in session 121 (his call): the gesture, the browser's own Back and a save's return already cover every exit, and the editor's head now appears only while a task is bound, holding its title chip and the ✕.

**A date arrives one way: through the words in the box.** Every chip types words. A tapped date beats a typed one. A second tap replaces the first.

**Editing a title with no date words in it leaves the date alone.** The date words left the line when the task was created, so there are none to re-read. The date chip is what shows the date and what clears it.

**Pressing Add** creates the task and empties the box. **Pressing Edit** saves to the loaded task and leaves the edit state.

**The clash warning** fires the same way as the duplicate dialog: on Add, on save and on a push, never while typing. It reads `"meet supplier" is at 5pm.` with `[Add anyway]` and `[Cancel]`, and never says how long anything takes.

**The deadline warning** is a second collision with a different shape, and it fires the same three ways. It reads `"file GSTR-1" is also due Friday.` It fires when this task and a stored one are **both hard** and land on the **same calendar day**, whether or not either one names a time. A deadline occupies no slot — an `end` anchor is 23:59:59 — so the clash check can never see one, which is why this is a separate rule. Two promises on one day collide; two plans on one day do not, or it would fire on an ordinary Tuesday. It cannot say whether the day will hold the work, because the day's load is a per-verb guess the reader never sees.

**All three warnings share one dialog.** A line that is a repeat, a collision and a second deadline is stopped once and told three things, not three times.

**The duplicate dialog fires on Add only, never while typing.** It reads `"check sensor" already exists, due today.` with `[Add anyway]` and `[Cancel]`. Cancel leaves the typed text in the box.

**It reads OPEN tasks only** (session 134). Done, cancelled and archived rows are not compared against, which is the same set the search panel under the box reads — the two answer the same question and a dialog naming something the person cannot see is worse than no dialog. A finished task with the same name is what `Revive` on the Done tab is for.

**The undo toast** reads `Added "Call markan" · this morning` with `[Undo]`, and holds 8 seconds. The undo entry outlives the toast.

---

## The matches under the box

Search runs on the line with the date words removed, so a date typed into the box is never something to look for.

Four tiers, best first. A task is placed by the highest it reaches and never appears twice.

| Tier | Matches when |
|---|---|
| 1 | The line is exactly the task |
| 2 | The task starts with the line |
| 3 | They share a word |
| 4 | Fuzzy similarity is 0.5 or more |

Inside a tier, the better score wins and the most recently touched breaks a tie.

**Only open tasks are searched.** A finished task was put away deliberately.

**Nothing is capped.** The area is small and it scrolls.

**Nothing matching draws nothing.** No panel, no headers.

A match reads:

```
Call kushan          due Wed
```

---

## The order on the Default list

Three tiers. A tier is reached only when the one above ties.

**Tier 1, absolute.** Pinned first. Then hard deadlines. No score beats either.

**Tier 2.** Lexicographic: the factors below run in order and the first that separates two tasks decides.

**Tier 3, nine factors.**

| # | Factor | Direction |
|---|---|---|
| 1 | `deadline_band` | overdue, today, tomorrow, this week, later, none |
| 2 | `significance` | High, Normal, Low |
| 3 | `date_firmness` | normal before soft |
| 4 | `date_precision` | time, band, day, span, week, month, open, none |
| 5 | `commitment_type` | appointment, deadline, action, maintenance, habit, purchase, decision, research, project, information, waiting, goal, wish, idea |
| 6 | `est_duration_min` | shortest first |
| 7 | `workflow_position` | zero until Part C |
| 8 | `reminder_fatigue` | most unanswered alarms first |
| 9 | `updated_at` | most recently touched first |

A hard deadline beats being overdue. That is deliberate: a hard deadline is a promise made to someone else.

---

## The sentence under a title

The lead clause says the date at the finest granularity that is **true**, not the finest available.

`Overdue since Friday` · `Due at 5pm` · `Due this morning` · `Due today` · `Due tomorrow` · `Due Friday` · `Due 20 Aug` · `Due in 30 mins` · `Due next week`

A task with a start and no due date reads `From Friday`, `From 5pm`, `From 20 Aug`.
A hedged date reads `Due around Friday`.

The sentence is not drawn when it exactly repeats the slot heading above it (session 119): `Due today` on the Today slot, `Due tomorrow` on Tomorrow. The test is exact equality with `Due <slot>` and nothing looser — a time, a hedge, an overdue and a window all differ from the slot's name and keep the sentence. Screen decision; the engine returns both sentences unchanged.

One trailing clause may follow, and only when it is true of the task:

- `You pinned this.`
- `You called this a deadline.`
- `, and you marked it High.`

A task at Normal significance says nothing about significance.

---

## The alarm

The web app records the alarm and derives when. The Android shell rings it. A web page cannot wake a phone, loop a sound through Do Not Disturb or draw over a lock screen, so ringing lives in the shell and nowhere else.

It fires at the due time less the lead. The lead is read three ways in order: the task's own, then the suggested one for its type, then the default. All fifteen minutes today, so every task leads by fifteen until a number is moved.

**An alarm needs a stated time.** A task due `Friday` resolves to 23:59:59, so a lead from it would ring at a quarter to midnight. The toggle is drawn only while the line carries a time, and one sentence replaces it when there is none.

**Stopping the noise never waits for an unlock.** Every press stops the ringing and is queued first, whatever the screen is doing. Bringing the app forward happens after that and is allowed to fail.

**Done and a push bring the app forward; a snooze does not.** Every press is queued, so the unlock is what makes a change visible rather than what makes it happen: an un-unlocked press still lands the next time the app is opened. A snooze changes nothing about the task and has nothing to show, so the phone stays locked. Nothing could apply a press at unlock with the app closed without a second copy of the write path living in Kotlin.

**On the lock screen:** the title, the mobile sentence, `Done`, one button per `alarm_snooze_options` member, and up to two push targets. The targets are computed when the alarm is armed, since choosing one reads the day's load off every stored task, so they are as old as the gap between arming and ringing. No targets means no push row.

**Unattended** it rings two minutes, snoozes itself five, and repeats up to five times. Then it stops, `alarm_unanswered_at` is written, and the task rises to the top under `pinned` and `is_hard` with `Its alarm rang unanswered` on the row.

**The account screen states whether anything can ring, names each permission separately, and measures the APK's age.** The Kotlin states its own build and the screen compares it to the one the bridge expects (session 119): behind, it says so in a sentence naming the fix, a reading the old plugin cannot give says `unknown` rather than `off`, and a press the old plugin cannot serve says so where it was pressed. Two installs look identical on a phone and only the Android one carries the plugin. Four Android permissions sit behind a working alarm and they fail differently: without notifications nothing appears, without exact timing the ring drifts, without full-screen access it arrives as a notification and the alarm screen never appears, without battery exemption a ring can be held back. Each is drawn with its own state and its own button, plus one that walks through everything missing.

```
file gstr1
Due at 5pm.
[Done]  [Push]  [Snooze 10m]
```

The mobile sentence, because a notification is the smallest screen there is. Push moves the task; Snooze moves the telling.

## Counts

3 text boxes (capture, the notes, and the list's search — the search covers every task not done and clears on any slot or tab press, session 123). 31 fixed buttons on screens 1 and 2 outside the advanced panel — screen 1: three tabs, `+` (wide layout only, session 123 — narrow keeps just the floating `+`), the floating `+`, three slot buttons (the screen says `Later` where the engine says `Upcoming`, session 124; none is lit while a search is on), the avatar (three dots); screen 2: ten date chips in two scroll columns, two pickers, five time chips, the alarm toggle when a time is stated, `⋯`, three significance buttons, Add — plus the type dropdown (all fourteen types, session 122) — plus 4 to 6 push buttons per row (three visible before the fade; a `Today` rung leads the ladder for tasks on a later day, session 124; a drag on the ladder never fires a press), plus 3 on screen 3 (export, sign out, back). 1 dialog carrying up to 3 warnings, 1 toast.

---

## Not built yet — the register

The same list the account screen draws. `decided` means it was chosen against and is not waiting on anything; `later` means nobody has got to it. The second kind is the only kind worth chasing.

| Thing | Why it does not work | Owner |
|---|---|---|
| Alarms in the browser | A web page cannot wake a phone, sound through DND, or draw over a lock screen. The Android build rings; this copy records and stays quiet | decided |
| Notification budget | A cap on how many reminders an hour, with lower-weight ones pushed back. Nothing counts them | Part B |
| Workflow | Decided in full — dependencies, and/or, if/else, bounded loops, conditions — and no column exists | Part C |
| Projects | `project_id` is on every record and nothing writes it | Part C |
| Cancel and Archive | `row_action` members with no control anywhere. A row carries Pin, Delete and its push targets | decided |
| Swipe on a row | Buttons only. A control behind a gesture cannot be found by reading the screen | decided |
| Notes on a row | Read in the editor, never previewed on a row. A row stays a title and a sentence | decided |
| Note preview, +1h/+3d nudges | The design draws both. The nudges are replaced by the engine's own push targets, which come from `date_precision` | decided |
| Delivery channels | The design offers alarm, notification and in-app. The record holds one alarm field | later |
| Streaks, percent done | A repeat spawns its next occurrence and keeps no history of the ones before | later |
| People, tags | Two vocabularies the design draws and the record has no column for | later |
| Context | Derived from the verb, stored, read by nothing. Config holds two members | later |
| Import | The export writes a file and nothing reads one back | later |
| Dark theme | One set of tokens, tuned for the light ground | later |

**Every `later` control that is drawn looks the same.** Dimmed, and pressing it says in one sentence what is missing and which Part owns it. A control that swallows a press reads as broken; a control that explains itself reads as unfinished, which is what it is. None is drawn on a row (session 119: the `Workflow` tag left, because a row carries Pin, Delete, the Done circle and its push targets and has since session 104); the marked WIP places are the rail and the detail panel.

---

## Not in the MVP

Tabs. Reminders and alarms that fire. Projects. Blockers and workflow. Sub-tasks. `Park`.

**Arrived since this page was written**, and now on it: recurrence, sync, the duration control, notes, firmness. **Decided and deliberately still absent:** Cancel and Archive as row actions. A row carries Done, Pin, Delete and its push targets, and a Done row carries Undone. Cancel and Archive stay members of `row_action` with no control on any screen, which is stated here so the gap reads as a decision rather than an oversight.
