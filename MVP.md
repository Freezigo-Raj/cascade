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
| Back | On screen 2 | Not drawn. There is nowhere to go back to |
| The panel | — | Sticky, so it does not leave the window when the list scrolls |
| Sentence on a row | `card_reason_short` under 600px | `card_reason` |
| Keys | — | `n` capture, `/` search, `Esc` let go. None fires while a field has focus |
| Account | Full width | Full width, and the panel closes: a capture box beside a Sign out button offers to type into an account you are leaving |

**Crossing the breakpoint mid-session lands on the list with the panel closed**, which is the route a phone would be on.

---

## Three screens

**Screen 1 — the list.** Three tabs, a toggle inside the first, and a search box.
**Screen 2 — capture and edit.** The same screen for both. Reached by `+` from the list, or by tapping a task.
**Screen 3 — the account.** Reached by `ACCOUNT` on the list. Who is signed in, four counts, an export, and a sign-out. It exists because sign-out had a screen for signing in and no control anywhere for leaving.

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
| Pin | one per row | Pinned tasks sort above everything |
| Delete | one per row | The row goes for real. One step of undo holds the only copy |
| Push | 2 or 3 per row | Moves the date without opening the task. Each says only where it lands |
| Undone | one per Done row | Brings the task back |
| `+` | 1 | Opens screen 2 empty |

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

**Duration never appears.** It decides the Ideas order, the sixth ranking factor and the load on a day, and the reader never sees it.

| Tab | Holds | Order |
|---|---|---|
| Tasks · Today | overdue and today | ranked |
| Tasks · Tomorrow | tomorrow | ranked |
| Tasks · Upcoming | this week and later | ranked |
| Ideas | no date | shortest first |
| Done | finished and cancelled | most recently finished first |

Overdue sits in Today. A task three days late is a thing to deal with now, and a separate place for it means the tab you open first is not your real day.

A Done row is a title alone. `Overdue since Friday` on a finished task is a sentence about a deadline that no longer applies.

**Pushing.** The targets come from how precisely the date was given, and each carries the load on the day it lands on.

```
call kushan          Due Friday.
   [Done] [Pin] [Delete]   ⇢ Next week   ⇢ +2 weeks
```

| The task says | Targets |
|---|---|
| `Due at 5pm` | +1 hour · Tomorrow · Next week |
| `Due this morning` | Later today · Tomorrow · Next week |
| `Due today` / `Due Friday` | Tomorrow · Next week · +2 weeks |
| `Due next week` | Next week · +2 weeks · Next month |
| `Due next month` | Next month · +3 months |
| `Overdue since Friday` | Today · Tomorrow |
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
| This afternoon | 1 | Types its own words into the box |
| Tonight | 1 | Same |
| Tomorrow morning | 1 | Same. It reads `morning` as a band on a named day, so the whole label is consumed and none of it strands in the title |
| Weekend | 1 | Same |
| Pick date | 1 | A date picker. Writes its date into the box, with the year only when it is not this year |
| Pick time | 1 | A time picker. Writes the time beside the date |
| `✓ <date>` | 1 | The date the engine read. Tapping it removes those words from the box |
| Type chips | 3 + 1 | The engine's guess, marked, beside `deadline`, `action`, `appointment`. A small button opens the advanced panel |
| Advanced | 1 | Opens a panel on the same screen. Everything that corrects what the typing already said, in one place |
| Takes about | 1 + 3 + 4 | In the advanced panel. A number box and `min` / `hour` / `day`, plus four suggestions. Sets `duration_tap`; the label says whether the number is the person's or the verb's |
| How firm | 4 | In the advanced panel. `auto` / `normal` / `soft` / `hard`. `auto` gives the marker words their say back, so the tap is undoable |
| Repeat | 1 | In the advanced panel. An interval: every N days, weeks or months |
| Alarm | 1 | In the advanced panel, and ONLY while the line carries a time. `none` / `on`. Without a time the row is replaced by one sentence saying a time is what is missing |
| Lead | 1 | Minutes before the task. 15 by default, changed per task. The note under it states the ring length, the auto-snooze interval and the limit |
| Notes | 1 | In the advanced panel, at the foot of it. Read, never matched: a note reaches neither search nor the duplicate warning |
| Low / Normal / High | 3 | Normal is the default and is marked |
| `⟨ task ✕ ⟩` | 1 | Only while editing. The ✕ leaves without saving |
| Match row | 0 or more | Tapping one loads that task for editing |

**Everything re-reads on every keystroke.** The date, the type, the duration, the matches.

**Going back is the phone's own gesture, and the app decides what it means.** The swipe or the system button leaves the editor and the account screen, closes an open dialog before either, and from the list it closes the app. In a browser that is `popstate`; in the Android shell the gesture reaches the activity first, so the activity asks the app and acts on the answer rather than guessing from WebView history. A drawn Back sits at the top of a screen, which is where a thumb cannot reach and where a long screen scrolls it out of sight; the gesture works from anywhere and is the same on every app on the phone. The drawn button stays as well and does the same single thing.

**A date arrives one way: through the words in the box.** Every chip types words. A tapped date beats a typed one. A second tap replaces the first.

**Editing a title with no date words in it leaves the date alone.** The date words left the line when the task was created, so there are none to re-read. The date chip is what shows the date and what clears it.

**Pressing Add** creates the task and empties the box. **Pressing Edit** saves to the loaded task and leaves the edit state.

**The clash warning** fires the same way as the duplicate dialog: on Add, on save and on a push, never while typing. It reads `"meet supplier" is at 5pm.` with `[Add anyway]` and `[Cancel]`, and never says how long anything takes.

**The deadline warning** is a second collision with a different shape, and it fires the same three ways. It reads `"file GSTR-1" is also due Friday.` It fires when this task and a stored one are **both hard** and land on the **same calendar day**, whether or not either one names a time. A deadline occupies no slot — an `end` anchor is 23:59:59 — so the clash check can never see one, which is why this is a separate rule. Two promises on one day collide; two plans on one day do not, or it would fire on an ordinary Tuesday. It cannot say whether the day will hold the work, because the day's load is a per-verb guess the reader never sees.

**All three warnings share one dialog.** A line that is a repeat, a collision and a second deadline is stopped once and told three things, not three times.

**The duplicate dialog fires on Add only, never while typing.** It reads `"check sensor" already exists, due today.` with `[Add anyway]` and `[Cancel]`. Cancel leaves the typed text in the box.

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

**The account screen states whether anything can ring, and names each permission separately.** Two installs look identical on a phone and only the Android one carries the plugin. Four Android permissions sit behind a working alarm and they fail differently: without notifications nothing appears, without exact timing the ring drifts, without full-screen access it arrives as a notification and the alarm screen never appears, without battery exemption a ring can be held back. Each is drawn with its own state and its own button, plus one that walks through everything missing.

```
file gstr1
Due at 5pm.
[Done]  [Push]  [Snooze 10m]
```

The mobile sentence, because a notification is the smallest screen there is. Push moves the task; Snooze moves the telling.

## Counts

3 text boxes (capture, the notes, and the list's search). 27 fixed buttons on screens 1 and 2, plus 2 or 3 push buttons per row, plus 3 on screen 3 (export, sign out, back). 1 dialog carrying up to 3 warnings, 1 toast.

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

**Every `later` control that is drawn looks the same.** Dimmed, and pressing it says in one sentence what is missing and which Part owns it. A control that swallows a press reads as broken; a control that explains itself reads as unfinished, which is what it is. `Workflow` on a row is the only one drawn today.

---

## Not in the MVP

Tabs. Reminders and alarms that fire. Projects. Blockers and workflow. Sub-tasks. `Park`.

**Arrived since this page was written**, and now on it: recurrence, sync, the duration control, notes, firmness. **Decided and deliberately still absent:** Cancel and Archive as row actions. A row carries Done, Pin, Delete and its push targets, and a Done row carries Undone. Cancel and Archive stay members of `row_action` with no control on any screen, which is stated here so the gap reads as a decision rather than an oversight.
