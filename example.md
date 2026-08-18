# spec/example.md — Cascade Part A

Stage 1 deliverable, version 42. Written by hand. No code anywhere in this file.
Scope: **Part A only.** Parts B, C and D each get their own example at their turn.

---

## Who uses this, and what they were doing a moment ago

Vishal, running Freezigo and Cascade at the same time. Founder-shaped workload: many small commitments arriving from calls, WhatsApp, email and his own head, across two businesses.

**Immediately before opening the app:** at his desk, between tasks. A call has just ended and four things came out of it.

Desk is the design case for v1 because it carries the most inputs: keyboard, wider screen, arrow keys, more surrounding context. Mid-call, on the move, and end-of-day review all need to work and all get designed later. Anything that only works with a keyboard is a fault, not a shortcut.

---

## The one thing that must work, or Part A is pointless

> **Typing the thought is the whole of the work.**

*Ratified 1 August 2026. Governs the normal path.*

It is a single claim and a strict one. If anything is required of the user after they have typed their line, Part A has failed. That forbids:

- Any mandatory field. Significance defaults to Normal and may be ignored. The date chips may be ignored. The type chip is shown, never demanded.
- Any confirmation prompt for low parser confidence. Low confidence resolves to a fallback member instead of asking, which is why `needs_confirmation` never fires in Part A.
- Any tidying-up pass. The record is complete at capture or the engine failed, not the user.

What it does not forbid: offers the user may ignore. A chip, a suggestion, a toast. The test is whether the capture completes without them.

### The one exception, and the rule behind it

One blocking dialog is permitted:

| Dialog | Fires when |
|---|---|
| `Add anyway` / `Cancel` | The normalised text is a near-duplicate of an open task |

It fires only where **the engine cannot determine how many records the input describes.** One task or two. That is not a question inference can answer, and answering it wrongly writes records the user did not ask for.

The list is closed. Any post-capture dialog that is not this one is a defect against D-1, whatever its justification. If a second case is ever proposed, it has to satisfy the same rule.

A comma list is not such a case. `Payments to coolindia, sudhi, laptop` is one typed sentence and stays one task; the engine counts the items to sum the duration and never splits the record.

An earlier draft read "one typed line becomes a complete task that can be found again", and an earlier one than that contained "at most one tap", a clause that was mine rather than yours and was withdrawn.

---

## Three things Part A deliberately will not do in v1

1. **Remind you of anything.** Nothing fires. No notification, no alarm, no badge that behaves like one. Part B owns that, and it cannot be tuned until Part A has produced a fortnight of real captures.
2. **Ask you to fill in fields.** Beyond the text, everything is inferred and shown, or offered as a chip you may ignore. Wrong inferences are corrected from the list, not prevented by prompting.
3. **Organise anything for you.** No auto-grouping, no suggested projects, no learned reordering. Structure is manual, or it does not exist.

---

# The example

One continuous session. Every value is traceable in the tables that follow it.

**Clock:** Monday 3 August 2026, 10:40 local (Asia/Kolkata). Stored as `2026-08-03T10:40:00+05:30`.
**Config version:** `a.1`.

---

## Tasks in this example

Fourteen. Six are captured in front of you in sections 2 and 5. Eight were already in the backlog before this session opened, and until now nothing said so, which left every title drawn on a screen with no stated origin.

**Two clocks.** Everything drawn in this document is seen at one moment, **Mon 3 Aug 10:40**. Each line was typed at its own, and a window is cut at whatever `now` was then, so the typing time is part of the derivation and not a note beside it. `check sensor today` typed at 09:30 is due 16:45; the same words typed at 10:40 would be due 17:20.

| Typed | `title` as drawn | Typed at | Where | `action_verb` | `due_at` |
|---|---|---|---|---|---|
| `Call markan morning` | `Call markan` | Mon 3 Aug 10:40 | §2 | `call` | today 11:20 |
| `USB integration call This afternoon` | `USB integration call` | Mon 3 Aug 10:40 | 5a, chip typed the last two words | `call` | today 15:00 |
| `Payments to coolindia, sudhi, laptop` | `Payments to coolindia, sudhi, laptop` | Mon 3 Aug 10:40 | 5b | `pay` | *(none)* |
| `Srilanka tickets` | `Srilanka tickets` | Mon 3 Aug 10:40 | 5c | `other` | *(none)* |
| `maybe call kushan next week` | `maybe call kushan` | Mon 3 Aug 10:40 | 5d | `call` | Thu 16:30 |
| `GST filing deadline` | `GST filing` | Mon 3 Aug 10:40 | 5e | `file` | *(none)* |
| `file form 8 friday` | `file form 8` | Wed 29 Jul 10:00 | backlog | `file` | Fri 31 Jul 16:30, overdue |
| `Social alpha application deadline monday` | `Social alpha application` | Fri 31 Jul 10:00 | backlog | `submit` | today 16:30 |
| `Reply to bharti singhal morning` | `Reply to bharti singhal` | Mon 3 Aug 10:00 | backlog | `reply` | today 11:00 |
| `check sensor today` | `check sensor` | Mon 3 Aug 09:30 | backlog | `check` | today 16:45 |
| `Call kushan wednesday` | `Call kushan` | Mon 3 Aug 09:30 | backlog | `call` | Wed 16:30 |
| `bharti sighla VC thursday` | `bharti sighla VC` | Mon 3 Aug 09:30 | backlog | `meet` | Thu 16:30 |
| `Kena investment` | `Kena investment` | Mon 3 Aug 09:30 | backlog | `other` | *(none)* |
| `oncology map software` | `oncology map software` | Mon 3 Aug 09:30 | backlog | `make` | *(none)* |

**A due date comes from a date span and from nothing else.** One rule, one path, and the Typed column has to show the words that produced the date on every row that carries one. A chip is not a second path: tapping one types its words into the box, so `This afternoon` reaches the record as words the user could delete afterwards, and the row reads the same as one someone typed by hand.

**A relative word becomes an instant once, at the moment it is typed.** `file form 8 friday` was typed on Wednesday 29 July, when `friday` meant 31 July; four days later that instant has passed and the row draws as overdue. `Social alpha application deadline monday` was typed on Friday, when `monday` meant today. Nothing re-reads the word later, which is why the record holds the instant and the Typed column holds the word.

**Every title here is what the line looks like with its date words taken out.** `file form 8 friday` draws as `file form 8`. That is the title rule doing the same work on a backlog row that it does on a fresh capture, and it is why the Typed column and the drawn column differ on exactly the rows carrying dates.

**No title is drawn on a screen unless it is in this table.** That is what makes `card_title` checkable at all: without it, any text could be a title and the gate can only check the shapes around it.

**`file` and `submit` are different members at `a.2`.** `file form 8` and `GST filing deadline` are statutory filings; `Social alpha application deadline` is work sent to a client. Both were `submit` under `a.1`, when `file` had no member of its own.

---

## 1. The screen as he opens it

```
┌──────────────────────────────────────────────────────────────────┐
│  Default                                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Social alpha application                                       │
│   Due today. You called this a deadline.           submit · 30m  │
│                                                                  │
│   file form 8                                                    │
│   Overdue since Friday.                              file · 30m  │
│                                                                  │
│   Reply to bharti singhal                                        │
│   Due this morning.                                 reply ·  5m  │
│                                                                  │
│   check sensor                                                   │
│   Due today.                                       check ·  15m  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  ┌────────┐  │
│  │                                                │  │  Add   │  │
│  └────────────────────────────────────────────────┘  └────────┘  │
│  [This afternoon][Tonight][Tomorrow morning][Weekend][Pick date] │
│  [Pick time]                             [Low][**Normal**][High] │
└──────────────────────────────────────────────────────────────────┘
```

**Part A has two lists and no tabs.** `Default` holds every task carrying a date, ranked. `Ideas` holds every task carrying none, sorted by duration. A date means `due_at` or `earliest_start`, so a task you cannot start until Friday is in Default with nothing due, ranked below everything that has a deadline. Those are the only two routes a capture can take and the rule for each is stated. Projects, Upcoming and Settings are Part C: drawing a tab that nothing fills would put a line of text on this example with no rule behind it, which is what Gate 1 forbids.

**Significance sits inline at the end of the chip row**, defaulted to Normal. It is a user control and the engine never writes to it.

**No commitment type chip is showing.** There is no text yet, so there is nothing to infer from.

**Why that order, one sentence each.** These are the sentences the app itself shows, produced from the ranking term breakdown.

| # | Task | Sentence | What decided |
|---|---|---|---|
| 1 | Social alpha application | Due today. You called this a deadline. | Tier 1, `is_hard` true |
| 2 | file form 8 | Overdue since Friday. | Tier 3 factor 1, band = `overdue` |
| 3 | Reply to bharti singhal | Due this morning. | Factors 1–3 tie; factor 4, precision `band` |
| 4 | check sensor | Due today. | Factor 4, precision `day` is the wider |

**The sentence has two slots.** The lead clause always renders `due_phrase`. The trailing clause names what decided, and only `is_hard` and `significance` produce one, because those are the only two a person would recognise as a reason.

| Slot | Source | Example |
|---|---|---|
| Lead | `due_phrase` | `Due today` |
| Trailing | `reason_clauses` keyed by what decided | `You called this a deadline` |

When both apply, both render, in tier then factor order: `Due today. You called this a deadline, and you marked it high.` No capture in this session has both, so that is a Stage 4 golden case rather than something shown here.

**`due_phrase` is not `deadline_band`.** "this morning" is not one of the six band members. The phrase is rendered from `due_at`, `date_precision`, `has_time` and `now`, which is why `Reply to bharti singhal` says "this morning" and `check sensor` says "today" while both sit in the `today` band. It is a working value, not a field: it goes stale at midnight.

**The sentence is written from the list, not from the record.** A card says "You called this a deadline" because that is what put it above the card below it. Two hard deadlines side by side say nothing about deadlines, because being hard separated neither of them; whatever did the separating is what the trailing clause names. That is what makes the sentence and the sort order incapable of disagreeing, and it means `card_reason` needs the ranked list rather than one task.

---

## 2. He types one line

He types `Call markan morning`, then taps **High**.

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──── results ────────────────────────────────────────────────┐ │
│  │  ACTIVE                                                     │ │
│  │    Call kushan                        due Wed · call · 15m  │ │
│  │  IDEAS      (none)                                          │ │
│  │  DONE       (none)                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  ┌────────┐  │
│  │ Call markan morning                            │  │  Add   │  │
│  └────────────────────────────────────────────────┘  └────────┘  │
│  [✓ this morning][This afternoon][This evening][Tonight]         │
│  [Tomorrow morning][Tomorrow afternoon][Tomorrow evening]        │
│  [Weekend][Next weekend][Next week][Next month]                  │
│  ⟨action ▾⟩                              [Low][Normal][**High**] │
└──────────────────────────────────────────────────────────────────┘
```

Four things happened while he typed. He asked for none of them.

- **Search ran.** `Call kushan` surfaced on the shared token `call`. Not a duplicate, so nothing interrupts.
- **The parser read `morning`.** It is 10:40 and the morning band runs 09:00 to 12:00, so he is inside it. The band does not roll to tomorrow.
- **A parsed-date chip appeared at the front of the row**, reading `this morning`, already selected. The presets stay available to override it. Highlighting a preset would misrepresent a parsed value that rarely matches one exactly.
- **A type chip appeared**, reading `action`, tappable to change.

He hits enter.

---

## 3. What was stored

One task. Every field, every origin. **This is the Gate 1 table.**

| Field | Value | Origin |
|---|---|---|
| `id` | `019876e2-…` | System. UUID v7, client-generated, handed into the engine. |
| `raw_text` | `Call markan morning` | **Typed** |
| `title` | `Call markan` | Rule: `raw_text` minus the date span. This line carries no marker and no hedge, so it evidences neither; what happens to those is settled in `schema/contract.md`. |
| `normalised` | `call markan` | Rule: from `raw_text`, minus every structured span, lowercased, punctuation stripped |
| `notes` | *(empty)* | Default |
| `verb_phrase` | `Call` | **Typed.** The matched span, stored verbatim. |
| `action_verb` | `call` | Rule: lexicon canonicalises `Call` to the member `call`, scanned across the whole line |
| `commitment_type` | `action` | Rule: `verb_to_type[call]` |
| `type_source` | `derived` | Rule: the chip was shown and not tapped |
| `context` | `phone` | Rule: `verb_to_context[call]` |
| `significance` | `70` | **Tapped High.** Never inferred. |
| `date_phrase` | `morning` | **Typed.** The whole matched span, stored verbatim. |
| `date_hedge` | *(empty)* | No hedge present |
| `date_marker` | *(empty)* | No deadline or start word anywhere in the line |
| `date_precision` | `band` | Rule: `morning` names a 3-hour window |
| `date_firmness` | `normal` | Rule: no marker, no hedge. The unmarked middle. |
| `date_anchor` | `window` | Rule: a band names a window, not a point |
| `earliest_start` | `2026-08-03T09:00:00+05:30` | Rule: start of the window `due_at` belongs to, 09:00 local, unclipped |
| `due_at` | `2026-08-03T11:20:00+05:30` | Rule: window clipped to 10:40–12:00, midpoint 11:20 |
| `has_time` | `false` | Rule: a band is not an explicit time |
| `est_duration_min` | `15` | Config: `duration_defaults.call`. Fewer than 5 samples exist. |
| `duration_source` | `default` | Rule: follows from the line above. Members: `default`, `selected`, `learned`, `summed`. |
| `recurrence` | *(none)* | Nothing recurring in the text |
| `alarm_type` | `none` | Default. Never inferred. The advanced panel sets it, and only while `has_time`. Members: `none`, `on`. |
| `alarm_lead_min` | *(none)* | Default. The panel sets it; the chain is `alarm_lead_min`, `alarm_lead_by_type`, `alarm_defaults.lead_min`. |
| `alarm_snoozed_until` | *(none)* | Default. Written when a ringing alarm is snoozed, never at capture. |
| `alarm_unanswered_at` | *(none)* | Default. Written when an alarm rings its whole chain out unpressed. |
| `reminder_fatigue` | `0` | Default. Counts unanswered alarms and is never cleared. |
| `blocked` | `false` | Default. Part C. |
| `blocker_reason` | `none` | Default. Part C. |
| `blocker_ref` | *(none)* | Default. Part C. |
| `task_state` | `ready` | Rule: capture succeeded, no gates. Members: `ready`, `done`, `cancelled`. |
| `pinned` | `false` | Default |
| `project_id` | *(none)* | Default. Manual only, Part C. |
| `config_version` | `a.19` | System. The config in force at capture. Records are written to storage now, so the stamp is evidence again and the deviation that let it lag has expired. |
| `created_at` | `2026-08-03T10:40:00+05:30` | Clock, handed in |
| `updated_at` | `2026-08-03T10:40:00+05:30` | Clock. Equal to `created_at` until the first change. |
| `archived` | `false` | Default |
| `closed_at` | *(none)* | Not in a terminal state |

Thirty-seven stored fields. **Three came from typing, one from a tap, two from the clock, two from the system, one from config. The remaining twenty-eight came from written rules and stated defaults.**

**`task_state` holds outcomes; `archived` is a separate boolean.** `done` and `cancelled` are both terminal and both stamp `closed_at`, which is why the field is not called `completed_at`: seeing what you abandoned matters as much as seeing what you finished, and a state that records no time cannot be sorted. Archiving is not an outcome, it is a decision to stop looking at something, and it applies just as well to a finished task as an abandoned one.

`is_hard` is absent because it is a working value, derived at read time from `date_firmness`. See the working-values table below.

**The stored word and the derived level sit side by side on purpose.** `morning` and `by noon` would both produce `band`. Storing only `band` loses which one he wrote, and since stored data is never rewritten, it would be lost permanently. Keeping the phrase means a new lexicon can be run over every stored phrase to see what would change, without touching a single task.

**`action_verb` is a closed set, and the word that produced it is stored beside it.** The same split as `date_phrase` and `date_precision`, for the same reason: `Payments` canonicalises to `pay` and `application` to `submit`, so storing only the member loses what he wrote, and stored data is never rewritten. Keeping `verb_phrase` means a new lexicon can be replayed over every stored record offline.

The members this example uses are `call`, `check`, `pay`, `submit`, `file`, `reply`, `make` and `meet`, plus `other`. The full set is 18, lives in config, and belongs in the contract at Stage 2. `verb_to_type`, `verb_to_context` and `duration_defaults` all key on the member, never on the phrase.

**The lexicon matches nouns as well as verbs.** `application` gives `submit`, `software` gives `make`, `Payments` gives `pay`. That is why `Social alpha application deadline` carries a badge and `Srilanka tickets` does not: no entry exists for `tickets`, which is a coverage gap and exactly what `other` records. Nothing separates the two cases except which tokens the lexicon holds.

**Reconstruction invariant, scoped to typed input.** Every character of `raw_text` appears in `title`, or in a span the parser extracted from `raw_text`. A character in neither means the parser dropped something silently, which is protocol rule 5 failing quietly. This is a golden case.

A chip label was never in `raw_text`, so it does not participate: a chip capture leaves `title == raw_text` and satisfies the invariant trivially. Whether a phrase was typed or tapped is derived, not stored — `normalise(date_phrase) ⊂ normalise(raw_text)` — which stays correct even when the user types the exact words a chip would have inserted.

Markers and hedges appear both inside `title` and in their own fields. That is duplication, not a leak; the invariant only ever asked that nothing be dropped.

---

## 4. What he sees a second later

```
┌──────────────────────────────────────────────────────────────────┐
│   Social alpha application                                       │
│   Due today. You called this a deadline.           submit · 30m  │
│                                                                  │
│   file form 8                                                    │
│   Overdue since Friday.                              file · 30m  │
│                                                                  │
│   Call markan                                                    │
│   Due today, and you marked it high.                 call · 15m  │
│                                                                  │
│   Reply to bharti singhal                                        │
│   Due this morning.                                 reply ·  5m  │
│                                                                  │
│   check sensor                                                   │
│   Due today.                                       check ·  15m  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  Added "Call markan" · this morning          [Undo]    │      │
│  └────────────────────────────────────────────────────────┘      │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  ┌────────┐  │
│  │                                                │  │  Add   │  │
│  └────────────────────────────────────────────────┘  └────────┘  │
│  [This afternoon][Tonight][Tomorrow morning][Weekend][Pick date] │
│  [Pick time]                             [Low][**Normal**][High] │
└──────────────────────────────────────────────────────────────────┘
```

**The box went empty, and that is the confirmation.** No other UI is needed. It is the same signal as sending a message. Significance resets to Normal, and the type chip disappears with the text that produced it.

**The new task landed third.** Below the one carrying a deadline word, below the overdue one, above two tasks also due today. High significance lifted it past both and could not lift it past a hard deadline or past being late. That is tier 1, then factors 1 and 2, and if it reads wrong the thing to change is the tier membership or the factor order in config, not code.

The toast holds for 8 seconds (`config.undo_ui_timeout_sec`) and disappears. **The undo entry does not.** It survives until the next undoable action supersedes it, reachable through the engine after the button is gone.

---

## 5. Six more captures from the same call

Same session, 10:41 to 10:46. Each surfaces a different path.

### 5a. Verb at the end of the line

Types `USB integration call`, taps **This afternoon**, leaves significance at Normal. The tap types those two words into the box, so the line committed is `USB integration call This afternoon`.

| Field | Value | Origin |
|---|---|---|
| `action_verb` | `call` | Rule: the lexicon scans the whole line, not the first token |
| `date_phrase` | `This afternoon` | The words the chip typed, read the same as any other date span |
| `chip_spans` | `[{start: 21, end: 35}]` | Where those words sit. Stored, and read by nothing. |
| `title` | `USB integration call` | Rule: the date span leaves `title`, and the chip's words are a date span like any other |
| `date_precision` | `band` | Rule |
| `date_firmness` | `normal` | Rule |
| `earliest_start` | `2026-08-03T12:00:00+05:30` | Rule: start of the resolved window, 12:00 local |
| `due_at` | `2026-08-03T15:00:00+05:30` | Rule: window has not started, so no clipping. Midpoint 15:00 local. |
| `significance` | `30` | Untouched default |

Roughly a quarter of his real captures put the verb last. Leading-token matching would have returned `undetermined` here.

**The record keeps where the chip's words sit, and derives nothing from them.** `chip_spans` says characters 21 to 35 were tapped, not typed. Nothing in this capture reads it: take the field away and every other value here is identical. It is here for a question this example cannot answer, which is what happens when he taps `This afternoon`, sees the card say `Due at 3pm`, and edits the words. The screen moves the ranges as he edits, because only the screen saw the edits, and a range that no longer covers what was tapped is the answer rather than a fault.

**A chip and a typed word are the same thing, because a chip types the word.** The engine has no chip input: the tap puts `This afternoon` in the box and the rest is the ordinary date rule. The route the value took leaves no trace and needs none, whether he tapped or typed says nothing about how serious he is, and the word he can now edit or delete is right there in the line. It also means a new chip is a screen change and never an engine change, which matters because there will be many.

### 5b. A comma list stays one task

Types `Payments to coolindia, sudhi, laptop`, hits enter. No dialog. One record.

| Field | Value | Origin |
|---|---|---|
| `verb_phrase` | `Payments` | **Typed.** A noun form. |
| `action_verb` | `pay` | Rule: lexicon canonicalises `Payments` to `pay` |
| `commitment_type` | `deadline` | Rule: `verb_to_type[pay]` |
| `context` | `bills` | Rule: `verb_to_context[pay]` |
| `est_duration_min` | `30` | Rule: a comma list after a single verb, three items at `duration_defaults.pay` = 10 each, summed |
| `duration_source` | `summed` | Rule: follows from the line above |
| `date_precision` | `none` | Rule: no temporal expression |
| `significance` | `30` | Untouched default |

**One typed sentence is one task.** The comma count changes the duration and nothing else. Splitting it would have written two records the user did not ask for, and the engine cannot tell three payments from one payment described three ways.

**Summing runs only on a comma list after a single verb.** This is the condition the removed split dialog used, kept because the sum needs it just as much. `Call raj, then check sensor` carries two verb classes, so no sum runs and the duration is a plain `duration_defaults.call`. `Meet Priya, the new CFO, on Thursday` has one verb but its commas sit inside a temporal expression and an appositive rather than forming a list, so no sum runs. Without the guard, every comma anywhere would multiply a duration.

Summing is the weakest rule in the file and is flagged as such: it assumes every item costs a full default. If it proves wrong in use, the fallback is `duration_source = default` at a flat 10 and the comma count is discarded.

`selected` is the fourth member and no capture produces it: it marks a duration the user set from a control. The control is ignorable like every other one in the row, so nothing in this session touches it.

### 5c. No verb, no date

Types `Srilanka tickets`, hits enter.

| Field | Value | Origin |
|---|---|---|
| `verb_phrase` | *(empty)* | No token in the line matched the lexicon |
| `action_verb` | `other` | Rule: a lexicon gap. Adding an entry for `tickets` would resolve it. |
| `commitment_type` | `action` | Rule: `verb_to_type[other]`. A plain action, not a classification failure. |
| `context` | `undetermined` | Rule: no verb member, so the context could not be derived |
| `date_phrase` | *(empty)* | Nothing typed, no chip tapped |
| `date_precision` | `none` | Rule: no temporal expression at all, as distinct from `open` |
| `due_at` | *(none)* | No expression |
| `est_duration_min` | `5` | Config: `duration_defaults.other` |

**No field is null.** It routes to Ideas because there is no date, and it still carries a duration, because how long the work takes is a property of the work and has nothing to do with whether it has a date.

**`other`, not `undetermined`, and that follows from the noun path.** Once the lexicon matches nouns, a line with no match is a line whose token the lexicon does not hold, which is a coverage gap. `tickets` is a real thing to act on and the lexicon simply lacks the entry. `undetermined` would say the engine tried and could not resolve it in principle, which is a different and wrong claim.

**A consequence, and it is a large one.** A task always implies an action, which is why `action_verb` carries no `none` case. If it always implies one, then failing to find one is always a lexicon gap rather than an indeterminate result, so **`undetermined` is unreachable on `action_verb`**. The field carries its real members plus `other` and nothing else. `verb_phrase` stays empty here because nothing matched; a populated `verb_phrase` alongside `other` would mean a token matched a candidate rule but no member, which no rule in Part A produces.

### 5d. A hedge, and a week-wide window

Types `maybe call kushan next week`, hits enter.

| Field | Value | Origin |
|---|---|---|
| `date_phrase` | `next week` | **Typed** |
| `date_hedge` | `maybe` | **Typed**, stored separately |
| `date_precision` | `week` | Rule: a 7-day window |
| `date_firmness` | `soft` | Rule: `normal` demoted one level by the hedge |
| `date_anchor` | `window` | Rule |
| `earliest_start` | `2026-08-10T09:00:00+05:30` | Rule: start of the resolved window, Monday 10 Aug 09:00 local |
| `due_at` | `2026-08-13T16:30:00+05:30` | Rule: week window `[Mon 10 Aug 09:00, Sun 16 Aug 24:00)`, entirely future so unclipped. Midpoint Thursday 13 Aug 16:30 local. |
| `significance` | `30` | Untouched |

**The duplicate dialog fires here.** `normalised` strips the hedge and the date phrase, leaving `call kushan`, which matches the open `Call kushan` exactly. He taps Add anyway. A dated version of an existing task is a different commitment, and the engine cannot know that, which is why it asks rather than deciding.

**The hedge touches the date and nothing else.** It never moves significance, because significance is a control the user holds and the engine may not write to it. On a task with no date at all, the hedge is stored and does nothing.

Part B will read `soft` and roll this forward silently rather than chase it. Part A stores the level and stops.

### 5e. A deadline word with no date beside it

Types `GST filing deadline`, hits enter.

| Field | Value | Origin |
|---|---|---|
| `date_marker` | `deadline` | **Typed.** A strong marker, so it counts wherever it appears. |
| `date_firmness` | `hard` | Rule: a deadline word is present |
| `is_hard` | `true` | **Working value**, derived from `date_firmness`. Shown here because it is the point of this case. |
| `date_phrase` | *(empty)* | No temporal expression at all |
| `date_precision` | `none` | Rule |
| `date_anchor` | `none` | Rule: no temporal expression, so nothing to anchor. The marker still records the deadline. |
| `due_at` | *(none)* | Nothing to resolve |

**Hard firmness with no date.** The task routes to Ideas like any other dateless capture, and `is_hard` sits there inert, because there is no date for it to be hard about. The moment a date is added, Part B already knows to chase it. Capturing a field and using it are separate questions.

### 5f. Exactly what already exists

Types `check sensor`. Live results show the existing one immediately. He hits enter anyway.

```
  ┌────────────────────────────────────────────────────────┐
  │  "check sensor" already exists, due today.             │
  │                       [Add anyway]        [Cancel]     │
  └────────────────────────────────────────────────────────┘
```

He taps **Add anyway**. A second task is created with a distinct `id`. No merge offer and no third button. Merging two records into one is not a Part A operation at all: the way to reach an existing task is to tap it in the live results, which binds it for editing. Cancel, tap, edit.

---

## 6. Finding, binding, and acting

He types `bharti`.

```
  ┌──── results ───────────────────────────────────────────┐
  │  ACTIVE                                                │
  │      Reply to bharti singhal   due today · reply ·  5m │
  │    bharti sighla VC          due Thu   · meet   · 60m  │
  └────────────────────────────────────────────────────────┘
```

Both surface. `bharti sighla VC` and `bhati sighla VC` are near-duplicates from his real backlog, and **live search is where that gets handled**, silently, with no dialog.

Search matches in four tiers: exact, prefix, token overlap, then fuzzy similarity above a configured threshold. Transliterated names typo inconsistently, so a fuzzy tier is the only thing that surfaces `bhati` against `bharti`.

**The duplicate dialog uses the fourth tier too.** The comparison runs in three steps, in order.

1. **Strip numeric tokens.** `compare_key` is `normalised` with every purely numeric token removed. `file form 8` gives `file form`.
2. **Suppress numeric variants.** If two `compare_key`s are equal but their `normalised` differ, the only difference between the two lines is a number. They are distinct items and no dialog fires.
3. **Otherwise score.** `similarity` is `max(trigram, word_match)` over the two `compare_key`s. The dialog fires when it reaches `config.duplicate.threshold`, which is `0.8`, and both keys are at least `config.duplicate.min_chars` long.

An exact match is the 1.00 case of step 3, so there is one comparison and one dialog rather than two of each.

**Step 2 has to be a suppression rule, not a normalisation.** Stripping the digits makes `file form 8` and `file form 9` identical, which is the *highest* possible score. Left to step 3 they would interrupt every time, which is the opposite of the intent. The rule is about numeric tokens rather than about the last character, so `sensor 1 check` and `sensor 2 check` are covered by the same clause.

**Both measures are Sørensen–Dice.** `trigram` runs over character trigrams of the `compare_key`, padded with two leading spaces and one trailing space. `word_match` runs over the token sets. Neither alone separates the cases:

| A | B | trigram | word | max | Fires | |
|---|---|---|---|---|---|---|
| `bharti sighla vc` | `bhati sighla vc` | 0.85 | 0.67 | 0.85 | yes | transliterated typo |
| `sensor check` | `check sensor` | 0.85 | 1.00 | 1.00 | yes | reordered, same task |
| `reply to bharti singhal` | `reply bharti singhal` | 0.89 | 0.86 | 0.89 | yes | dropped filler |
| `gst filing deadline` | `gst filing` | 0.71 | 0.80 | 0.80 | yes | substring |
| `call raj` | `call ravi` | 0.74 | 0.50 | 0.74 | no | two people |
| `call markan` | `call kushan` | 0.50 | 0.50 | 0.50 | no | two people |
| `file form 8` | `file form 9` | — | — | — | no | step 2 |

Word match carries the reordered case, which trigrams miss. Trigrams carry the typo, which word match misses.

**This rule is fitted, not derived.** There is no backlog behind it. The threshold was chosen against eleven hand-made pairs, four of them written to test it, and `gst filing deadline` landing on exactly 0.80 is luck rather than design. At 0.6 the name pairs interrupt each other, which for transliterated names would be constant. The first misfire in real use is the evidence that corrects it. `config.duplicate.min_chars` at 6 is inert at this threshold and is kept as a floor rather than as a working control.

He taps `Reply to bharti singhal`:

```
├──────────────────────────────────────────────────────────────────┤
│  ⟨ Reply to bharti singhal ✕ ⟩   [Done] [Cancel] [Archive]       │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┌────────┐  │
│  ┃ Reply to bharti singhal                        ┃  │  Edit  │  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  └────────┘  │
│  [✓ this morning][This afternoon][This evening][Tonight]         │
│  [Tomorrow morning][Tomorrow afternoon][Tomorrow evening]        │
│  [Weekend][Next weekend][Next week][Next month]                  │
│  ⟨action ▾⟩                              [Low][**Normal**][High] │
└──────────────────────────────────────────────────────────────────┘
```

**Tapping a row is how you reach the actions.** Done and Cancel each set `task_state` and stamp `closed_at`. Archive flips the `archived` boolean and touches neither, so an archived task keeps whatever outcome it had. All three appear beside the bound-task chip, grouped with the task they act on. No buttons sit on list rows, and no gesture is required anywhere.

**Three signals say bound at once**, because one is not enough. The button reads Edit. A chip above the field names the task, with an ✕. The field itself is drawn differently. Overwriting an existing task while believing you are capturing a new one is silent data loss, and the button label alone would not prevent it, because he is looking at the field.

**All three read one value.** `bound_task_id` is handed in with every capture, empty when nothing is bound. The button label, the chip and the field's appearance are each a function of whether it is empty, so they cannot disagree with each other. Naming them as three independent outputs would have left four things that must agree and no statement that they do, which is exactly the failure mode the three signals exist to prevent.

He enters the bound state by tapping a result. He leaves it by saving, by emptying the field, or by tapping the ✕.

The chips and the significance buttons now show the task's current values, not defaults.

He appends ` about the invoice`, taps Edit. The task updates, the box empties, one undo entry is written, no new row is created.

**Binding is entered only by tapping a result. It is left by saving, by clearing the field to empty, or by tapping the ✕. There is no other path either way.**

---

## 7. Ideas, at the end of the session

```
┌──────────────────────────────────────────────────────────────────┐
│  Ideas                                                           │
├──────────────────────────────────────────────────────────────────┤
│  Sort:  [Duration ▾]   Newest                                    │
│                                                                  │
│    Srilanka tickets                                           5m │
│    Kena investment                                            5m │
│    GST filing                                       file ·  30m  │
│    Payments to coolindia, sudhi, laptop               pay ·  30m │
│    oncology map software                             make ·  60m │
└──────────────────────────────────────────────────────────────────┘
```

Two pairs tie, and factor 9 orders each. At 5m, Srilanka tickets was captured this session and Kena investment was not touched at all. At 30m, GST filing was captured after the payments.

**`duration_defaults.other` is 5, deliberately low.** A task the lexicon cannot classify is one the engine knows nothing about, and a low guess floats it to the top of the duration sort rather than burying it. The sort exists to surface quick wins, so an unknown should be offered rather than hidden.

Sorting Ideas by duration is what stops a someday list becoming a graveyard. "Forty minutes free, low energy" becomes an answerable question instead of a scroll.

---

# Gate 1 check

> *I read the example and cannot find a value on it whose origin is unclear.*

Every value in section 3 is marked Typed, Tapped, Clock, System, Config, Rule or Derived. Sections 5 to 7 mark only the fields that differ.

## Ranking factors, as used above

Ordering runs in three tiers. A tier is only reached when the one above it ties.

**Tier 1, overrides.** Absolute. No score can beat them, now or under any later scoring model.

| # | Override | Direction |
|---|---|---|
| 1 | `pinned` | true before false |
| 2 | `is_hard` | true before false |

**Tier 2, mode.** `lexicographic` today: the factors below run in order and the first that separates two tasks decides. A later `weighted` mode would combine them into a score instead, and tier 1 would still sit above it.

**Tier 3, factors.** Nine, in order.

| # | Factor | Direction |
|---|---|---|
| 1 | `deadline_band` | overdue, today, tomorrow, this_week, later, none |
| 2 | `significance` | descending, 70 / 30 / 10 |
| 3 | `date_firmness` | `normal` before `soft`, `hard` already separated in tier 1 |
| 4 | `date_precision` | time, band, day, span, week, month, open, none, undetermined |
| 5 | `commitment_type` | config order |
| 6 | `est_duration_min` | ascending, shorter fits first |
| 7 | `workflow_position` | 0 until Part C |
| 8 | `reminder_fatigue` | 0 until Part B |
| 9 | `updated_at` | descending, most recently touched first. The final tie-break. |

**A hard deadline beats everything, including being overdue.** `Social alpha application deadline` is due today and sits above `file form 8`, which has been overdue since Friday. Pushed further, a task three weeks late sits below one due this afternoon that happens to say "by Friday". That is deliberate: a hard deadline is a promise made to someone else, and being late on your own list is not. If the ordering ever reads wrong, tier 1's membership is the thing to change.

**The three tiers exist so a scoring model can arrive without restructuring.** Setting `ranking.mode` to `weighted` and filling `ranking.weights` replaces tier 3 wholesale. Tier 1 is untouched, so hard deadlines keep winning by construction rather than by carrying a large enough number.

**Factor 9 is last touch, not creation.** Editing a task means you are thinking about it, so it rises among the things it ties with. Comparison is on the absolute instant, not the local clock reading, so tasks captured under different offsets order correctly against each other.

`updated_at` moves on every change, including Done. **An undo restores the previous `updated_at` along with everything else it reverses.** Otherwise a reversed action leaves a mark it cannot remove and the task stays misordered by something that did not happen. This is a golden case.

## Closed since version 1

| Was open | Now |
|---|---|
| Time band already past | Three cases: not started, in progress, fully passed. See Window resolution below. |
| `date_origin`, typed versus chip | Dead. Replaced by `date_precision`, `date_firmness` and `date_anchor`, derived from the expression rather than the route. |
| `normalised` source | From `raw_text` minus every structured span. `title` strips only `date_phrase`. |
| Who generates the id | Client, UUID v7, handed into the engine as an input. |
| Timezone | Local storage with offset, `2026-08-09T04:30:00+05:30`. Anchors and band boundaries are local. |
| Significance inert at 30 | Asked at capture, three buttons, 10 / 30 / 70. Renamed from `importance`, which read as a ranking weight. |
| D-1 wording | Ratified: *Typing the thought is the whole of the work.* |
| Ranking factor order | Reopened in Session 20 and re-settled. Three tiers: `pinned` and `is_hard` as overrides, then nine factors led by `deadline_band`. |
| Parsed-date chip | Shows the resolved value rather than highlighting a preset. |
| Deadline word placement | Strong markers anywhere; weak markers only next to a date. |
| Window resolution | Three cases, with the window clipped at `now` before the midpoint is taken. `earliest_start` follows the resolved occurrence. |
| Mid-window overdue | Intended. It is the early nudge, not a bug. |

## Marker words, split by ambiguity

| Strength | Words | Counts |
|---|---|---|
| Strong | `deadline` · `cutoff` · `last date` · `expires` · `no later than` · `due date` · `latest` | Anywhere in the line, date present or not |
| Weak | `by` · `before` · `due` · `till` · `until` | Only when adjacent to a temporal expression |

`Send the bill by courier` therefore stays `normal`, and `GST filing deadline` becomes `hard` with no date at all. The split exists because the strong words cannot mean anything else, while `by` and `before` are two of the commonest prepositions in English.

## Mid-window overdue is intended

`next week` is due Thursday, so from Friday the task enters `deadline_band = overdue` with two days of its window still to run. That is the design: rising in the list before the window closes is the nudge, and tier 3's first factor is where a nudge has effect.

Part B reads `date_firmness` rather than the band when deciding whether to chase, so a `normal` or `soft` window task rises without being pestered. Only `is_hard` earns escalation.

**The middle member is `normal`, not `firm`, and the rename is the whole fix.** `hard` is earned by a marker and `soft` is earned by a hedge. Nothing earns the middle: it is what remains when neither fires. Calling it `firm` made it claim a property the input never supplied, so `Send the bill Friday` and a date parked with no intention behind it stored the same word and that word said both were firm commitments. `normal` says only that nothing was marked, which is exactly what happened.

**No `firmness_source` field.** It would read `default` on every `normal` and `derived` on every `hard` and `soft`, which makes it a pure function of `date_firmness` and puts it in the working-values table rather than the record, alongside `is_hard`. `duration_source` earns its place because a defaulted 15 and a learned 15 are the same number; a defaulted firmness and a derived one are different words. The field becomes necessary the moment a user can set firmness directly, because then `normal` would mean either "nothing was marked" or "the user chose it". Part A has no such control.

## Window resolution, three cases

Every window expression resolves by the same rule, which replaced the earlier floor rule.

| Case | `due_at` | Example at 10:40 Monday |
|---|---|---|
| Window has not started | Midpoint of the stated window | `this afternoon` → 15:00 |
| Window is in progress | Midpoint of `max(stated_start, now)` to the window end | `morning` → 11:20 |
| Window has fully passed | Midpoint of the next occurrence, unclipped | `morning` typed at 13:00 → `earliest_start` tomorrow 09:00, `due_at` tomorrow 10:30 |

For `window` and `start` anchors, `earliest_start` records the start of **the window `due_at` belongs to**, unclipped. An `end` anchor leaves it empty; see the anchor table below. In cases 1 and 2 that is the stated start. In case 3 it is the next occurrence's start, so the two fields never describe different days.

**Every window is half-open, `[start, end)`.** Half-open intervals abut without gaps or overlaps at their shared bounds, which is what makes the arithmetic in this file exact. The claim is about interval arithmetic, not about coverage: the four bands run from 09:00 to 24:00 and deliberately leave `[00:00, 09:00)` unnamed, because no band word refers to it. Writing "end of day" as 23:59 loses 59 seconds and shifts every midpoint by half a minute, and Stage 4's boundary cases would surface that as a failing test rather than as a rounding quirk.

**`day_start_anchor` is 09:00, and the morning band starts from it rather than repeating the number.** Config reads `time_bands.morning: [day_start_anchor, "12:00")`, so the coupling is visible where it lives. Shifting your day start moves the morning band and every picked date's midpoint together, which is coherent: a longer day has an earlier middle. If you want picked dates to stay put when your morning moves, the two have to become separate keys, and that is a config change rather than a rule change.

The four bands are `morning [09:00, 12:00)`, `afternoon [12:00, 18:00)`, `evening [18:00, 21:00)`, `night [21:00, 24:00)`.

**Every window's bounds, stated once.** All half-open, all starting at `day_start_anchor` on their first day and running to 24:00 exclusive on their last.

| Precision | Bounds | Midpoint, unclipped |
|---|---|---|
| `band` | The band's own hours | morning `[09:00, 12:00)` → 10:30 |
| `day` | `[day_start_anchor, 24:00)` | 16:30 |
| `span` (weekend) | `[Sat 09:00, Mon 00:00)` | Sunday 04:30 |
| `week` | `[Mon 09:00, next Mon 00:00)` | Thursday 16:30 |
| `month` | `[1st 09:00, 1st of next 00:00)` | August → 16 Aug 16:30 |
| `time` | Not a window. Resolves to the stated instant. | n/a |

A midpoint can land outside working hours, as the weekend's 04:30 does. That is harmless because `has_time` is `false` for every window resolution, so only the date is consumed: the display shows Sunday, and `deadline_band` reads the date. No rounding rule is needed and adding one would buy nothing.

A `day` needs no rule of its own: it is the window `[day_start_anchor, 24:00)`, so the same three cases resolve it. `20 Aug` captured a week earlier resolves `[09:00, 24:00)`, midpoint 16:30. Captured on the 20th at 14:00 it clips to `[14:00, 24:00)`, midpoint 19:00. Both are exact only because the upper bound is 24:00 exclusive. `month`, `span` and `week` resolve the same way from the bounds above. `time` is the only level that is not a window: it resolves to the stated instant, with `has_time = true`.

**Precision does not imply anchor.** `at 5pm`, `by 5pm` and `after 5pm` all carry `date_precision = time` and resolve to different anchors, because the time supplies the value and the marker supplies the strategy. `has_time` follows the presence of a time, not the anchor: it is `true` on all three and `false` on every window resolution.

The third case applies only to the daily bands, `morning`, `afternoon`, `evening` and `night`, because those recur. `weekend`, `next week` and `next month` name a forward window by definition and can never be fully past at capture. Collapsing a passed band to `now` would be wrong: nobody typing `morning` at 13:00 means this instant. Refusing to parse would be worse, because it discards a clear temporal intent and drops the task into Ideas.

**A passed time rolls only if it recurs.** A bare time recurs daily, so `call him at 3pm` typed at 16:00 resolves to tomorrow 15:00. A time attached to a date does not recur, so `meeting 20 Aug 3pm` typed on 25 August stays where it was said and lands overdue, which is correct: the user named a specific past coordinate and the record should say so. This is the same recurrence test the third window case uses, and it applies wherever a bare time supplies the value, including under an `end` or `start` anchor.

The risk is a user who meant today losing the task for a day. The safeguard already exists rather than being added for this: the parsed-date chip shows the resolved value before they commit, so `tomorrow 3pm` is visible and one tap from being changed.

**A consequence worth a golden case.** `due_at` for a window depends on when it was captured. The same phrase typed a day apart resolves to different instants.

### Every precision level, resolved

All captured Monday 3 August 2026 at 10:40. Times are Asia/Kolkata, `+05:30`.

| Phrase | Precision | Anchor | `earliest_start` | `due_at` | `due_at` as stored |
|---|---|---|---|---|---|
| `morning` | `band` | `window` | Mon 3 Aug 09:00 | Mon 3 Aug 11:20 | `2026-08-03T11:20:00+05:30` |
| `20 Aug` | `day` | `window` | Thu 20 Aug 09:00 | Thu 20 Aug 16:30 | `2026-08-20T16:30:00+05:30` |
| `Weekend` | `span` | `window` | Sat 8 Aug 09:00 | **Sun 9 Aug 04:30** | `2026-08-09T04:30:00+05:30` |
| `next week` | `week` | `window` | Mon 10 Aug 09:00 | Thu 13 Aug 16:30 | `2026-08-13T16:30:00+05:30` |
| `next month` | `month` | `window` | Tue 1 Sep 09:00 | **Wed 16 Sep 04:30** | `2026-09-16T04:30:00+05:30` |
| `at 5pm` | `time` | `point` | *(empty)* | Mon 3 Aug 17:00 | `2026-08-03T17:00:00+05:30` |

Only `morning` is clipped, because it is the only window already in progress at 10:40. The rest are case 1 and resolve unclipped.

**Timestamps are stored local with an offset, not as UTC.** `2026-08-09T04:30:00+05:30`, not `2026-08-08T23:00:00Z`. Both name the same instant and either converts to the other, so nothing is lost; what changes is which one a reader sees first. Local is what the user said and what the card shows, so local is what the field holds. The offset is there so no reader has to guess a zone, and so a machine can compare instants without one.

The `Weekend` and `next month` rows are why this matters. Both midpoints land at 04:30 local, which is the previous day in UTC. Stored as `Z` they read 8 August and 15 September, a day earlier than the card, and any component comparing dates without converting would fire a day early. Stored with the offset the field reads Sunday 9 August and Wednesday 16 September, which is what the user would say if asked.

**A band is a slot in the day; a stated time is usually a coordinate.** `morning` never said 11:20, the midpoint rule chose it, which is exactly what `has_time = false` records. `3pm` is what the user said. So a task captured in India and read in London should arguably re-derive its band in London and hold its stated time fixed.

**Part A does not do that, and commits only to preserving the inputs.** Nothing fires in Part A, so whether and when to re-derive is Part B's decision. What Part A owes is that the decision remains available: `date_phrase` holds the words, `date_precision` holds the level, `has_time` says whether the clock reading was the user's or the engine's, and the stored offset says which zone produced it. Stored data is never rewritten, so any re-derivation is a read-time behaviour on those four fields.

`has_time` is a proxy for "is this time about my day or about another person", and an imperfect one. `gym at 7am` is a slot expressed precisely and would wrongly stay fixed; `call markan in the morning` is about markan's day and would wrongly move. Nothing in Part A can separate them, because the discriminator is whether someone else is on the other end.

**An offset is not a zone, and that limit is Part D's.** `+05:30` is safe here because India observes no daylight saving, so a future instant carries the offset it will still have when it arrives. A zone that does observe it can shift between capture and due date, and an offset stored today would then be wrong. The fix at that point is a zone name rather than an offset, which is a sync-era change and not one Part A needs.

**A month's midpoint alternates with month length.** A 31-day month lands at 16:30 and a 30-day month at 04:30, because the window is a whole number of days plus 15 hours and halving it lands on a half-hour either side of the day boundary. August gives 16 Aug 16:30, September gives 16 Sep 04:30. This is the same arithmetic that puts the weekend at 04:30 and needs no more of a rule than that one did, since `has_time` is `false` and only the date is consumed.

## The five `date_anchor` members

The anchor is a **resolution strategy**, not a label on the commitment. It says which rule turns the expression into `due_at` and `earliest_start`, so it is decided by what the expression is, and only then by what marks it.

Five members, evaluated in this order. The first that fires wins, which makes the function total and collision-free.

| Order | Member | Fires when | Resolves to |
|---|---|---|---|
| 1 | `none` | No resolvable window and no time. Precision `none`, `open` or `undetermined`. | Nothing |
| 2 | `end` | A deadline marker | Time → `due_at` = that instant. Window → `due_at` = window end − 1 minute. `earliest_start` **empty** either way. |
| 3 | `start` | A start marker | Time → `earliest_start` = that instant. Window → `earliest_start` = window start. `due_at` empty either way. |
| 4 | `point` | A time, no marker | `due_at` = the stated instant. `earliest_start` empty. |
| 5 | `window` | A window, no marker | `due_at` = window midpoint. `earliest_start` = window start. |

**The marker rows sit above `point` because a time supplies the value, never the strategy.** Each of them branches on what follows it. Ordering `point` first made `after 5pm` resolve to `due_at` 17:00, turning a constraint on when work may begin into a deadline, which is the same inversion as writing `earliest_start` on an `end` anchor. It also gave `by 5pm` the anchor `point`, so the field named the rule that happened to produce the number rather than the rule that ran.

**Row 1 keys on precision, not on the raw presence of an expression.** `someday` parses to `open` and a failed parse gives `undetermined`; both are expressions, and neither has bounds. Keying on "no temporal expression" sent them to row 5, where the midpoint rule has no window to take a midpoint of.

**Only `end`, `start` and `window` act on a window.** That is what dissolves the two collisions. `GST filing deadline` carries a strong marker but its precision is `none`, so it stops at row 1: anchor `none`, nothing resolved, while `date_marker`, `date_firmness` and `is_hard` all record that it is a deadline. `by 5pm` carries a marker and a time, so it stops at row 2: anchor `end`, `due_at` 17:00, which is the same instant `at 5pm` produces under a different strategy.

Storing `end` on a dateless line would be the wrong kind of field. `is_hard` is a property of the commitment and sits inert quite happily. An anchor is a strategy, and a strategy with nothing to resolve is not inert, it is absent.

**`end` leaves `earliest_start` empty, and this is the correction that matters most.** `by Friday` means any time between now and Friday. Writing `earliest_start` = Friday 09:00 says the opposite, that work may not begin until Friday, and once Part C gates visibility on that field the task hides until Friday morning and the deadline is defeated by the field meant to support it.

It also restores a distinction that was collapsing. Plain `Friday` is a `window` anchor: `earliest_start` Friday 09:00, `due_at` Friday 16:30, meaning *do it on Friday*. `by Friday` is an `end` anchor: `earliest_start` empty, `due_at` Friday 23:59, meaning *do it any time up to Friday*. Two different commitments, and the fields now say so on both, not just on one.

**Every deadline marker implies `end`.** There is no case where a strong marker sits on a start anchor: `deadline`, `cutoff`, `last date`, `expires`, `no later than`, `due date`, `latest`, `by`, `before`, `due`, `till` and `until` all say when something must be finished. So the `end` set is exactly the union of the strong and weak marker lists, and no third vocabulary exists.

**Start markers set the anchor and nothing else.** `after` · `from` · `starting` · `once` · `not before`. They do not touch `date_firmness`, because "after Friday" constrains when work may begin rather than when it must end. A `start` anchor with no deadline leaves `due_at` empty, so the task routes to Ideas with its `earliest_start` recorded. That is correct: no due date means no deadline pressure, and when Part C arrives `earliest_start` begins gating visibility.

**One anchor per line.** `date_anchor` is single-valued, so `after Monday before Friday` resolves as `end` and drops the start bound, even though `earliest_start` is empty and could have held it. That is a limit of the enum rather than a fault in the ordering, and it is written here so it is not rediscovered as a bug.

### Four sub-branches and `point`, worked

Captured Monday 3 August at 10:40. Times local.

| Input | Precision | Anchor | `earliest_start` | `due_at` | `has_time` |
|---|---|---|---|---|---|
| `at 5pm` | `time` | `point` | *(empty)* | Mon 17:00 | true |
| `by 5pm` | `time` | `end` | *(empty)* | Mon 17:00 | true |
| `after 5pm` | `time` | `start` | Mon 17:00 | *(empty)* | true |
| `by Friday` | `day` | `end` | *(empty)* | Fri 23:59 | false |
| `after Friday` | `day` | `start` | Fri 09:00 | *(empty)* | false |

Rows 1 to 3 differ only in the marker and produce three different records from the same instant. Rows 4 and 5 show the window branch of the same two markers: `end` takes the window's last minute, `start` takes its first. Plain `Friday` sits between them at `earliest_start` Fri 09:00, `due_at` Fri 16:30.

`date_firmness` is `hard` on both `by` rows, because `by` is a weak marker adjacent to a temporal expression. It is `normal` on both `after` rows, because start markers do not touch it, and `normal` on `at 5pm`, which carries no marker at all.

## The fourteen commitment types

Factor 6 sorts by `config.type_order`, which is this list read left to right.

`appointment` · `deadline` · `action` · `habit` · `maintenance` · `purchase` · `decision` · `research` · `waiting` · `project` · `information` · `goal` · `wish` · `idea`

All fourteen ship in `a.1` and only two are exercised here. Each vocabulary member carries an `active` flag, so a type that proves unnecessary is deactivated rather than removed: it stops being offered and stops being written, while every record already holding it still reads correctly. Removal is forbidden, because it orphans records.

`action` is the fourteenth, added because a plain one-off had no home in the original thirteen, and it doubles as the default.

## Fallback vocabulary, one set of three

| Member | Means | Actionable |
|---|---|---|
| `other` | A real value, missing from the lexicon | Yes. Add the token. |
| `undetermined` | Tried to derive it and failed | Sometimes. Depends on why. |
| `none` | Not applicable. Nothing to derive from. | No. |

Not every field carries all three. `action_verb` carries only `other`: it has no `none` case because a verb always applies to a task, and no `undetermined` case because if one always applies, failing to find one is always a lexicon gap. `blocker_reason` has no `undetermined` case, because nothing infers it.

**`commitment_type` carries no `other`, and `action` is a legitimate default rather than a failure in disguise.** A task that matches no other type genuinely is a plain action, which is why `action` was added as the fourteenth type. The failure signal already exists upstream: `commitment_type` derives from `action_verb`, so a classification failure shows as `other` there. Adding `other` here would count the same failure twice.

**The tail of `date_precision` is currently unreachable.** `open`, `none` and `undetermined` all imply no `due_at`, which routes the task to Ideas, and Ideas sorts by duration rather than by the ten ranking factors. The order is defined anyway so the sort is total, not because anything exercises it.

Applying this vocabulary uniformly fixed two conflations. `context` was using `none` to mean "we could not tell", which is `undetermined`. And `date_precision`'s `open` was doing three jobs: a parsed unbounded window, no expression at all, and an expression that failed to parse.

## Working values, derived and never stored

Four of the ten ranking factors are not columns. Each is computed at read time from the inputs below.

| Working value | Inputs | Why not stored |
|---|---|---|
| `deadline_band` | `due_at`, `now`, `config.deadline_bands` | Changes at every midnight. A cached copy goes stale silently. |
| `is_hard` | `date_firmness` | A pure function of one stored field. |
| `workflow_position` | `workflow_edges` | Part C. Constant 0 in Part A. |
| `reminder_fatigue` | `notification_history` | Part B. Constant 0 in Part A. |

These belong under "working values" in the Stage 2 contract, not under inputs or outputs.

## Open

Nothing blocks Gate 1. Two items are deferred by decision rather than by oversight.

| # | Item | Owner |
|---|---|---|
| 1 | No **capture** exercises `span`, `day`, `month` or `time`. All four are resolved in the precision table, and the anchor members in the anchor table, so every level has a worked value with a traceable origin. What is absent is a card and a full 37-field record behind each, which Stage 4 needs as golden cases anyway. | Stage 4 |
| 2 | The 400-line rule is code-only; wording agreed and in the decision log. Applying it to `BUILD_PROTOCOL.md` remains outstanding, since that file is not this project's to edit. | Vishal |

---

## What is deliberately absent from this example

No reminder fires anywhere in it. No task belongs to a project. Nothing is blocked or waiting. Nothing syncs to a second device. No field was mandatory except the text. Those absences are Part A working correctly, not gaps in the example.
