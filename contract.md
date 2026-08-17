# Cascade Part A — Contract

Stage 2 deliverable, version 52. Companion to `spec/example.md`; see VERSIONS in spec.md.

This file says what every piece of information **is**. `spec/example.md` says what one session **was**. Where they disagree, one of them is wrong and the disagreement is a defect.

Everything the app touches, in three groups, as Part 3 requires:

- **Inputs** — handed in. Not computed.
- **Working values** — computed and not saved.
- **Outputs** — saved, or shown.

**This contract is the only source of names.** One concept, one spelling, everywhere, forever.

---

## The reading rule

**A record is read against its own `config_version`, never the current one.**

Vocabulary members live in config. A record holds the members its own config version defined. Reading it against a later config that had repurposed one would silently reinterpret it.

- **A vocabulary member is never removed or repurposed.** It is deactivated, which stops it being offered and stops it being written, while every record already holding it still reads correctly.
- Every read path takes a config version, defaulted to the record's own.
- Ranking compares tasks written under different config versions. Factor 6 uses `type_order`, which is config, so the comparison uses the **current** config's order for display while each record's members stay interpreted under their own version.

### `config_version` format

`<letter>.<integer>`, e.g. `a.1`. Ordering is by letter, then integer.

| Change | Bumps |
|---|---|
| Add a vocabulary member | integer |
| Deactivate or reactivate a member | integer |
| Lexicon, mapping, bounds, thresholds, ordering, limits | integer |
| A change that makes an existing record uninterpretable | **letter** |

**No operation currently bumps the letter.** Deactivation removed the only case that would have. The letter is reserved so that if such a change is ever forced, old records are identifiable by version string alone.

---

## Illegal values

**At parse time**, low confidence resolves to a fallback member and never asks. `other` for a lexicon gap, `undetermined` for a derivation that failed, `none` for nothing to derive from.

**Below the minimum**, there is no capture to make. A `typed_line` shorter than `limits.raw_text_min_chars` after trimming, or carrying no letter or digit, is not a task: the Add button does nothing, the screen shows nothing, and no record is written. `resolve()` throws if it is called with one anyway, because reaching the engine with an unregistrable line is a screen defect and should be loud rather than silent.

**At write time**, a value outside this contract is an engine defect, not a user error. The engine rejects the record and does not coerce. Coercion hides the bug and writes something the user did not ask for.

**At read time**, a vocabulary member absent from the record's own config version is corruption. The record is quarantined and surfaced, never dropped and never silently rewritten.

> **Open.** Quarantine behaviour is proposed, not ratified. Needed before Stage 7.

---

# 1. Inputs

Handed in by the user, the clock, the client or config. Nothing here is computed.

| Name | Type | Required | Unit | Range / legal values | Example |
|---|---|---|---|---|---|
| `typed_line` | text | yes | characters | `limits.raw_text_min_chars` to `limits.raw_text_chars`, carrying at least one letter or digit. The input refuses further keystrokes at the upper limit. | `Call markan morning` |
| `chip_spans` | list of | yes | characters | half-open `[start, end)` ranges in `typed_line`. Empty list when nothing was tapped. | `[{start: 21, end: 35}]` |
| `type_chip_tap` | one-of-a-fixed-set | no | — | an active member of `commitment_types` | `deadline` |
| `significance_tap` | whole number | no | points | a member of `significance_buttons` | `70` |
| `duration_tap` | whole number | no | minutes | `limits.duration_min` to `limits.duration_max`. Non-null writes `duration_source` `selected` and the per-verb default is not consulted; a comma list's sum loses to it too. | `30` |
| `firmness_tap` | one-of-a-fixed-set | no | — | `hard` `normal` `soft`. Overrides the firmness the marker words implied, so `is_hard` follows it. Empty leaves the words their say. | `hard` |
| `notes_text` | text | yes | characters | 0 to `limits.notes_chars`. Written to `notes` verbatim and read by nothing else: it never enters `normalised`, so it reaches neither search nor duplicate detection. | *(empty)* |
| `row_action` | one-of-a-fixed-set | no | — | `done` `cancel` `archive` `pin` `edit` `undo` `delete` `push` `undone` | `done` |
| `bound_task_id` | text | no | — | UUID v7 of the task being edited. Empty means capturing a new one. | `019876e2-…` |
| `now` | date-and-time | yes | — | local with offset | `2026-08-03T10:40:00+05:30` |
| `new_id` | text | yes | — | UUID v7, client-generated, handed into the engine | `019876e2-…` |
| `config` | object | yes | — | a `Config` at a stated `config_version` | `a.1` |
| `existing_tasks` | list of | yes | — | every open `Task`, handed in whole. Empty list on a first capture. Duplicate detection reads each one's stored `normalised`. | `check sensor` |

**`bound_task_id` is handed in, not held by the engine.** The three bound-state signals are each a function of it, so they cannot disagree. Holding the binding inside the engine would mean a golden case could not set up an edit without first replaying the tap, and would give the engine memory that persists between calls.

**Whatever a person can set while capturing is an input.** `duration_tap`, `firmness_tap` and `notes_text` join the two taps for that reason, and the record comes back complete rather than patched afterwards by the screen. What the screen patches on save is the other kind: the fields that exist only because the task already existed — `id`, `created_at`, `pinned`, `task_state`, `closed_at`, `archived`, `push_count`, `first_due_at`, `spawned_from` — plus `recurrence` and the three alarm fields, which no typed line asks for and the engine writes empty on every capture.

**`now` is an input, not a clock the engine reads.** It is handed in on every call. That is what makes the resolver testable: Stage 4's golden cases pin `now` and the output is then a pure function of the inputs.

---

# 2. Working values

Computed in between. **None of these is saved.** A stored copy of any of them goes stale silently.

| Name | Type | Unit | Range / legal values | Example | Computed from |
|---|---|---|---|---|---|
| `resolved_window` | object | — | `{start, end}`, half-open `[start, end)` | `Sat 8 Aug 09:00` | `date_precision`, `window_bounds`, `time_bands`, `day_start_anchor` |
| `clipped_window` | object | — | `{max(start, now), end}`. Undefined if `start >= end`; the passed-window rule rolls first. | `10:40–12:00` | `resolved_window`, `now` |
| `compare_key` | text | — | `normalised` with every purely numeric token removed | `file form` | `normalised` |
| `similarity` | decimal | ratio | 0 to 1. `max(trigram, word_match)` over two `compare_key`s, both Sørensen–Dice. | `0.85` | two `compare_key`s |
| `numeric_variant` | true/false | — | `compare_key`s equal and `normalised` differ | `true` | `compare_key`, `normalised` |
| `due_phrase` | text | — | The lead clause of `card_reason`, rendered at the finest granularity available. Goes stale at midnight. | `Due this morning` | `due_at`, `date_precision`, `has_time`, `now` |
| `due_phrase_short` | text | — | `due_phrase` with the leading `Due` lowercased and day names cut to three letters. Day names keep their capital. Used by `result_row`. | `due Wed` | `due_phrase` |
| `deadline_band` | one-of-a-fixed-set | — | `overdue` `today` `tomorrow` `this_week` `later` `none`. Read in the user's zone. `today` is the same calendar day, `this_week` runs to the end of Sunday, and anything past Sunday is `later`. | `today` | `due_at`, `now`, `deadline_bands` |
| `is_hard` | true/false | — | | `true` | `date_firmness` |
| `workflow_position` | whole number | — | 0 in Part A | `0` | `workflow_edges`, a Part C structure |
| `alarm_unanswered` | true/false | — | True while `alarm_unanswered_at` is set. The third tier-1 override. | `false` | `alarm_unanswered_at` |
| `rank_key` | list of | — | `ranking.overrides` then the nine `ranking.factors`, in order. Never rendered; it produces the list order and `decided_by`. | — | overrides and factors |
| `decided_by` | text | — | The override or factor separating this task from its neighbour: the row below, or for the last row, the row above. Never empty in a list of two or more. | `is_hard` | `rank_key` of two adjacent tasks |

**`numeric_variant` is why `file form 8` and `file form 9` do not interrupt each other.** Both reduce to `file form`, so `similarity` is 1.00, the highest possible. Stripping the digits cannot suppress the dialog by itself; it has to be a separate test, checked before the score.

**`workflow_edges` is not a Part A item.** It is named here so `workflow_position` has a stated source rather than an invented one, and it arrives with Part C.

**`reminder_fatigue` was a working value and is a stored field now.** It counted notifications Part B had not sent yet, so it was zero in every record and read by nothing. It counts unanswered alarms, which Part A writes, and a count that lives only in memory is gone at the next refresh. Part B's `notification_history` will add to it and does not own it. Named here because this is where it used to be.

---

# 3. Outputs — saved

## 3a. `Task`

37 fields. `From` names the Input or the rule the value traces to, carrying `spec/example.md` §3's origin column across.

Timestamps are ISO 8601 local with offset, `2026-08-09T04:30:00+05:30`. Comparisons are on the absolute instant, never the local clock reading.

**Instants are stored to the second.** A window is half-open and its end is exclusive, so the last instant inside a window ending at 24:00 is `23:59:59`. That is what an `end` anchor resolves to, and it is one storage unit below the bound rather than a third way of writing midnight.

### Identity and text

| Name | Type | Required | Unit | Range | Example | From |
|---|---|---|---|---|---|---|
| `id` | text | yes | — | UUID v7 | `019876e2-…` | `new_id` |
| `raw_text` | text | yes | characters | 1 to `limits.raw_text_chars`. Never truncated. | `Call markan morning` | `typed_line` |
| `chip_spans` | list of | yes | characters | the ranges of `raw_text` a chip typed. Empty when nothing was tapped. | `[{start: 21, end: 35}]` | `chip_spans` |
| `title` | text | yes | — | `raw_text` minus the date span **found in `raw_text`** (nothing to subtract when the date came from a chip), minus every `strong` marker, and minus a `weak`, `start` or `point` marker when a date span was removed. Full `raw_text` if the result would be empty. | `Call markan` | Rule |
| `normalised` | text | yes | — | `raw_text` minus every structured span, lowercased, punctuation stripped, runs of whitespace collapsed to one space, then trimmed. Full normalised `raw_text` if the result would be empty. | `call markan` | Rule |
| `notes` | text | optional | — | 0 to `limits.notes_chars`. Empty means none. | *(empty)* | `notes_text` |

### Classification

| Name | Type | Required | Unit | Range | Example | From |
|---|---|---|---|---|---|---|
| `verb_phrase` | text | optional | — | The matched span verbatim. Empty means no token matched. | `Call` | `typed_line` |
| `action_verb` | one-of-a-fixed-set | yes | — | an `action_verbs` member, or `other`. Never `undetermined`. | `call` | `verb_lexicon` |
| `commitment_type` | one-of-a-fixed-set | yes | — | a `commitment_types` member. No `other`. | `action` | `verb_to_type`, or `type_chip_tap` |
| `type_source` | one-of-a-fixed-set | yes | — | `derived` `user` | `derived` | Rule |
| `context` | one-of-a-fixed-set | yes | — | a `contexts` member, or `undetermined` | `phone` | `verb_to_context` |
| `significance` | whole number | yes | points | 0 to 100. Buttons emit 10, 30, 70. Default 30. | `70` | `significance_tap` |

### Date

| Name | Type | Required | Unit | Range | Example | From |
|---|---|---|---|---|---|---|
| `date_phrase` | text | optional | — | The date span found in `typed_line`. Empty means no date. | `morning` | `typed_line` |
| `date_spans` | list of | yes | characters | Where the expression's words sit in `raw_text`, merged where they touch. Empty when there is no date. | `[{start: 21, end: 35}]` | `typed_line` |
| `date_hedge` | text | optional | — | Typed span. Empty means none. | `maybe` | `hedge_words` |
| `date_marker` | text | optional | — | Typed span. Empty means none. | `deadline` | `marker_words` |
| `date_precision` | one-of-a-fixed-set | yes | — | `time` `band` `day` `span` `week` `month` `open` `none` `undetermined` | `band` | `date_lexicon` |
| `date_firmness` | one-of-a-fixed-set | yes | — | `hard` `normal` `soft` | `normal` | Rule |
| `date_anchor` | one-of-a-fixed-set | yes | — | `none` `end` `start` `point` `window`, first match in that order | `window` | Rule |
| `earliest_start` | date-and-time | optional | — | Empty means unconstrained. | `2026-08-03T09:00:00+05:30` | `resolved_window` |
| `due_at` | date-and-time | optional | — | Empty means no deadline; routes to Ideas. | `2026-08-03T11:20:00+05:30` | `clipped_window` |
| `has_time` | true/false | yes | — | | `false` | Rule |

### Duration

| Name | Type | Required | Unit | Range | Example | From |
|---|---|---|---|---|---|---|
| `est_duration_min` | whole number | yes | minutes | `limits.duration_min` to `limits.duration_max` | `15` | `duration_defaults` |
| `duration_source` | one-of-a-fixed-set | yes | — | `default` `selected` `learned` `summed` | `default` | Rule, or `duration_tap` |

### Deferred to later parts

Typed now so the record shape is fixed, as Part 3 Stage 2 requires. Part A writes only the stated value.

| Name | Type | Required | Unit | Range | Part A writes | Part |
|---|---|---|---|---|---|---|
| `recurrence` | object | optional | — | `{every, unit}` with `unit` one of `day` `week` `month`. Empty when the task does not repeat. | *(none)* | the advanced panel |
| `alarm_type` | one-of-a-fixed-set | yes | — | an `alarm_types` member. `none` on capture. Set only while `has_time`. | `none` | the advanced panel |
| `alarm_lead_min` | whole number | optional | minutes | Before `due_at`, up to `alarm_defaults.max_lead_min`. Empty when `alarm_type` is `none`. | *(none)* | the advanced panel |
| `alarm_snoozed_until` | instant | optional | — | When it rings instead of `alarm_at`. Empty until a snooze. May sit past `due_at`. | *(none)* | the alarm shell |
| `alarm_unanswered_at` | instant | optional | — | When an alarm rang its whole chain out with nothing pressed. Cleared by a push, a Done, or an edit that moves the date. | *(none)* | the alarm shell |
| `reminder_fatigue` | whole number | yes | — | How many alarms on this task have gone unanswered. Never cleared. | `0` | the alarm shell |
| `blocked` | true/false | yes | — | Always `false` in Part A | `false` | C |
| `blocker_reason` | one-of-a-fixed-set | yes | — | `none` in Part A; Part C widens | `none` | C |
| `blocker_ref` | text | optional | — | UUID of another task. Always empty in Part A. | *(none)* | C |
| `project_id` | text | optional | — | UUID. Always empty in Part A. | *(none)* | C |

### State and lifecycle

| Name | Type | Required | Unit | Range | Example | From |
|---|---|---|---|---|---|---|
| `task_state` | one-of-a-fixed-set | yes | — | `ready` `done` `cancelled` | `ready` | `row_action` |
| `archived` | true/false | yes | — | Independent of `task_state` | `false` | `row_action` `archive` |
| `pinned` | true/false | yes | — | Overrides all ten ranking factors | `false` | `row_action` `pin` |
| `config_version` | text | yes | — | `<letter>.<integer>` | `a.1` | `config` |
| `created_at` | date-and-time | yes | — | | `2026-08-03T10:40:00+05:30` | `now` |
| `updated_at` | date-and-time | yes | — | Moves on every change, including Done | `2026-08-03T10:40:00+05:30` | `now` |
| `closed_at` | date-and-time | optional | — | Empty means not terminal. Set when `task_state` becomes `done` or `cancelled`. | *(none)* | `now` |
| `push_count` | whole number | yes | times | How many times the task has been pushed. Zero on capture. | `0` | `row_action` `push` |
| `first_due_at` | date-and-time | optional | — | Where it was first due, before any push. Empty until the first one. | *(none)* | `row_action` `push` |
| `spawned_from` | text | optional | — | The completion that produced this occurrence. Empty on a task nobody repeated into. | *(none)* | `row_action` `done` |

### Values with no instance in the example

Part 4 forbids an unused contract item without a written reason. These are reachable and unexercised, marked the way `duration_source = selected` already is.

| Value | Why no instance |
|---|---|
| `type_source = user` | The type chip is shown in §2 and never tapped |
| `pinned = true` | Pinning is an action in §6, not taken |
| `archived = true` | Archiving is an action in §6, not taken |
| `task_state = done` / `cancelled`, with `closed_at` set | Both actions are in §6, neither taken |
| `duration_source = selected` | The control exists on screen 2 and the example predates it, so nothing in the example taps it |
| `type_chip_tap` | The chip is shown in §2 and never tapped |
| `row_action` `done` `cancel` `archive` `pin` `undo` | The buttons are shown in §2 and §6; none of these five is pressed. `edit` **is** exercised in §6. |
| `row_action` `delete` `push` `undone` | All three arrived with the MVP screens and none is drawn in the example, which predates them |
| `recurrence`, `spawned_from` | Nothing in the example repeats; the advanced panel arrived after it was written |
| `duration_tap`, `firmness_tap`, `notes_text` | All three are set in the advanced panel, which arrived after the example was written. Every one of them is a Stage 4 golden case instead |
| `notes` with any text | The panel is the only way in and the example draws no panel |
| `push_options` | Nothing in the example is pushed; the example predates the control |
| `first_due_at` | Set by the first push, and nothing in the example is pushed |
| `duration_source = learned` | `learning.min_samples` is 5 and no verb has reached it |
| `date_precision = open` | `someday` sits in `date_lexicon`; no capture uses it |
| `ranking.mode = weighted` | Only `lexicographic` exists today |
| `decided_by = pinned` | Nothing is pinned in this session |
| `card_reason` with both trailing clauses | No capture is both `is_hard` and high significance |
| `limits.raw_text_chars` at 280 | No capture approaches it |
| `limits.duration_min` / `duration_max` | No capture approaches either |
| `significance` outside 10, 30, 70 | Only the three buttons emit |

All are Stage 4 golden cases.

## 3b. `UndoEntry`

Single level. A row rather than a variable, so a stack is a limit change rather than a rewrite.

| Name | Type | Required | Unit | Range | Example |
|---|---|---|---|---|---|
| `action` | one-of-a-fixed-set | yes | — | the `row_action` set, plus `create` | `create` |
| `task_id` | text | yes | — | UUID v7 of the affected task | `019876e2-…` |
| `prior_state` | object | optional | — | The complete `Task` before the action. Empty when the action was `create`. | *(none)* |
| `created_at` | date-and-time | yes | — | | `2026-08-03T10:40:00+05:30` |

**`prior_state` is a whole record, not a diff.** An undo restores the previous `updated_at` along with everything else, and nothing but a full copy can do that. One entry exists at a time; the next undoable action supersedes it.

---

# 4. Outputs — shown

Every rendered string, with its template. Part 4 applies here too: these spellings are the ones used.

| Name | Type | Template | Example |
|---|---|---|---|
| `cards` | list of | one card per ranked task | — |
| `card_id` | text | the task's own id, so a row can be tapped, pushed or marked done without being matched by its title | `019876e2-…` |
| `card_title` | text | `title` | `Social alpha application` |
| `card_reason` | text | `due_phrase`, plus `reason_clauses` trailing templates for `decided_by`. Both render when both apply, in tier then factor order. | `Due today. You called this a deadline.` |
| `ideas` | list of | the Ideas list, one card per dateless open task, shortest first | — |
| `results` | list of | one entry per search group | — |
| `rows` | list of | the matches inside one group, best tier first | — |
| `task_id` | text | the matched task's id, so tapping a row binds it | `019876e2-…` |
| `title` | text | the matched task's `title`, drawn beside `result_row` | `Call kushan` |
| `result_row` | text | `due_phrase_short`, and nothing else. The title sits beside it and is the task's own | `due Wed` |
| `card_reason_short` | text | the same sentence for a small screen: no trailing clause, and an overdue lead collapsed to `Overdue` | `Due today.` |
| `card_band` | one-of-a-fixed-set | `Today` `Tomorrow` `Upcoming` `Ideas` `Done`, which tab holds the row | — |
| `done` | list of | the Done tab, title only, most recently finished first | — |
| `push_options` | list of | the push targets for this row, empty for a dateless task | — |
| `push_label` | text | the target's name at the precision the task was given. `Next week` · `+2 weeks` · `Later today` | — |
| `push_to` | date-and-time | where the push would move `due_at` | — |
| `group_header` | one-of-a-fixed-set | `ACTIVE` `IDEAS` `DONE`, with `(none)` when empty | `IDEAS      (none)` |
| `sort_header` | text | `Sort:  [<current> ▾]   <alternative>` | `Sort:  [Duration ▾]   Newest` |
| `chip_row` | list of | the parsed-date chip if any, then `chip_presets` | `[✓ this morning][This afternoon]` |
| `undo_toast` | text | `Added "<title>" · <date_phrase>` with `[Undo]`, held `config.undo_ui_timeout_sec` | `Added "Call markan" · this morning` |
| `alarm_at` | date-and-time | `due_at` less the lead. Derived, never stored | — |
| `alarm_ring_at` | date-and-time | What the shell arms: `alarm_snoozed_until` while that is ahead of `now`, otherwise `alarm_at` | — |
| `alarm_armed_for` | date-and-time | The derived instant the shell armed against, so a diff can tell a snoozed alarm from a stale one. Equal to `alarm_at` | — |
| `alarm_title` | text | `title` | — |
| `alarm_reason` | text | `card_reason_short`, because a notification is the smallest screen there is | — |
| `alarm_actions` | list of | `[Done]`, one `[Snooze <n>m]` per `alarm_snooze_options` member, then one per push target | — |
| `alarm_push_targets` | list of | `PushOption`s, computed when the alarm is ARMED. Empty draws no push row rather than an invented date | — |
| `alarm_ring_sec` | whole number | `alarm_defaults.ring_sec`, carried so the shell states no policy of its own | seconds |
| `alarm_auto_snooze_min` | whole number | `alarm_defaults.auto_snooze_min` | minutes |
| `alarm_auto_max` | whole number | `alarm_defaults.auto_max`. At the last one the chain stops and the task escalates | — |
| `clash_dialog` | text | `"<title>" [and <n> others] is at <time>.` with `[Add anyway] [Cancel]`. Absent when nothing overlaps. | — |
| `deadline_dialog` | text | `"<title>" [and <n> others] is also due <day>.` with `[Add anyway] [Cancel]`. Fires when this task and a stored one are both `date_firmness` `hard` and fall on the same local calendar day; times are not read. Absent otherwise. | — |
| `duplicate_dialog` | text | `"<title>" already exists, <due_phrase_short>.` with `[Add anyway] [Cancel]`. The clause is dropped when the open task has no due date. Shown only when steps 2 and 3 both pass. | `"check sensor" already exists, due today.` |
| `list_header` | one-of-a-fixed-set | `Default` for tasks carrying any resolved date, `due_at` or `earliest_start`; `Ideas` for tasks carrying neither | `Default` |
| `add_button` | text | `Edit` when `bound_task_id` is present, `Add` when empty | `Add` |
| `input_field` | one-of-a-fixed-set | `bound` when `bound_task_id` is present, `unbound` when empty | `unbound` |
| `significance_row` | list of | `significance_buttons` labels, current one emphasised | `[Low][**Normal**][High]` |
| `type_chip` | text | `commitment_type` with a change affordance. Absent when there is no text. | `⟨action ▾⟩` |
| `bound_task_chip` | text | `⟨ <title> ✕ ⟩` when `bound_task_id` is present, absent when empty | `⟨ Reply to bharti singhal ✕ ⟩` |
| `action_row` | list of | the labels for `row_action` `done` `cancel` `archive`, shown beside `bound_task_chip` | `[Done] [Cancel] [Archive]` |

**`add_button`, `input_field` and `bound_task_chip` are all functions of `bound_task_id`.** They cannot disagree, which is why they are three views of one input rather than three independent outputs.

**`due_phrase` renders at the finest granularity that is true.** A stated time is the finest, then the way the day was described, then the band. The full set:

| The task | The card reads |
|---|---|
| no due date | empty |
| overdue inside the last week | `Overdue since Friday` |
| overdue longer ago | `Overdue since 20 Jul` |
| due today with a stated time | `Due at 5pm` |
| due today, a band was typed | `Due this morning`, `Due tonight` |
| due today, no band | `Due today` |
| due tomorrow | `Due tomorrow` |
| due later this week | `Due Friday` |
| due after this week | `Due 20 Aug` |
| a span wider than a day was typed | `Due this weekend`, `Due next week`, `Due next month` |
| a length of time was typed, inside twelve hours and the same day | `Due in 30 mins`, `Due in 2 hours` |
| any of the last four with a stated time | `Due Friday at 5pm` |

**A length of time answers in a length of time.** `in 30 mins` reads `Due in 30 mins`, not `Due at 11:10am`. Someone thinking in lengths is not thinking in clock time, and converting for them is work the card can do and should not. It holds while the answer stays a length: the same day and inside twelve hours. Past that the clock is plainer, so `in 20 hours` reads `Due tomorrow at 6:40am`. A hedge adds nothing here, because `Due around in 30 mins` is not English.

**A task with a start and no due date says when it can begin.** `From Friday`, `From 5pm`, `From tomorrow`, `From 20 Aug`. `Due` would be a lie there, and silence is what the card said before this rule: a title with nothing under it. The forms mirror the due ones exactly so the two cannot drift apart in wording, and a time today says only the time, because `From today at 5pm` is longer and says no more.

**A start whose time has already gone does not roll.** `after 5pm` typed at six means today. The person is saying when they can begin and they can already begin, so moving it to tomorrow takes away a task they could do now. A due date is the opposite: `at 5pm` typed at six is tomorrow, because a due date in the past is a task born late. The two are the same words with different anchors and they resolve to different days on purpose.

**A span wider than a day says the span, not a date inside it.** `next month` resolves to an instant so the task can be ranked, and printing that instant reads `Due 16 Sep` for a line whose owner said `next month`, which claims a precision they never gave. The record keeps the instant and the card keeps the words. This is the same rule as the one above read from the other end: the finest granularity that is **true**, not the finest one available.

**A time on another day still carries the day.** The first version of this rule put a stated time above everything, so `friday 5pm` read `Due at 5pm` on a Monday and lost four days. A stated time is the finest thing said about the hour, not about the date.

**`tonight` already carries its day.** `Due this tonight` was what the band rule produced before this was written down. A band word beginning `to` takes no `this`.

**A soft date reads `Due around Friday`.** The hedge shows where the date shows, and `around` is the whole of it. It applies where the phrase names a point: a day, a date or a time. `Due around today` and `Due around this morning` say less than the plain forms, so a hedge on those has no screen trace and lives only in `date_hedge`.

**Clause joining is part of the template, not a separate rule.** Each trailing clause carries its own joiner, because they are not the same grammatical shape: `is_hard` contributes a sentence and joins with `". "`, `significance` contributes a clause and joins with `", and "`. The whole sentence ends with `"."`. Both together give `Due today. You called this a deadline, and you marked it high.`

**`decided_by` names the test that separated this task from its neighbour** — the one below it, or for the last row, the one above. Every row therefore carries one, including the last.

**`card_reason` needs the ranked list, not one record.** `decided_by` compares a task against the one below it, so the sentence is a property of a position rather than of a task. Stage 4's cases for it are list-shaped.

**Part A has two lists.** `Default` holds every task carrying a date, ranked. `Ideas` holds every task carrying none, sorted by duration. A date means `due_at` or `earliest_start`: `after friday` is a task with a day attached, and a person who typed one is not filing an idea. There are no tabs: a control the example draws and no rule fills is a value with no origin.

**The `Default` list is unfiltered.** Every dated task appears, so a hard deadline four months out sits near the top. Filtering by what is actionable today arrives with Part C, and until it does the ranking is the only thing shaping the list.

**Ordering runs in three tiers, and a tier is reached only when the one above it ties.** Tier 1 is `pinned`, then `is_hard`, then `alarm_unanswered`, true before false, and no score beats any of them under any mode. `alarm_unanswered` sits third because a soft task with a missed alarm must not jump a hard task without one: the alarm says the interrupt failed, and the firmness says what the task is. Tier 2 is the mode: `lexicographic` runs tier 3 in order and the first factor separating two tasks decides. Tier 3 is the nine factors, in this order and these directions: `deadline_band` by `deadline_bands`; `significance` descending; `date_firmness` by `firmness_order`, where `hard` sits last because tier 1 has already separated it; `date_precision` by `precision_order`; `commitment_type` by `type_order`; `est_duration_min` ascending, because a shorter thing fits first; `workflow_position`, zero until Part C fills it; `reminder_fatigue` **descending**, so a task whose alarms have been missed before sorts above one whose have not, and it is a weak signal here on purpose because tier 1 has already lifted the task whose marker is still live; then `updated_at` descending as the final tie-break, on the absolute instant so two offsets order correctly against each other. A value a list does not hold sorts last: unknown is not urgent.

**`deadline_band` is recomputed when a stored task is ranked.** It is a working value rather than a stored field, so a task read back out of storage carries none, and reading the absent one would put every task in the same band the first time the page was refreshed. It comes from `due_at`, which is stored.

**A trailing clause has to be true of the task that carries it.** `decided_by` names the term that separated a row from its neighbour, and only three of the eleven have a sentence written for them. A row separated by `significance` says nothing when its significance is the default: `you marked it Normal` is a claim nobody made. The other terms decide the order and stay silent.

**The screen toggles between the two lists, and both come back on every call.** Deciding which one to draw with an input would have made the engine answer a question about the screen. Before the toggle the screen drew Default alone, so a dateless task was created and then made invisible: ten of the twelve real-backlog lines in the answer key carry no date.

**Ideas is sorted, not ranked.** Every ranking factor above `est_duration_min` reads a date, so on a list where no task has one the first six tie on every row and the order falls out of the tie-break. Duration is the only term that says anything there, shortest first, with creation order breaking a tie. That is why the header offers Duration as a choice rather than a rank.

**A stated year is taken as stated, past or future.** `20 Aug 2027` is 2027 and `20 Aug 2025` is 2025. A four-digit number directly after a calendar date belongs to the expression and leaves `title` with it; without that rule the year was stranded in the title and the date resolved to the current one. `Pick date` writes a year exactly when the date it picked is not in the current year, which is the shape this rule exists to read.

**`date_spans` says where the date is, and the screen is what needs it.** `date_phrase` reports what was read and never where, so the parsed-date chip could show `\u2713 this morning` with no way to take those words back out of the box when it was tapped. Offsets are found by walking the line rather than by adding word lengths, because internal spacing survives into `title` and two spaces would shift every offset after them. Words that touch merge into one range, so `20 Aug 2027` is one thing to delete rather than three.

**Factor 5 orders by how much of the task is yours to do right now.** `appointment` first, because someone else is already there; then `deadline`, though tier 1 has usually taken the hard ones before this factor runs; then the things you do, then the things with no next step. `waiting` sits below `information` because nothing on it is yours, and `maintenance` above `habit` because an obligation beats a choice. Like `duplicate.threshold`, the order is fitted to nothing and the key does not pin it: a week of real captures is the evidence that would correct it.

**A small screen says less, and `card_reason_short` is what it says.** The trailing clauses go: `You called this a deadline`, `you marked it high`, `You pinned this` are all reasons for a position that the position already shows. An overdue lead collapses to `Overdue`, because `Overdue since Wednesday` names a day that no longer helps and `Due Wednesday` on a task four days late would be a lie. The plain due forms stay whole, and so does the hedge: `around` changes what the date means rather than decorating it. The web app draws `card_reason` and the mobile app draws `card_reason_short`, and both come back on every call, because which screen is asking is the screen's question.

**`Pick date` and `Pick time` are two buttons, and both type what they pick.** A date arrives one way, through the words in the box, which is the rule every chip already obeys. The picker writes `20 Aug`, adds a year when the date is not in the current one, and the time button writes `5pm` beside it. `Park` is gone: it had no rule behind it and a button that does nothing is worse than a button that is missing.

**An instant is stored twice: as a moment and as the offset it was written at.** Comparisons run on the absolute instant, which is what a `timestamptz` holds. But `deadline_band` reads the same calendar day *in the user's zone*, and a column that normalises to UTC hands back a reading whose day boundary has moved. The offset column is what makes the record say again what the person meant. Splitting on write and rejoining on read happens in the store and nowhere else, so no caller sees a half-translated record.

**A row belongs to one account and nothing is shared.** Row-level security is on, with a policy per verb rather than one for all, so widening read access later cannot widen write access by accident.

**The config in force is stored the first time it is used.** A record stamps `config_version` so it can say which config produced it, and until the config was stored that stamp pointed at something living only in the app bundle: a row saying `a.13` could not be checked against anything once a.14 shipped. It is evidence now rather than decoration.

**The cross-field invariants are constraints as well as rules.** `closed_at` present exactly when the state is terminal, significance in range, duration positive. The engine rejects a record that breaks one; the table refuses to hold it too, because a client is one bug away from writing what the engine would not.

**There are two collision checks and they have different shapes.** `clash_dialog` reads occupied slots: both tasks name a time and their windows overlap, and only a `point` anchor occupies anything. `deadline_dialog` reads promised days: both tasks are `hard` and land on the same local calendar day, whether or not either one names an hour. A deadline is not a booking — an `end` anchor is 23:59:59 — so the first check can never see one, which is why the second is a separate rule rather than a widening of the first. Two things promised by Friday collide; two things merely planned for Friday do not, or the warning would fire on an ordinary Tuesday. Both are asked in the one dialog, on Add, on save and on a push, never while typing. Neither can say whether the day will hold the work: that is a sum of `est_duration_min`, which is a per-verb default the reader never sees.

**The lead is read three ways, in order: `alarm_lead_min`, then `alarm_lead_by_type`, then `alarm_defaults.lead_min`.** The per-type table exists and every entry in it is the same number, deliberately. The shape is what is being put in place, so that a correction later is a number change rather than a structural one, and no guess is recorded as if it were evidence. **While every value is equal the table changes no behaviour**, which is the honest state of it and is why it is said here rather than left to be discovered.

**What would pull the numbers apart, when there is anything to pull them apart with.** An appointment's lead is about getting there; a deadline's is about having time to do the thing. A deadline told with less warning than the job takes is an announcement rather than a warning, and `est_duration_min` is what would say so. Today's default is fifteen minutes for everything, which is short for a half-hour job, and the app will not say so, because duration is a quiet field.

**An alarm needs a stated time.** A task due `Friday` resolves to 23:59:59, so a lead from that instant rings at a quarter to midnight, which is not a reminder about Friday. The alternative was a second rule inventing a time of day nobody gave, which is what this project refuses everywhere else. Recorded as a limit rather than worked around.

**An alarm draws the mobile sentence.** A notification is the smallest screen there is: no trailing clause, an overdue lead collapsed to one word, no minutes anywhere. Three actions, and `Push` and `Snooze` are not the same thing — Push moves the task, Snooze moves the telling. `Snooze` carries its own number because it is the one action whose effect cannot otherwise be seen.

**Two timed tasks clash when their windows overlap.** The window is `due_at` to `due_at + est_duration_min`, so the check runs on a per-verb guess rather than a measurement: `call kushan at 5pm` and `meet supplier at 5:15pm` collide only because `call` defaults to fifteen minutes and nobody said so. Only a task anchored at a `point` occupies a slot; an `end` anchor is 23:59:59, a deadline rather than a booking, and reading one as occupied would make every task due today clash with every other. Windows are half-open here as everywhere else, so back to back is not a collision.

**The clash warning names the collision and never the arithmetic.** `"meet supplier" is at 5pm.` No minutes, no overlap length. Duration is the engine's and the reader never sees it, which means the warning cannot state what it was computed from. That is the shape this decision produces and it is recorded rather than hidden.

**All three comparisons run against every stored task EXCEPT the one being edited.** `resolve()` writes `new_id` into the record on every call, an edit included, so the finders' own "not me" test never excluded the record being replaced: saving an edit reported the task as a duplicate of itself, clashing with itself, and sharing its own deadline day. The exclusion is `bound_task_id` and it is applied once, before the three run. The list, the search and Ideas still read the whole set.

**It fires where the duplicate dialog fires: on Add, on save, and on a push.** Never while typing, and never on the list. A push is included because pushing into an occupied slot is the same mistake arriving by a different door.

**An alarm needs a stated time, and the toggle is drawn only when there is one.** A task due "Friday" resolves to 23:59:59, so a lead from that instant rings at a quarter to midnight, which is not a reminder about Friday. The alternative was a second rule inventing a time of day the person never gave. So the row appears with a time and disappears with it: a control that cannot work is not drawn.

**`alarm_type` is `none` or `on`. There is no `repeat`.** Every alarm rings for `ring_sec`, snoozes itself for `auto_snooze_min` and does that up to `auto_max` times, so "ring again every" was a second way of asking for what an alarm already does. A task that should come back another day has `recurrence`.

**The web app still fires nothing, and the Android shell does.** `alarm_at` stays derived and unstored. What the shell arms is `alarm_snoozed_until` when that is still ahead of the clock and `alarm_at` otherwise.

**SNOOZE MOVES THE TELLING, PUSH MOVES THE TASK.** A snooze writes `alarm_snoozed_until` and touches no date. A push writes `due_at` and clears both alarm markers, because it is the later and more considered statement about when to be told.

**Stopping the ringing never depends on an unlock.** Every press stops the noise, cancels or re-arms the alarm and is queued before anything else is attempted. Whatever comes after that is free to fail.

**Done and a push open the app; a snooze does not.** All three are queued in the shell and applied by the app, so the difference is only whether the phone asks to be unlocked. Done and a push change the record and a change nobody can see is a change nobody can trust; a snooze changes nothing about the task. An un-unlocked press is not lost: it lands whenever the app is next opened.

**Both are on the lock screen, and the push targets are computed when the alarm is armed.** Choosing a target reads the day's load off every stored task, which the shell does not have, so the two the row would offer are carried in the payload. They are as old as the gap between arming and ringing, refreshed whenever the app opens and the diff re-reads them. An alarm carrying no targets draws no push row: a button with no target would have to invent a due date, which is the thing refused everywhere else. This reverses the first design, where a push needed an unlock, and the staleness is what was bought.

**A snooze has two homes and they are allowed to disagree.** `alarm_snoozed_until` on the task is the truth and reaches the other devices. The shell keeps its own copy so it can re-ring with the WebView dead, which is the normal case rather than the exception. What keeps them from fighting is `alarm_armed_for`: the shell records the derived instant it armed against, and the app's diff compares that rather than the ring time, so a snoozed alarm and a stale one stop looking alike.

**An unanswered chain escalates the task and does not touch importance.** `alarm_unanswered_at` is the live marker and joins `pinned` and `is_hard` as the third tier-1 override, third so a soft task cannot jump a hard one on the strength of a missed alarm. `reminder_fatigue` is the count and nothing clears it. The same pair as `first_due_at` and `push_count`: one marker that can be cleared, one number that cannot.

**Personal numbers belong to an account, not to config.** `capacity_min_per_day` and `duplicate.threshold` are what a full day feels like and how alike is too alike *to one person*. They stay in config as the default an account starts from, and an account row overrides them. An account with no row uses the default rather than nothing.

**Some fields are collected so the app can suggest better, and are never shown.** `est_duration_min`, `push_count`, `first_due_at` and the day's load built from the first of them. None of them appears on any screen. `est_duration_min` orders Ideas, ranks sixth and measures a day; `push_count` and `first_due_at` say how far a task has already drifted; the load decides which push targets are offered and in what order. The reader sees three labels and no arithmetic.

**A day already over `capacity_min_per_day` is not offered while a lighter one further out is.** That is the whole use of the load: choosing the days, not annotating them. When every day ahead is full they are all offered anyway, because a press with nowhere to land is worse than a press into a busy day.

**Duration is the engine's and not the reader's.** `est_duration_min` decides the Ideas order, the ranking's sixth factor and the load on a day, and it appears on no row. The badge is gone entirely: with the minutes hidden, a verb on its own explained nothing. `result_row` keeps `due_phrase_short` and drops the rest for the same reason.

**Three tabs and one toggle.** `Tasks`, `Ideas` and `Done` are the tabs; inside Tasks, `Today`, `Tomorrow` and `Upcoming`. `card_band` says which holds a row, so the screen never asks the engine which tab it is drawing. Overdue sits in Today: a task three days late is a thing to deal with now, and a fourth place for it means the tab opened first is not the real day. This reverses the Stage 1 rule that Part A has no tab bar, and it reverses cleanly, because the objection then was that a tab nothing fills is a value with no origin. `deadline_band` fills these.

**A Done row is a title.** `Overdue since Friday` on a finished task is a sentence about a deadline that no longer applies, and no other sentence was wanted. Most recently finished first, which is the row being looked for when one was tapped by mistake. `undone` brings it back.

**The list screen's search filters the tab in place.** Same four tiers as the capture screen, exposed through one matcher so the two boxes cannot disagree about what counts as a match. The pool differs: on the capture screen it is open tasks, because a done task is not a duplicate risk, and on the Done tab it is done ones, because finding something finished is why anyone looks there.

**The type chip offers three and hides eleven.** `verb_to_type` maps a verb to exactly one type, so there are no runners-up: the chip shows what the engine derived, marked, beside the three in `type_suggestions`, and the rest sit behind a small button. Alternates guessed from the verb would need a table with no evidence behind it, and a fixed short list is honest where a guessed one would not be.

**The advanced panel holds what a capture rarely needs.** The full type list and `recurrence` today. It is a second surface on the capture screen rather than a second screen, so nothing about the box or the chips changes when it opens.

**A repeat spawns its next occurrence when the current one closes, and only then.** Rolling one record forward was the alternative and it breaks two things: a weekly task done thirty times would show zero times in Done, and `push_count` and `first_due_at` would accumulate across occurrences until the drift they measure meant nothing. Spawning on close rather than on schedule means there is never more than one open occurrence, so three weeks late on a weekly task is one row and not three.

**The next date counts from the schedule and never from when it was done.** Rent due the 1st and paid the 4th is next due the 1st. The schedule is stepped forward from the occurrence just closed until it lands in the future, which keeps the anchor a task with a schedule is about. Stepping from `now` would move that anchor every time the task was done late.

**A push moves one occurrence and leaves the series alone.** One busy month must not shift a monthly reminder permanently.

**`spawned_from` names the completion that produced an occurrence.** Undoing a done has to be able to take back what the done created; without it, pressing Undone leaves two rows, the one that came back and the one that was made.

**A push sets the date and touches no words.** Once a task is added its typed line is gone from the screen: only `title` is drawn, on the list and on the edit screen alike, and `raw_text` is provenance that is kept and never shown. So there are no date words left in view for a push to keep in step with, and the second way a date can arrive that this project has refused twice does not arise.

**Editing a title with no date words in it leaves the date alone.** The date words left the line when the task was created, so re-reading an edited title finds none; clearing the date on that evidence would destroy it on every edit of every task. The edit screen draws the date chip, which is what makes the date visible and is the one control that clears it.

**Push targets come from `date_precision`, and their notes come from load.** A task told at a band is pushed to another band, not to a Tuesday at 09:00, which would claim a precision nobody offered. Each target says what the day it lands on already holds, because pushing into a fuller day is the mistake the control exists to prevent. An overdue task is the exception and pushes to today or tomorrow rather than further out: a task already late is not helped by being later.

**The load is a sum of guesses and says so.** `est_duration_min` is a default per verb, so a day's minutes are eight assumptions added together. The note reads `6 tasks, roughly 4h`, and `full` once the total reaches `capacity_min_per_day`. Significance is not weighted into it: a High task does not take longer, and it already decides who moves, as ranking factor 2.

**`push_count` is the only history the record keeps.** Everything else in a `Task` is a snapshot. A task pushed once met a busy day; a task pushed six times has something wrong with it that a seventh push will not fix, and `first_due_at` is what makes that distance readable.

**An empty list screen shows nothing.** No message, no illustration, no prompt to add the first task. The toggle and the `+` are already on screen and they say what to do; a sentence explaining an empty list is the app talking about itself, which D-1 says the typing is supposed to replace. Same answer as the empty search, arrived at from the other end.

**A search that matches nothing draws nothing.** No panel, no headers. `(none)` was written to stop the panel changing shape under the cursor, which mattered while the box and the list shared a screen. Capture is its own screen, and two headers over no rows is a panel saying no twice.

**`sort_header` is always returned.** It belongs to the Ideas list, and which list is on screen is the screen's question. Computing it from the typed task's `list_header` made it appear and disappear with the line being typed rather than with the toggle.

**Search runs on `normalised`, not on the raw line.** A date word typed into the box is not something to look for, and the string the search starts from is the one the duplicate rule starts from, so one cannot match on a word the other ignores. An empty box is not a search for everything: no query, no panel.

**Four tiers, best first, and a task is placed by the highest it reaches.** Exact, then prefix, then a shared word, then fuzzy above `search.fuzzy_threshold`. Inside a tier the better score wins and the most recently touched breaks a tie. Nothing is capped: a query matching twenty tasks shows twenty, because a cut list hides the one being looked for and says nothing about having cut it.

**The fuzzy tier never fires the duplicate dialog.** It exists for transliterated names, which typo inconsistently, and `bhati` against `bharti` is reachable no other way. Its threshold is looser than `duplicate.threshold` on purpose: a result is not a question, so a false positive costs nothing where a false dialog interrupts.

**Only open tasks are searched.** A done or archived task was put out of the way deliberately and searching it back into view undoes the reason. `DONE` stays in the header vocabulary and draws no rows while that holds. A group with no rows says `(none)` rather than disappearing, so the panel does not change shape under the cursor mid-line.

**`card_reason` is generated, not stored.** It is produced from the ranking term breakdown, which is why the sentence and the sort order can never disagree.

**The toast holds for `config.undo_ui_timeout_sec`; the `UndoEntry` does not expire with it.** The entry survives until superseded and stays reachable through the engine after the button is gone.

---

## What `resolve()` returns

One call, one object, three keys. The wrapper existed in the shell from Stage 3 and had no contract item behind it, which Session 30 found and Stage 4 needed: the answer key targets `Task` fields, and two rendered views cannot answer for them.

- `task` — the saved output, one `Task`. Section 3a.
- `working` — every working value the call computed. Section 2. Not saved, and returned so a case can be pinned to one.
- `list` — the shown outputs belonging to the list. Section 4.
- `capture` — the shown outputs belonging to the capture row. Section 4.

Nothing here is a new field. The keys route values that already have items, which is why this section holds no table: a name that appears only here would be an output with no home in 2, 3a or 4.

---

## Rules the answer key forced

35 rules that the contract implied and never stated. Each was a case in `tests/answer_key.md` carrying a claim rather than a derivation, or a line the engine got wrong the first time it was run. `gate2.py` counts the paragraphs below and fails if this number is not one of them.

Rules about what a rendered string says live with that string, in section 4, not here: `due_phrase` and everything that decides its wording, and the clause templates for `card_reason`. Rules about the duplicate score live under Duplicate detection. This block holds the parsing rules.

**The commas are counted after the date leaves.** `call kushan, tomorrow` is one call, not two: the count runs on `title`, so a date sitting after a comma is never a thing to do. A separator left with nothing to separate goes with the words it was separating, which is why the card does not read `call kushan,`.

**`on` belongs to the expression, as `this` does.** `on Thursday` leaves `title` whole. Neither word changes an anchor and neither is a marker; both point at which day the expression means. Without this the card read `Meet Priya, the new CFO, on`.

**The commas count the items, and the first chunk is always one item.** `Payments to coolindia, sudhi, laptop` has two commas, so it is three payments and sums to 30 minutes. Only the chunks after a comma have to be a single word: the first one carries the verb and whatever the verb needed to reach its first object, and counting its words would mean deciding which of them are glue, which is a category this contract has never needed. `Meet Priya, the new CFO, on Thursday` stays one meeting at 60, because `the new CFO` is three words. The guard still holds: a verb must precede the list, and `and` is not a comma. Fitted, like the duplicate threshold before it.

**A word is looked up four ways, in order, and the model is last.** The lexicon, then `verb_irregulars`, then the spelling rules, then wink-nlp's dictionary form. Last is the whole point: the model can add a word the first three miss and can never change one they reach, so shipping it could not move an answer, and on the day it shipped it moved none. It is 3.6 MB bundled and committed at `shell/lemma.js`, read by the engine in the browser and by the gate in node from the same file.

**A word's ending is spelling, and an irregular form is vocabulary.** `replied` reaches `reply` and `submitting` reaches `submit` by rules in the engine, because those are how English spells things and not something a person configures. `paid`, `sent` and `made` reach theirs through `verb_irregulars`, because no rule reaches them and a list is the only thing that can. The lexicon held 52 tokens for 18 verbs before this, a third of them endings added by hand after someone typed one, which is a list that can never be finished. `verb_phrase` keeps the word as typed whichever form matched.

**A verb can be two words.** `follow up` is looked up before either word alone. One token at a time could not express it, which is why the entry could not exist until now.

**`in 5 mins` and `in 5mins` are the same expression.** The number and the unit are one token or two, and only the two-token form was read. Third time a rule written for one spacing met a person writing another: `5.30pm` and `5 pm` were the first two, and the lesson is that a spacing is not a grammar.

**A weak, start or point marker counts only when the date starts right after it.** `submit by friday` is a deadline; `pay by cheque` is how the payment is made, and both recorded `by` before this. In `pay by cheque friday` the date is Friday, `by` stays in `title`, and nothing is hard. Words the expression carries in front of itself, `next` and `this` and `on`, are part of the date, so `by next friday` counts. A strong marker is exempt and has to be: `GST filing deadline` carries no date and is still hard.

**Adjacency decides between two markers, not order.** Two of them can never both touch the date, so the first-typed rule has nothing left to decide for markers. It still decides between two dates.

**The lexicon matches one token at a time.** Every token of `raw_text`, lowercased and stripped of punctuation, is looked up in `verb_lexicon` in the order it was typed, and the first match wins. There is no grammar, no word order and no language: `demo trial date finalize` matches on its last token and `Ghar kharch hisab` matches on none, giving `other`. `verb_phrase` stores the matched token exactly as typed.

**The anchor comes from the marker when there is one, and from the expression when there is not.** `by` gives `end`, `after` gives `start`, and a resolved time of day with no marker gives `point`. A window expression with no marker gives `window`. This replaces the earlier rule that `at` was what produced `point`: `friday 5pm` carries no marker and still names one instant, and a word the user did not type cannot be what makes the anchor. `at` stays in `marker_words` in the `point` group, because a marker is what leaves `title` with its date, and without it `call kushan at 5pm` would draw as `call kushan at`.

**The record keeps where a chip's words sit, and reads nothing from them.** `chip_spans` is a list of character ranges in `raw_text`, handed in and stored unread. A date still arrives one way, through the words, which is the rule below and is not weakened by recording how they got there: the engine derives nothing from the ranges and would behave identically without them.

The ranges are what a later question needs. Someone taps `This afternoon`, sees what it gave them and edits the words: that is the screen's strongest signal that a chip said the wrong thing, and it cannot be read from a line that no longer remembers which words were tapped. The screen keeps the ranges as the line is edited, which is the screen's job because only it saw the edits. A range that no longer covers what was tapped is the answer to the question, not a defect in it.

**A date chip appends its label to the text box, and the engine never sees a chip.** Tapping `This afternoon` types those words for you. There is no chip input: nine inputs reach `resolve()` and none of them is a tap on a date. This keeps the number of ways a date can arrive at one, which is the thing the engine reads and the thing the user can edit afterwards, and it means a new chip is a screen change rather than an engine change. `Pick date` and `Park` produce no words and are deferred: neither has a rule yet.

**A tapped date beats a typed one, and the screen clears the chip when the line is edited after.** Type `friday`, tap `This afternoon`, and the afternoon wins: a tap is nearly always the correction. The engine reads a finished line and cannot know the order of events, so the two rules together are what "the later one wins" means. A chip span exists only when the tap was the last thing that happened, and clearing it on the next edit is the screen's, listed with Gate 6.

**A chip tap replaces the previous chip's words rather than adding to them.** A chip is a control, not typing. Two taps leave one chip span and one set of words; appending would put two dates in the line and the second tap would do nothing visible. The screen holds this, because it is the only thing that knows a tap happened.

**The first date typed wins, and every date expression leaves `title`.** `tomorrow friday` is tomorrow and `friday tomorrow` is Friday. A longer phrase beats a shorter one starting in the same place, so `next week` still beats `week`. The loser leaves the title with the winner: a second expression is the person correcting themselves, and leaving it behind puts a date on the card that the record does not hold.

**The first marker typed wins, and every marker leaves `title`.** `by after friday` is a cut-off. Both markers were relating the same date, so one left behind is a stranded preposition. Until version 25 the longest word won either contest, which meant reversing the words changed nothing and the engine was reading no order at all.

**A bare clock time that has already gone means the next one.** `at 10AM` typed at 10:40 is tomorrow at ten, as an ended band is tomorrow's band. Only a bare time moves: `1 aug at 5pm` names a day, and a day the person named is never moved, so it stays overdue.

**Shorthand is config, and expands before anything is looked up.** `date_aliases` maps what a person types to the word it stands for: `tmrw` to `tomorrow`, `fri` to `friday`. The typed word is what `date_phrase` reports and what leaves `title`, so nothing about the record says which spelling was used. Shorthand differs by person and by language, which is why it is a table rather than a rule.

**A clock time is written more than one way.** The minute separator can be a colon, a dot or nothing, and the meridiem can be its own word: `5pm`, `5:30pm`, `5.30pm`, `17:00`, `5 pm`. A bare number with neither a separator nor a meridiem is not a time, which is what keeps `file form 8` and `check pump 4` from acquiring one.

**`next` picks which day, as `this` and `on` do.** `next friday` is the Friday after the coming one. None of the three changes an anchor, so all three belong to the expression and leave `title` with the day they govern; without that the card read `call kushan next`.

**Trailing punctuation is not part of an expression.** `pay a tomorrow, b` has its date between two items, and the comma separating them is not the date's. What the title drops is the words; punctuation beside them stays, and the item count still reads two.

**A date word is config; a date number is code.** `date_lexicon` holds every word that names a time: the bands, the relative days including `yesterday`, the seven weekdays, the spans. A calendar date and a clock time are read by the engine instead, because `20 aug`, `1/8`, `5pm` and `17:00` are patterns over numbers and there is no list to write. The line falls where translation falls: a Gujarati user needs their own word for Friday and needs nothing new for `20`.

**A time beats a day when both are in one line.** `friday 5pm` is `time` precision, not `day`: the day supplies the date and the time supplies the instant, so `due_at` is Friday at 17:00 and the day window disappears. The finer expression wins because it is the one the user was more specific about, and the coarser one is already inside it. `this` in `this friday` is not a second expression: it changes no anchor and picks which Friday, so the span carries it.

**A band that has already ended rolls to the same band tomorrow.** The band rule has three arms. Not started, and the window stands. Inside, and it clips to `now`. Ended, and `morning` typed at 14:00 resolves to tomorrow's `[09:00, 12:00)`, midpoint 10:30. Nobody types a time of day that has gone meaning the one that has gone, and resolving it in the past creates a task that is overdue the instant it is typed. Only bands roll; a named day in the past does not, because the user named that day.

**`in` makes a duration into a time.** `call kushan in 30 mins` is due at 11:10 when `now` is 10:40: `date_precision` is `time`, `date_anchor` is `point`, and the same holds for hours. `in` belongs to the expression rather than to `marker_words`, the way `this` does in `this friday`, because it is the whole of what turns a length into an instant and it changes no anchor of its own. Without it, `call kushan 30 min` is a duration and the next rule holds.

**A band and a clock time in one line contradict each other, and the time wins.** 14:00 is not the morning. The band supplies no date and the instant is today at the time typed, which is the same precedence a day and a time already follow. Both words stay in `date_phrase`, so both leave `title` together and the card does not read `call kushan morning`.

**A band that rolled offers the day it came from.** `morning` typed at 14:00 resolves to tomorrow, and the screen shows a chip offering today instead. The task is captured and dated either way: a dialog that stops the capture to ask a question is the one thing D-1 forbids, and a rolled band is a guess the user should be able to see and reverse in one tap. The chip is a Gate 6 obligation, listed with the rest of the screen.

**A duration typed into the line is not read.** `call kushan 30 min` keeps the default 15 for `call`, and `30 min` stays in `title` and in `raw_text` like any other words. `duration_source` has four members and none of them means *the user wrote it*, and adding a fifth to serve a parser that does not exist yet is a config member that can never be removed. The words are kept, so nothing the user typed is lost and the rule can be written later against real captures.

**A start marker with no date sets no bound.** `after audit` has `date_precision` `none`, so row 1 of the anchor order fires and `date_anchor` is `none`, not `start`. `earliest_start` stays empty and `date_marker` keeps the word `after`. The constraint is recorded and not acted on. A blocker field in Part C is what would act on it.

**`due_phrase` carries the hedge.** A soft date reads `Due around Tuesday` where a normal one reads `Due Tuesday`. This is the only place `soft` reaches a screen in Part A, and it is where it belongs: the hedge is about the date, so it sits with the date rather than becoming a mark of its own or a clause in `card_reason`, which explains why a card sits where it sits and would then be explaining something else. Rendering a hedge is not acting on one: rolling a soft date forward quietly is still Part B's, and nothing here does it.

**`soft` acts nowhere in Part A.** `hard` reaches a screen through `is_hard`, which contributes a `card_reason` clause when it decides a row's position. `soft` reaches none, by decision rather than by omission: what a hedge is for is being rolled forward quietly instead of chased, and rolling forward is Part B's job. Part A parses the hedge, stores it in `date_hedge`, sets `date_firmness`, renders it in `due_phrase`, and stops. A field with no output in the part that writes it is a gap only if the part that reads it never arrives.

**A hedge leaves `title`.** `maybe call kushan tomorrow` draws as `call kushan`. The title is the task, not the mood about it: `date_hedge` holds the word, `raw_text` holds the sentence, and neither is lost. This replaces the earlier rule that a hedge stayed in `title` and stripped only from `normalised`, which made the two fields differ for a reason no other pair of fields differed for. A trace of the hedge on screen is owed and not yet placed; until it is, a hedged capture and a plain one draw identically.

**A strong marker always leaves `title`. A weak, start or point marker leaves with the date it governs.** The two groups do different work. A strong word is pure metadata: `deadline` sets `date_firmness` and nothing else, contributes no content, and means nothing at all without a date, which is why `GST filing deadline` routes to Ideas like any other dateless capture. `GST filing` is the task. The other three groups set an anchor, and an anchor needs a date to sit on. When one is there, `by friday` resolves to an instant that `due_phrase` prints, so `by` has nothing left to say and leaving it strands a preposition: `call kushan by`. When no date span was found, no anchor was set and the word is still relating the words around it, so it stays: `call kushan after audit` keeps `after`, because `audit` is still sitting there and dropping the preposition would leave a title that says something else. `raw_text` keeps the typed sentence in every case, so nothing typed is ever lost; `title` is a label.

**Whitespace collapses in `normalised` and nowhere else.** `call    kushan` and `call kushan` are the same task. `title` and `raw_text` keep every character the user typed.

---

# 5. Cross-field invariants

A record can be field-by-field valid and jointly nonsense. These are what stop that.

| # | Invariant |
|---|---|
| 1 | `has_time` is `true` only when `date_precision` is `time` |
| 2 | `date_anchor` is `none` exactly when `date_precision` is `none`, `open` or `undetermined` |
| 3 | `date_anchor` `none` implies `due_at` and `earliest_start` are both empty |
| 4 | `date_anchor` `end` implies `earliest_start` is empty |
| 5 | `date_anchor` `start` implies `due_at` is empty |
| 6 | `earliest_start` <= `due_at` whenever both are present |
| 7 | `closed_at` is present exactly when `task_state` is `done` or `cancelled` |
| 8 | `updated_at` >= `created_at` |
| 9 | `duration_source` is `summed` only when the line was a comma list after a single verb |
| 10 | `verb_phrase` empty implies `action_verb` is `other` |
| 11 | `action_verb` `other` implies `context` is `undetermined` |
| 12 | `date_firmness` is `hard` only when `date_marker` is non-empty |
| 13 | `date_firmness` is `soft` only when `date_hedge` is non-empty |
| 14 | `UndoEntry.prior_state` is empty exactly when `UndoEntry.action` is `create` |

---

# 6. Config

Thirty-six objects. Each holds one thing that grows, so a change touches one object.

**Vocabulary** is the only part records depend on. Every member carries `active`.

| Object | Holds | Members |
|---|---|---|
| `action_verbs` | member list | listed in `config.ts` only; every member reachable from `verb_lexicon` |
| `contexts` | member list | listed in `config.ts` only |
| `commitment_types` | member list | listed in `config.ts` only |

**The contract names the objects; `config.ts` lists their members.** A member list written here is a second spelling of one that already exists, and it went stale the session the lexicon grew. `gate2.py` fails if this table enumerates members that disagree with `config.ts`.

`other` and `undetermined` are fallbacks, not members, and never appear in these lists.

**Lexicon** maps what people write onto members. Grows constantly, and no record depends on it, because `verb_phrase` and `date_phrase` store the words.

| Object | Holds |
|---|---|
| `verb_lexicon` | surface form → `action_verbs` member. Verbs and nouns both. |
| `verb_irregulars` | verb forms no spelling rule reaches, each mapping to a `verb_lexicon` key | — |
| `date_aliases` | shorthand a person types, each mapping to a `date_lexicon` key | — |
| `date_lexicon` | surface form → `date_precision` |
| `marker_words` | `strong` `weak` `start` `point` |
| `hedge_words` | hedges that demote firmness |

**Behaviour** is everything else. No record depends on it, because stored data is never rewritten.

| Object | Holds | Unit |
|---|---|---|
| `verb_to_type` | member → `commitment_types` member | — |
| `verb_to_context` | member → `contexts` member | — |
| `duration_defaults` | member → duration | minutes |
| `day_start_anchor` | `09:00` | local time |
| `time_bands` | morning, afternoon, evening, night | half-open windows |
| `window_bounds` | day, week, span, month | half-open windows |
| `deadline_bands` | the six `deadline_band` values | — |
| `type_suggestions` | the three types the chip offers; the other eleven sit behind the advanced button | — |
| `type_order` | ranking factor 5's order | — |
| `precision_order` | ranking factor 4's order | — |
| `firmness_order` | ranking factor 3's order. `hard` sits last because tier 1 separates it before this factor is reached | — |
| `ranking` | `overrides` `pinned` `is_hard` `alarm_unanswered`; `mode` `lexicographic`; `factors` the nine, in order; `weights` absent while lexicographic | — |
| `reason_clauses` | `lead` templates by time, precision then band; `trailing` templates by `decided_by`, each with its own joiner | — |
| `chip_presets` | the capture chips. Screen vocabulary: the engine reads none of them, and a chip types its label into the box. `Pick date` and `Pick time` open pickers and type what was picked. | — |
| `significance_buttons` | `{10, Low}` `{30, Normal}` `{70, High}` | points |
| `duration_units` | what the chips beside the duration box multiply by: `min` 1, `hour` 60, `day` 1440. Screen vocabulary. A unit is never stored: the box and the chip are read together and one number of minutes is written. | minutes |
| `duration_suggestions` | minutes offered beside the box: 15, 30, 60, 120. Not a vocabulary and no record holds one; tapping one fills the box. | minutes |
| `alarm_snooze_options` | the snooze buttons on a ringing alarm: 5, 10, 30, 60. Pressed when it rings, never chosen in advance. | minutes |
| `limits` | `raw_text_min_chars` 2, `raw_text_chars` 280, `duration_min` 1, `duration_max` 262800, `notes_chars` 2000 | characters, minutes |
| `alarm_types` | `none` `on`. The web app records what was asked for; the Android shell fires it | — |
| `alarm_lead_by_type` | the suggested lead per `commitment_type`. Every value is the same today, deliberately | minutes |
| `alarm_defaults` | `lead_min` 15, `max_lead_min` 10080, `ring_sec` 120, `auto_snooze_min` 5, `auto_max` 5 | minutes, seconds |
| `capacity_min_per_day` | `180`. Fitted to nothing: what a full day feels like, corrected by real use | minutes |
| `search` | `fuzzy_threshold` 0.5. Looser than `duplicate` on purpose: a result is not a question | ratio |
| `duplicate` | `threshold` 0.6, `min_chars` 6 | ratio, characters |
| `undo_ui_timeout_sec` | `8` | seconds |
| `learning` | `min_samples` 5 | samples |

`date_precision`, `date_anchor`, `date_firmness`, `duration_source`, `type_source` and `task_state` are **not** here. Their members are code, so the compiler checks them. Only the three vocabulary objects lose compiler coverage, which is what makes runtime validation of those three load-bearing.

## Duplicate detection

Three steps, in order.

1. `compare_key` for both.
2. If `numeric_variant`, no dialog. The two lines differ only by a number, so they are distinct items.
3. Otherwise the dialog fires when `similarity >= duplicate.threshold` and both `compare_key`s reach `duplicate.min_chars`.

`trigram` is Sørensen–Dice over character trigrams of the `compare_key` as a **multiset**, padded with two leading spaces and one trailing space. Set semantics give 0.73 rather than 0.71 on `gst filing deadline`, which crosses the threshold, so this is load-bearing. `word_match` is Sørensen–Dice over the token **sets**. Spaces are ordinary characters in a trigram, which is why `srilanka hotel booking` and `sri lanka hotel booking` score 0.89 and not 1.00.

`similarity` is `max(trigram, word_match)` **rounded half-up to two decimals, and compared to `threshold` after rounding**. Rounding is load-bearing rather than presentational: `srilanka hotel booking` against `srilanka tickets` is 0.4468, which truncates to 0.44 and rounds to 0.45.

> **This rule is fitted, not derived, and the threshold is not pinned by anything.** The answer key's scores leave a gap between 0.50, the highest that stays quiet, and 0.82, the lowest that fires. Every value in that gap gives every verdict the key states, so 0.6 and 0.8 are indistinguishable against it and the number is a guess inside a range rather than a measured edge. Pinning it needs a pair scoring inside the gap whose right answer is known, and none exists yet. `min_chars` at 6 is inert at any of these values. The first misfire in real use is the evidence that corrects both.

---

# 7. Open, carried into Stage 3

| # | Item |
|---|---|
| 1 | Multi-match precedence when a line holds several lexicon tokens |
| 2 | Quarantine behaviour on an unknown vocabulary member at read time |
| 3 | How `est_duration_min` is suggested beyond `duration_defaults` |
| 4 | The duplicate rule is unvalidated. `a.1` has 2 `contexts` and 7 `action_verbs`, drawn only from what the example exercises. |
| 5 | `date_source` holding `typed` or `chip` would let the reconstruction invariant be stated plainly instead of scoped to typed input. The `title` rule covers the immediate need. |
