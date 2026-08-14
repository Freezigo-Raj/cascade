# Cascade Part A — the MVP, decided

Everything on this page is settled. Nothing here is a suggestion.
Positions, sizes, colours and spacing are not decided here.

D-1: **Typing the thought is the whole of the work.**

---

## Two screens

**Screen 1 — the list.** Three tabs, a toggle inside the first, and a search box.
**Screen 2 — capture and edit.** The same screen for both. Reached by `+` from the list, or by tapping a task.

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
| Tomorrow AM | 1 | Same |
| Weekend | 1 | Same |
| Pick date | 1 | A date picker. Writes its date into the box, with the year only when it is not this year |
| Pick time | 1 | A time picker. Writes the time beside the date |
| `✓ <date>` | 1 | The date the engine read. Tapping it removes those words from the box |
| Type chips | 3 + 1 | The engine's guess, marked, beside `deadline`, `action`, `appointment`. A small button opens the advanced panel |
| Advanced | 1 | Opens a panel on the same screen: the other eleven types, and Repeat |
| Repeat | 1 | In the advanced panel. An interval: every N days, weeks or months |
| Alarm | 1 | In the advanced panel. None, once, or repeating |
| Lead | 1 | Minutes before the task. 15 by default, changed per task |
| Low / Normal / High | 3 | Normal is the default and is marked |
| `⟨ task ✕ ⟩` | 1 | Only while editing. The ✕ leaves without saving |
| Match row | 0 or more | Tapping one loads that task for editing |

**Everything re-reads on every keystroke.** The date, the type, the duration, the matches.

**A date arrives one way: through the words in the box.** Every chip types words. A tapped date beats a typed one. A second tap replaces the first.

**Editing a title with no date words in it leaves the date alone.** The date words left the line when the task was created, so there are none to re-read. The date chip is what shows the date and what clears it.

**Pressing Add** creates the task and empties the box. **Pressing Edit** saves to the loaded task and leaves the edit state.

**The clash warning** fires the same way as the duplicate dialog: on Add, on save and on a push, never while typing. It reads `"meet supplier" is at 5pm.` with `[Add anyway]` and `[Cancel]`, and never says how long anything takes.

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
| 8 | `reminder_fatigue` | zero until Part B |
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

Part A records the alarm and fires nothing: a browser cannot wake itself, so the scheduler belongs to Part B. What is decided here is what it says and when.

It fires at the due time less the lead. The lead is read three ways in order: the task's own, then the suggested one for its type, then the default. All fifteen minutes today, so every task leads by fifteen until a number is moved.

**An alarm needs a stated time.** A task due `Friday` resolves to 23:59:59, so a lead from it would ring at a quarter to midnight.

```
file gstr1
Due at 5pm.
[Done]  [Push]  [Snooze 10m]
```

The mobile sentence, because a notification is the smallest screen there is. Push moves the task; Snooze moves the telling.

## Counts

2 text boxes (capture, and the list's search). 26 fixed buttons, plus 2 or 3 push buttons per row. 1 dialog, 1 toast.

---

## Not in the MVP

Tabs. Reminders and alarms. Notes. Projects. Recurrence. Blockers. A duration control. Sub-tasks. Sync. Cancel and Archive as row actions. `Park`. Anything that reaches a done task.
