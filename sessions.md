# Cascade — session log

Append only. Newest at the bottom.

---

## Session 1 — 1 August 2026

**Job:** Write `spec/example.md`, the Stage 1 finished example for Part A.

**Stage before / after:** 1 / 1

**Files changed:**
- `spec/example.md` — created, then revised to version 4 as decisions landed
- `spec.md` — created
- `sessions.md` — created

**Tests:** none. No code exists and Stage 4 has not been reached.

**Decisions made:** 30, all written to the decision log in `spec.md`. The load-bearing ones: the project splits into Parts A to D and Part A goes first; prior documents are reference only; `date_origin` is replaced by precision, firmness and anchor; input words are stored beside derived levels; ranking is lexicographic over ten factors with `is_hard` above importance; importance is asked at capture as three buttons.

**Found, not fixed:**
- `CASCADE_PART_A_SPEC.md` is stale against the new date fields, the ranking order and the importance decision.
- The 20-slide engine deck is stale on the same points.
- D-21, the stack choice, still open.
- Part B must decide chase behaviour from `date_firmness`, not `deadline_band`, or window-dated tasks pester from their midpoint.

**Save point:** `stage 1: finished example for Part A, plus spec.md and sessions.md`

**Asked for but not done:**
- D-1 in Vishal's own wording. Options proposed, none chosen. Stage 1's deliverable is incomplete without it.
- `schema/contract.md` and `schema/types.ts`. Stage 2, not this session.
- Rewriting `CASCADE_PART_A_SPEC.md`. Stage 2, and it must be rebuilt from the contract rather than treated as one.

**Next job:** Ratify D-1, run the Gate 1 read on `spec/example.md`, and only then open Stage 2.

---

## Session 1 — addendum, 1 August 2026

D-1 ratified after the log above was written: **Typing the thought is the whole of the work.** Stage 1's deliverable is now complete and Gate 1 is ready to run.

One consequence found immediately: D-1 forbids mandatory post-capture steps, and two blocking dialogs remain in the example. Recorded in FOUND, NOT FIXED rather than fixed here, because changing them is a job of its own.

Save point: `stage 1: D-1 ratified, Stage 1 deliverable complete`

---

## Session 1 — addendum 2, 1 August 2026

The two blocking dialogs are kept rather than converted to toasts. D-1 is scoped to the normal path, with a closed exception list of two: exact duplicate, and split. The rule behind the list is that both fire only where the engine cannot determine how many records the input describes.

`spec/example.md` is at version 6. Stage 1's deliverable is complete. Gate 1 is ready to run and has not yet been run.

Save point: `stage 1: D-1 scoped, exception list closed, example v6`

Session 1 closed.

---

## Session 2 — 1 August 2026

**Job:** Resolve the seven Gate 1 findings and fold them into the Stage 1 example.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v6 → v7), `spec.md`, `sessions.md`

**Tests:** none. No code exists.

**Decisions made:** 7, all in the decision log. The two that changed behaviour rather than wording: windows are clipped at `now` before the midpoint is taken, which replaces the floor rule outright; and one fallback vocabulary of three members, which exposed `context` misusing `none` and `date_precision` doing three jobs under `open`.

**Found, not fixed:** nothing new. The stale `CASCADE_PART_A_SPEC.md` and deck remain.

**Save point:** `stage 1: seven Gate 1 findings resolved, example v7`

**Asked for but not done:** the Gate 1 read itself. v7 is ready for it.

**Next job:** Re-run the Gate 1 read on v7. Stage 2 opens only if it passes.

---

## Session 3 — 1 August 2026

**Job:** Resolve the second batch of Gate 1 findings.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v7 → v8), `spec.md`, `sessions.md`

**Tests:** none. No code exists.

**Decisions made:** 4. The only behavioural one is #14: a fully passed daily band rolls to its next occurrence, which completes window resolution to three cases. The others were classification: `is_hard` moves to working values and the stored field count drops to 33, the `date_precision` tail gets a total order, and `commitment_type` keeps `action` as a legitimate default rather than gaining `other`.

**Found, not fixed:** the 400-line rule's scope is unwritten and `spec/example.md` is past it. Amendment proposed, not applied, because `BUILD_PROTOCOL.md` is not this project's file to edit.

**Save point:** `stage 1: second batch of Gate 1 findings resolved, example v8`

**Asked for but not done:** #16 needs a protocol edit, which is yours.

**Next job:** Re-run the Gate 1 read on v8.

---

## Session 4 — 1 August 2026

**Job:** Clear the mechanical findings that survived three sessions, plus 8, 10, 18, 19, 20 and 21.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v8 → v9), `spec.md`, `sessions.md`

**Tests:** none. No code exists.

**Decisions made:** 4. #18 is the behavioural one: `earliest_start` follows the occurrence `due_at` resolved to, rather than the stated window start, so a rolled band no longer leaves the two fields on different days. Plus: `day`, `month` and `span` are windows and need no separate rules while `time` is not a window; `span` survives; Part 7's start-of-session report is adopted from Session 5.

**Found, not fixed:** no capture exercises `span` or the Weekend chip. The level is reachable and its rule is stated, so this is an example gap rather than a taxonomy gap.

**Save point:** `stage 1: mechanical findings cleared, example v9`

**Asked for but not done:** #22, the 400-line amendment to `BUILD_PROTOCOL.md`. Not this project's file.

**Next job:** Re-run the Gate 1 read on v9.

---

## Session 5 — 1 August 2026

**Job:** Clear findings 6b, 8, 23 and 24, plus the two minors.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v9 → v10), `spec.md`, `sessions.md`

**Tests:** none. No code exists. All midpoint arithmetic in the file was recomputed and verified against the half-open convention before writing.

**Decisions made:** 4. #24 half-open intervals throughout, which is the one that would otherwise have surfaced as a failing Stage 4 boundary case. #23 `day_start_anchor` is 09:00 and the morning band references it. #8 blank badge, confirmed rather than overturned. #16 logged.

**Found, not fixed:** nothing new.

**Save point:** `stage 1: example v10, Gate 1 ready`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Re-run the Gate 1 read on v10. If it signs, Stage 2 opens and the first job is `schema/contract.md`.

---

## Session 6 — 1 August 2026

**Job:** Clear findings 25 to 29 and the tiling minor.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v10 → v11), `spec.md`, `sessions.md`

**Tests:** none. Every UTC timestamp in the example was swept programmatically and re-rendered to local to confirm it matches its stated value. Eight timestamps, all correct.

**Decisions made:** 5. #28 is the behavioural one: an explicit `end` or `start` anchor overrides the midpoint rule, so `by Friday` and plain `Friday` resolve differently. The rest are bounds: all five window types stated in one table, the `end` marker set unified with the existing strong and weak lists, and midpoints outside working hours accepted without a rounding rule.

**Found, not fixed:** nothing new.

**Save point:** `stage 1: window bounds stated, anchors override midpoint, example v11`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Re-run the Gate 1 read on v11.

---

## Session 7 — 1 August 2026

**Job:** Clear findings 30 to 33.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v11 → v12), `spec.md`, `sessions.md`

**Tests:** none. The marker vocabularies were cross-checked programmatically: the twelve tokens claimed by the prose and the twelve in the strong and weak tables now match exactly, in both directions.

**Decisions made:** 2. #32 is the semantic one: an `end` anchor leaves `earliest_start` empty, because writing the window start inverts what a deadline means and would make Part C hide a task until the morning it is due. #30 and #31 dissolve together: `date_anchor` is a resolution strategy with five members evaluated in order, so `none` and `point` are decided by the expression and only `end`, `start` and `window` need a window to act on.

**Found, not fixed:** nothing new.

**Save point:** `stage 1: anchor precedence and the end/earliest_start correction, example v12`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Re-run the Gate 1 read on v12.

---

## Session 8 — 1 August 2026

**Job:** Clear findings 34 to 36 and the three coupling faults the reorder exposed.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v12 → v13), `spec.md`, `sessions.md`

**Tests:** none. The anchor function was re-evaluated against all six captures plus the five new worked rows, and every timestamp in the file was re-swept against the bounds table. No existing value changed.

**Decisions made:** 5. #34 is the behavioural one: the anchor order becomes `none`, `end`, `start`, `point`, `window`, with the marker rows branching on time versus window, which stops a start marker with a time being stored as a deadline. #35: a bare passed time rolls, a dated time does not. Three fell out of the reorder rather than being asked for: row 1 keys on precision so `open` and `undetermined` no longer reach the midpoint rule with no bounds, `has_time` is stated independently of the anchor, and the single-valued limit on a line carrying both marker kinds is written down.

**Found, not fixed:** nothing new.

**Save point:** `stage 1: anchor reorder, passed-time roll, anchor coverage table, example v13`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`. Adding a `span` capture to §5; the Weekend chip is still unexercised.

**Next job:** Re-run the Gate 1 read on v13.

---

## Session 9 — 1 August 2026

**Job:** Close the `span` example gap.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v13 → v14), `spec.md`, `sessions.md`

**Tests:** none. All six rows of the new precision table were computed from the bounds table and checked against every timestamp already in the file. No existing value changed.

**Decisions made:** 2. A resolution table rather than a new capture, because a capture needs a task line and an invented line would invent the config behind it. And a stated rule that date comparisons read the user's zone, since two of the six midpoints fall on the previous day in UTC.

**Found, not fixed:** `date_firmness` defaults to `firm`, a real value, with no source field to distinguish an implied firm date from an unmarked line. `commitment_type` defaults to `action` with the same shape; the file argues the failure signal sits upstream in `action_verb`, which holds only while nothing else writes to it. Both carried to Stage 2.

**Save point:** `stage 1: precision resolution table, example v14`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 1 read on v14.

---

## Session 10 — 1 August 2026

**Job:** Make stored values self-describing.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v14 → v15), `spec.md`, `sessions.md`

**Tests:** none. All 11 timestamps re-derived from the bounds table in their new form and checked against the local values they already asserted. Firmness enum checked for residual members.

**Decisions made:** 3. Timestamps stored local with offset rather than as UTC. `date_firmness`'s middle member renamed to `normal`. No `firmness_source` field, because it would be a pure function of the field it describes.

**Found, not fixed:** `commitment_type` still defaults to `action`, a real value, with no source field. Unlike firmness this one has an override path already visible in §2, where the type chip can be tapped, so `action` can mean defaulted or chosen. Carried to Stage 2.

**Save point:** `stage 1: offset timestamps and the normal firmness member, example v15`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 1 read on v15.

---

## Session 11 — 1 August 2026

**Job:** Clear the Gate 1 read on v15.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v15 → v16), `spec.md`, `sessions.md`

**Tests:** none. All 11 timestamps re-verified unchanged, field table re-counted at 36, origin tally re-derived, anchor order and firmness enum re-checked, Ideas panel re-ordered against factor 10.

**Decisions made:** 10. Three new fields, `verb_phrase`, `type_source` and `updated_at`. `action_verb` stated as a closed set with a noun path. The split dialog removed, so one typed sentence is always one task and comma items sum. The duplicate dialog moved to trigram similarity at 0.90 with a length guard. Merge removed from Part A. `importance` renamed `significance`. Factor 10 becomes last touch.

**Found, not fixed:** `config.duplicate_min_chars` has no value; the key is named and the number is not chosen. Multi-match precedence is undefined when a line contains several lexicon tokens, which the noun path makes common rather than rare. Both are Stage 2.

**Save point:** `stage 1: verb_phrase, type_source, updated_at, one sentence one task, fuzzy duplicates, significance, example v16`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 1 read on v16.

---

## Session 12 — 1 August 2026

**Job:** Clear the Gate 1 read on v16.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v16 → v17), `spec.md`, `sessions.md`

**Tests:** none. 11 timestamps re-verified, field table re-counted at 36, `undetermined` swept out of every `action_verb` position and its config keys, anchor order re-checked.

**Decisions made:** 2. Summing requires a comma list after a single verb. `Srilanka tickets` resolves to `other`, which makes `undetermined` unreachable on `action_verb`.

**Found, not fixed:** `config.duplicate_min_chars` has no value. Multi-match precedence is undefined. `duration_source` now shows `default` and `summed` and is never enumerated. §6 asserts that `bharti sighla VC` and `bhati sighla VC` interrupt each other, which depends on 0.90 against a measure specified only as "trigram"; one character in sixteen may not clear it. All Stage 2.

**Save point:** `stage 1: sum guard and the other/undetermined correction, example v17`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 1 read on v17.

---

## Session 13 — 1 August 2026

**Job:** Apply the Stage 2 boundary decisions that change the example.

**Stage before / after:** 1 / 1

**Files changed:** `spec/example.md` (v17 → v18), `spec.md`, `sessions.md`

**Tests:** none. Field table re-counted at 37, origin tally re-derived, Ideas panel re-ordered against factor 10 with the new durations, 11 timestamps re-verified unchanged.

**Decisions made:** 3. `closed_at` replacing `completed_at` with `task_state` at three members and `archived` as a boolean. `duration_defaults.other` at 5 minutes. `duration_source` at four members.

**Found, not fixed:** nothing new.

**Save point:** `stage 1: closed_at, archived boolean, other at 5m, example v18`

**Next job:** Re-sign Gate 1 on v18, then write the contract.

---

## Session 14 — 1 August 2026

**Job:** Write the Stage 2 contract.

**Stage before / after:** 1 / 2

**Files changed:** `schema/contract.md` (new), `schema/types.ts` (new), `spec.md`, `sessions.md`

**Tests:** `tsc --noEmit --strict` compiles clean. Field sets cross-checked three ways: 37 in the example, 37 in the contract, 37 in `types.ts`, no member in one and not the others.

**Decisions made:** 3. Config-resident enums are branded strings validated at runtime, not literal unions, because members live in config. A record is read against its own `config_version`. An out-of-contract value at write time is rejected rather than coerced.

**Found, not fixed:** six items carried into Stage 3, listed in `schema/contract.md`. The two that block Stage 3 rather than Stage 7 are that `config.action_verbs` and `config.contexts` have no member lists, and that multi-match precedence is undefined.

**Save point:** `stage 2: contract v1 and types.ts, tsc clean`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 2.

---

## Session 15 — 1 August 2026

**Job:** Bring config into the Stage 2 contract.

**Stage before / after:** 2 / 2

**Files changed:** `schema/contract.md` (v1 → v2), `schema/types.ts`, `config.ts` (new), `spec/example.md` (v18 → v19), `spec.md`, `sessions.md`

**Tests:** `tsc --noEmit --strict types.ts config.ts` compiles clean. Every `duration_defaults`, `verb_to_type` and `verb_to_context` value the example asserts was checked against `config.ts` and matches. Ranking factors counted at ten with `pinned` as a separate override.

**Decisions made:** 5. Config splits three ways into 22 objects. Vocabulary members carry `active` and are never removed. `config_version` keeps its letter with no operation bumping it. Duplicate detection becomes `max(trigram, word_match) > 0.6` with numeric tokens excluded. `a.1` vocabulary drawn only from the example.

**Found, not fixed:** the duplicate rule is a guess with no backlog behind it. `a.1` ships 7 verbs and 2 contexts but all 14 types, which is inconsistent thinness.

**Save point:** `stage 2: config schema and a.1, contract v2, example v19`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 2.

---

## Session 16 — 1 August 2026

**Job:** Rebuild the contract around the protocol's three groups.

**Stage before / after:** 2 / 2

**Files changed:** `schema/contract.md` (v2 → v3), `schema/types.ts`, `config.ts`, `spec/example.md` (v19 → v20), `spec.md`, `sessions.md`

**Tests:** `tsc --noEmit --strict types.ts config.ts` compiles clean. Every `config.` key named in the example checked present in `config.ts`. `Task` re-counted at 37 in `types.ts`. All four group headings and the protocol's column set verified present.

**Decisions made:** 6. Three groups. `now` and `new_id` as inputs. `compare_key` named. `UndoEntry` in the contract. `undo_ui_timeout_sec` resolving the name collision. Invented lexicon entries removed.

**Found, not fixed:** the seven values reachable but unexercised are now listed with a written reason rather than silently absent, which satisfies Part 4 but does not exercise them. All are Stage 4 golden cases.

**Save point:** `stage 2: contract v3 in three groups, UndoEntry, compare_key, example v20`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`. The `normalised` source reversal still has no dated decision-log entry.

**Next job:** Re-sign Gate 1 on v20, then Gate 2 on contract v3.

---

## Session 17 — 1 August 2026

**Job:** Correct the duplicate rule.

**Stage before / after:** 2 / 2

**Files changed:** `spec/example.md` (v20 → v21), `schema/contract.md` (v3 → v4), `schema/types.ts`, `config.ts`, `spec.md`, `sessions.md`

**Tests:** every similarity figure in the example computed rather than asserted, across eleven pairs. `tsc --strict` clean.

**Decisions made:** 2. Numeric-token stripping is a suppression test, not a normalisation. Threshold 0.8 with `>=`, both measures Sørensen–Dice.

**Found, not fixed:** the rule is fitted to eleven hand-made pairs. It has one known weakness at either setting: at 0.8 a substring pair scores exactly on the boundary, and at 0.6 similarly-spelled names collide.

**Save point:** `stage 2: duplicate suppression and threshold 0.8, example v21, contract v4`

**Next job:** Session 18 bookkeeping, then Gate 2.

---

## Session 18 — 1 August 2026

**Job:** Close the bookkeeping owed and re-sign Gate 1.

**Stage before / after:** 2 / 2

**Files changed:** `spec.md`, `sessions.md`

**Tests:** Gate 1 re-read on v21, full pass over every value.

**Decisions made:** 1, recorded late. The `normalised` source reversal from `title` to `raw_text` now has a dated entry; it had lived only in the example's closed-items table since Session 4.

**Found, not fixed:** nothing new.

**Save point:** `stage 2: gate 1 re-signed on v21, decision log complete`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Gate 2.

---

## Session 19 — 1 August 2026

**Job:** Name the rendered outputs Gate 2's first pass found missing.

**Stage before / after:** 2 / 3

**Files changed:** `schema/contract.md` (v4 → v5), `schema/types.ts`, `config.ts`, `spec.md`, `sessions.md`

**Tests:** `tsc --strict` clean. Gate 2 run two-directionally as a script: every stored field, rendered element, config key and working value on the example checked against the contract, and every `Task` field and config object checked back against the example or the unused-with-reason table. Pass.

**Decisions made:** 3. Six rendered outputs named. `significance_buttons` becomes `{value, label}` pairs. `nav_bar` members are code.

**Found, not fixed:** five items carried into Stage 3, listed in `schema/contract.md`. The two that bite first are multi-match precedence and `a.1`'s `verb_lexicon` covering only the example.

**Save point:** `stage 2 complete: gate 2 signed, contract v5`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Stage 3, the resolver.

---

## Session 20 — 1 August 2026

**Job:** Ranking tiers, `card_reason` composition, `capture_state`, and the five Gate 2 findings.

**Stage before / after:** 2 / 3

**Files changed:** `spec/example.md` (v21 → v22), `schema/contract.md` (v5 → v6), `schema/types.ts`, `config.ts`, `gate2.py` (new), `spec.md`, `sessions.md`

**Tests:** `tsc --strict` clean. `gate2.py` passes: 9 inputs, 12 working values, 16 shown outputs, 37 `Task` fields, 4 `UndoEntry` fields, 23 config objects, each checked contract-to-types and types-to-`config.ts`, plus every rendered element and config key back from the example. Gate 1 re-read on v22: 11 timestamps, 6 similarity rows, tier membership and factor count all recomputed.

**Decisions made:** 6. Three ranking tiers. `card_reason` as composition. `due_phrase` named. `bound_task_id` as an input. Trigram multiset stated. Gate 2 as a script.

**Found, not fixed:** `card_reason` when a task is both `is_hard` and high significance renders both clauses and no capture in the example has both. `ranking.mode = weighted` has no implementation. Both are Stage 4 cases.

**Save point:** `stage 2 complete: ranking tiers, card_reason composition, gate 2 signed on contract v6`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Stage 3, the empty shell. Real logic forbidden.

---

## Session 21 — 1 August 2026

**Job:** Drop the tab bar and record the ranking reversal properly.

**Stage before / after:** 2 / 2

**Files changed:** `spec/example.md` (v22 → v23), `spec.md`, `sessions.md`

**Tests:** Gate 1 re-read on v23.

**Decisions made:** 1. Part A has two lists, `Default` and `Ideas`, and no tabs.

**Found, not fixed:** the `Default` list is unfiltered, so a hard deadline four months out sits near the top. Filtering arrives with Part C.

**Save point:** `stage 2: tab bar dropped, two lists named, example v23`

---

## Session 22 — 1 August 2026

**Job:** Make `gate2.py` implement Gate 2.

**Stage before / after:** 2 / 2

**Files changed:** `gate2.py`, `schema/contract.md` (v6 → v7)

**Tests:** the rewritten script found six contract Example values that do not appear on the example, including one that exposed a wrong rule: `due_phrase_short` was specified as fully lowercased when the example shows `due Wed`.

**Decisions made:** the gate checks each item's stated Example against the example text, rather than checking that the item's name is mentioned. A name can be in prose and never demonstrated.

**Found, not fixed:** the script is now the gate and can itself be wrong. Its first two runs produced failures caused by its own parsing.

**Save point:** `stage 2: gate2.py walks all five groups both directions`

---

## Session 23 — 1 August 2026

**Job:** Close findings B and D to H.

**Stage before / after:** 2 / 2

**Files changed:** `schema/contract.md` (v7), `schema/types.ts`, `config.ts`, `spec.md`, `sessions.md`

**Tests:** `gate2.py` passes: 9 inputs, 13 working values, 17 shown outputs, 37 `Task` fields, 4 `UndoEntry` fields, 23 config objects, 53 rendered fragments discovered. Gate 1 re-read on v23: 11 timestamps, 6 similarity rows, tier membership and factor count recomputed.

**Decisions made:** 5. `due_phrase` granularity order. Per-clause joiners. `significance` label from config. `decided_by` for the last row. Three name collisions resolved in favour of the contract's spelling.

**Found, not fixed:** `decided_by = pinned` and a card with both trailing clauses are both reachable and unexercised. Stage 4 cases.

**Save point:** `stage 2 complete: gate 1 on example v23, gate 2 on contract v7`

**Asked for but not done:** applying the 400-line amendment to `BUILD_PROTOCOL.md`.

**Next job:** Stage 3, the empty shell. Real logic forbidden.

---

## Session 24 — 1 August 2026

**Job:** Expand the vocabulary against a real backlog and write the Stage 4 answer key.

**Stage before / after:** 2 / 4 (Stage 3's shell is owed; see the deviation below)

**Files changed:** `config.ts` (`a.1` → `a.2`), `tests/answer_key.md` (new), `spec.md`, `sessions.md`

**Tests:** every midpoint in the key recomputed against `window_bounds`, 10 of 10 match. Weekdays confirmed. `tsc --strict` clean. The duplicate rule was run against six real spelling-drift pairs from the backlog: three fire, three do not, all correctly.

**Decisions made:** 3. Vocabulary to 18 verbs. `tickets` and `investment` deliberately excluded. The key is hand-written, and the 200-row file is a regression corpus rather than a key.

**Found, not fixed:** four cases in the key carry a claim rather than a derivation, and Gate 4 cannot pass on them: appositive commas versus a list, whitespace collapsing in `normalised`, Hindi-English word order, and a start marker with no date silently dropping its constraint.

**Deliberate deviation:** the answer key is written before Stage 3's empty shell. The key depends on the contract and not on the shell, so the order is harmless, but it is an inversion of Part 3 and is recorded as one.

**Save point:** `stage 4: config a.2 and answer key v1, 80 cases hand-written`

**Next job:** Stage 3's shell, then Gate 4.

---

## Session 25 — 1 August 2026

**Job:** Make the vocabulary live, make the gate real, and stop `spec.md` carrying versions in prose.

**Stage before / after:** 4 / 4

**Files changed:** `config.ts`, `gate2.py`, `selftest.py` (new), `spec/example.md`, `spec.md`, `tests/answer_key.md`, `sessions.md`

**Tests:** `selftest.py` runs the gate against six deliberately broken copies. Six caught, none missed, and the gate still passes on clean files. `gate2.py` passes. `tsc --strict` clean. `verb_lexicon` read back from the file: 52 entries, 18 members, no dead members, no orphans.

**Decisions made:** 5. `file`, `send` and `reply` route to their own members. Config liveness is a gate check. The gate is self-tested before it is trusted. `spec.md` states each version once. The example lists its fourteen tasks.

**Found, not fixed:** Stage 3's shell is still unbuilt, so Gate 4 cannot be run and the 80 cases sit unchecked. That is the next job and nothing else should precede it.

**Save point:** `stage 4: vocabulary live, gate self-tested, versions stated once`

**Next job:** Stage 3's empty shell. Real logic forbidden. Then Gate 4.

---

## Session 26 — 1 August 2026

**Job:** Repair the decision log, propagate `file` and `reply` through the example, and make the gate see badge membership.

**Stage before / after:** 4 / 4

**Files changed:** `spec.md`, `spec/example.md`, `gate2.py`, `selftest.py`, `log.manifest` (new), `sessions.md`

**Tests:** `selftest.py` 10 of 10 caught, none missed, clean files still pass. `gate2.py` passes. `tsc --strict` clean.

**Decisions made:** 3. The log is hash-protected. Badge templates are built from `action_verbs`. Every drawn badge is compared against the task table.

**Found, not fixed:** the manifest must be regenerated whenever an entry is appended, which is a step that can be forgotten. Stage 3's shell is still unbuilt and Gate 4 still cannot be run.

**Save point:** `stage 4: log repaired and protected, file and reply propagated, gate catches badge membership`

**Next job:** Stage 3's empty shell. Nothing should precede it.

---

## Session 27 — 1 August 2026

**Job:** Close the three gate findings: the over-wide version exemption, the unsealed-append hole, and the duplicated sentence.

**Stage before / after:** 4 / 4

**Files changed:** `gate2.py`, `selftest.py`, `spec/example.md`, `schema/contract.md`, `schema/types.ts`, `spec.md`, `log.manifest`, `sessions.md`

**Tests:** `selftest.py` 12 of 12 caught, none missed, clean files still pass. Two new planted defects: a version below the decision log, and a companion version outside `spec.md`. `gate2.py` passes.

**Decisions made:** 4. Version exemption is a line filter. `--seal` regenerates the manifest and the gate warns when appends are unsealed. The duplicated sentence and its `a.2` reference are removed. No file outside `spec.md` may state a companion version.

**Found, not fixed:** Gate 1 is signed on example 24 and the example is at 26. Stage 3's shell is still unbuilt, so Gate 4 cannot be run.

**Save point:** `stage 4: version rule tightened, manifest sealable, companion versions removed`

**Next job:** re-sign Gate 1 on example 26, then Stage 3's empty shell.

---

## Session 28 — 1 August 2026

**Job:** Re-sign Gate 1 on the current example.

**Stage before / after:** 4 / 4

**Files changed:** `spec.md`, `sessions.md`, `log.manifest`

**Tests:** every value changed since the last signing traced to a stated origin. `file` and `filing` give member `file` through `verb_lexicon`; `reply` gives `reply`. `duration_defaults` gives 30 and 5. The member list in section 3 was checked against the task table and matches exactly, nine members including `other`. `gate2.py` passes, `selftest.py` 12 of 12.

**Decisions made:** 0. Re-signing is a gate event, not a decision.

**Found, not fixed:** badge durations are not compared against config, because `summed` durations do not equal `duration_defaults[verb]`.

**Save point:** `stage 4: gate 1 re-signed on the current example`

**Next job:** Stage 3's empty shell.

---

## Session 29 — 1 August 2026

**Job:** Stage 3's empty shell.

**Stage before / after:** 2 / 3

**Files changed:** `shell/` (new: `index.html`, `app.js`, `resolve.js`, `render.js`, `config.js`, `check_render.mjs`), `tsconfig.shell.json`, `spec/example.md`, `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `check_render.mjs` rebuilds section 1 from the placeholder and matches the example exactly. `gate2.py` passes. `selftest.py` 13 of 13 caught, none missed, including a new ragged-panel case.

**Decisions made:** 2. Drawn panels must be rectangular. Card badges end at one interior column.

**Found, not fixed:** `ListView.group_header` is required by the type but the Default list draws none; only the results overlay does. The shell sets it and ignores it. `resolve()` returns `{list, capture}`, a wrapper the contract does not name.

**Save point:** `stage 3: shell renders section 1 from a fixed placeholder`

**Next job:** Gate 3 by hand, then Stage 4's key against the shell.

---

## Session 30 — 4 August 2026

**Job:** Press Gate 3 by hand.

**Stage before / after:** 3 / 4

**Files changed:** `spec.md`, `sessions.md`, `log.manifest`

**Tests:** the panel drew from the placeholder and matched example section 1 on screen, with all three hand-off log lines present. `card_badge` was deleted from `list.cards[0]`; the app showed a red box reading `resolve() returned list.cards[0] with no card_badge` with a stack trace naming `app.js` line 72, and drew no panel. The line was restored and the panel returned.

**Decisions made:** 0. Passing a gate is not a decision.

**Found, not fixed:** `ListView.group_header` is required by the type and the Default list draws none. `resolve()` returns `{list, capture}`, a wrapper the contract does not name. Both are cheap now and awkward once the engine exists.

**Save point:** `gate 3 signed; stage 4 next`

**Next job:** Stage 4. Wire the 80-case key to a command and run it against the shell. Every case must fail with its expected value printed.

---

## Session 31 — 4 August 2026

**Job:** Write the Stage 4 runner, and close the stale claims found while auditing the Gate 3 bundle.

**Stage before / after:** 4 / 4

**Files changed:** `gate4.mjs`, `shell/resolve.js`, `shell/app.js`, `shell/check_loud.mjs`, `contract.md`, `types.ts`, `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate4.mjs` runs 56 of the key's 88 cases and all 56 fail, each printing the hand-written expected value. 0 pass, 0 error. `gate2.py` passes with the four new checks; `selftest.py` catches 17 planted defects, up from 13. `check_render.mjs` still matches example section 1 character for character, and `check_loud.mjs` now proves 5 breaks loud, including a dropped `task`.

**Decisions made:** 7. Stack closed at plain ES modules (D-21). `resolve()` returns `task`, `list`, `capture`, named in the contract. The runner holds no expected values and reads them from the key. Four contract invariants asserted per case, because two cases matched the placeholder record field for field and would otherwise have passed. The four open cases are parked, read from the key's own table. The contract stops enumerating vocabulary members. `log.manifest` is checked by membership rather than position, so an append to the decision log no longer reads as edits to everything below it.

**Found, not fixed:** `CaptureInput` carries no existing tasks, so the eleven duplicate cases cannot be called at all: a contract change, and the next job. Fifteen key cases state their expectation in prose and one mixes a typed line with a chip tap; regularising the key covers them. `ListView.group_header` is still required by the type with nothing drawing it. Earlier records call the key an 80-case key; it declares 88, and the gate now reads the real count out of the file.

**Save point:** `stage 4: runner written, 56 of 88 cases failing correctly, gate 4 unsigned`

**Next job:** Give the duplicate rule an input to work against. Eleven cases in section D compare a new capture against an existing task, and nothing in the contract hands one in.

---

## Session 32 — 4 August 2026

**Job:** Regularise the answer key so every case is a table row the runner can read.

**Stage before / after:** 4 / 4

**Files changed:** `answer_key.md`, `gate4.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate4.mjs` now runs 69 of the 88 cases, up from 56, and all 69 fail with the hand-written expected value printed. 0 pass, 0 error. `gate2.py` passes. No expected value changed; sixteen prose cases became rows and one mixed input split into a typed line and a chip.

**Decisions made:** 4. Every case is a row. A blank cell means not stated and an italic marker means stated as empty. A case the engine cannot be asked about carries `Handled by`, and F3 leaves the runner's scope for Gate 6. A21 and G5 are marked disputed in place rather than corrected.

**Found, not fixed:** Reading every key input against `verb_lexicon` turned up two conflicts. A21 `personal ITR` expects `other`, and `itr` gives `file`. G5 `jhanvi automobile invoice clarification` expects `other`, and `invoice` gives `bill`. One side is wrong and neither is obviously the key.

**Save point:** `stage 4: 69 of 88 running, key at three, gate 4 unsigned`

**Next job:** Give the duplicate rule an input to work against. Eleven cases in section D compare a new capture against an existing task, and nothing in the contract hands one in.

---

## Session 33 — 4 August 2026

**Job:** Answer the six questions blocking Gate 4 and make the changes.

**Stage before / after:** 4 / 4

**Files changed:** `contract.md`, `types.ts`, `config.ts`, `answer_key.md`, `gate4.mjs`, `shell/resolve.js`, `shell/app.js`, `shell/check_loud.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate4.mjs` runs 87 of the 88 cases and all 87 fail with the hand-written expected value printed. 0 pass, 0 error. The one not run is F3, a screen limit the key hands to Gate 6. `gate2.py` passes at ten inputs. `selftest.py` catches 17. `check_render.mjs` still matches example section 1; `check_loud.mjs` proves 6 breaks loud.

**Decisions made:** 6. `existing_tasks` is a tenth input carrying every open task whole. A line below the minimum, or with no letter or digit, never registers and `resolve()` throws if called with one. A comma list sums only when every item is a single token. The lexicon matches one token at a time with no grammar and no word order. The key was wrong on A21 and G5, not the lexicon. `working` becomes a third returned key and `duplicate_dialog` moves into `CaptureView`.

**Found, not fixed:** Three duplicate scores in section D predate the definition of `normalised` and need re-deriving; one states a score and a note that contradict each other. `limits.raw_text_min_chars` is 2, fitted to nothing.

**Save point:** `stage 4: 87 of 88 failing correctly, key at four, gate 4 ready to press`

**Next job:** Press Gate 4 by hand. Run the command, read the failures, sign it, and add the signature to VERSIONS.

---

## Session 34 — 4 August 2026

**Job:** Close the Gate 4 findings: make the pass condition mean something, and correct the answer key where it was wrong.

**Stage before / after:** 4 / 4

**Files changed:** `answer_key.md`, `gate4.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate4.mjs` runs 86 of the 88 cases and all 86 fail on a value the key states. 0 pass, 0 error, 0 failing on invariants alone. Two not run: F3 to Gate 6, E1 to Gate 1. `gate2.py` passes. `selftest.py` catches 17. `check_render.mjs` still matches example section 1; `check_loud.mjs` proves 6 breaks loud.

**Decisions made:** 5. Gate 4 requires a key-sourced disagreement per case. A case that cannot disagree names its gate in `Handled by` instead of being exempted in the runner. Section B states `title`, section D states `compare_key` and `numeric_variant`. D2, D4, D7 re-derived and D11 given a score. The parked list is read from list items only.

**Caught in session:** naming F3 and E1 in the key's closing section parked them both, because the runner read that whole block for ids. Found by deleting E1's `Handled by` cell and expecting the gate to fail, which it did not. Fixed in the runner and in the key, and the check now works: with the cell removed, the gate reports E1 as failing on invariants alone and exits 1.

**Found, not fixed:** `title` keeps a dangling marker on the `by` and `before` rows, which is what the contract says and reads badly. B15 states no `title` because whether `at` belongs to the date span is unsettled. `spec/example.md` section 3 stamps a `config_version` older than the config in force, and `shell/resolve.js` copies it, so `check_render.mjs` compares stale against stale and nothing catches the drift.

**Save point:** `stage 4: 86 of 88 failing on the key, key at five, gate 4 ready to press`

**Next job:** Press Gate 4 by hand, sign it, add the signature to VERSIONS. Then re-stamp `spec/example.md` section 3 to the config in force, which is a Stage 1 change and needs Gate 1 signed again.

---

## Session 35 — 4 August 2026

**Job:** Stage 1. Re-stamp `spec/example.md` section 3 and narrow the `title` claim it was making without evidence.

**Stage before / after:** 4 / 4

**Files changed:** `example.md`, `shell/resolve.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `check_render.mjs` still matches example section 1 exactly. `gate2.py` passes. `selftest.py` catches 17. `gate4.mjs` runs 86 of 88, all 86 failing on the key, 0 on invariants alone. The `config_version` invariant no longer differs on any case, and no case went blind as a result.

**Decisions made:** 2. Section 3 carries the config in force, and the placeholder copy follows it. The `title` line in section 3 states only what the example's own cases show; markers and hedges are the contract's business.

**Found, not fixed:** Gate 1 is signed one version back and has to be pressed again by hand.

**Save point:** `example at 29, gate 1 unsigned, gate 4 still passing`

**Next job:** Press Gate 1 by hand on example 29. Then the `title` marker rule: contract, then key.

---

## Session 36 — 4 August 2026

**Job:** Stage 2. Settle what leaves `title`, and carry it into the answer key.

**Stage before / after:** 4 / 4

**Files changed:** `contract.md`, `answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 17. `gate4.mjs` runs 86 of 88, all 86 failing on the key, 0 on invariants alone. `check_render.mjs` and `check_loud.mjs` unaffected: the example's own line carries no marker.

**Decisions made:** 2. A marker leaves `title` with the date it governs and stays when it governs nothing; strong markers stay either way. `at` belongs to the temporal expression because no marker list holds it.

**The test that produced both:** a word leaves `title` only if the engine consumed it and something else on screen shows what it was consumed into. `by` becomes an instant that `due_phrase` prints, so it goes. `after` in `after audit` resolves to an anchor of `none` and prints nowhere, so it stays. `deadline` sets `is_hard`, which reaches the screen only when it decided a row's position, so it stays. `maybe` sets `soft`, which no rendered output reads at all, so it stays. `at` was never read by anything, so it could not be subtracted for a reason, which puts it inside the span instead.

**Caught in session:** the `stale version in spec` fixture in `selftest.py` names the contract version it corrupts, so bumping the contract broke the fixture. It reported `SETUP BROKEN (0 matches)` and counted a miss rather than passing quietly, which is the behaviour you want, and it was repointed. Every VERSIONS bump will do this again.

**Found, and answered:** `date_firmness` `soft` has no rendered output anywhere in Part A, and that is now stated as a decision rather than left as a gap. The hedge is captured for Part B to roll a date forward with. Written into the contract at its current, unsigned version.

**Found, not fixed:** Gate 1 and Gate 2 are both signed one version back.

**Save point:** `contract at 8, key at 6, gates 1, 2 and 4 all waiting on a hand`

**Next job:** Press Gate 1 on example 29, Gate 2 on contract 8, Gate 4 on key 6, in that order.

---

## Session 37 — 4 August 2026

**Job:** Take the four corrections from the gate readings: the config stamp exception, strong markers in `title`, the example's dateless tasks, and `at`.

**Stage before / after:** 4 / 4

**Files changed:** `config.ts`, `types.ts`, `contract.md`, `example.md`, `answer_key.md`, `gate2.py`, `selftest.py`, `shell/app.js`, `shell/resolve.js`, `shell/config.js`, `shell/types.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `tsc --strict` exits 0. `selftest.py` catches 17. `check_render.mjs` matches example section 1 after the panel was repadded; `check_loud.mjs` proves 6 breaks loud. `gate4.mjs` runs 86 of 88, all failing on the key, 0 on invariants alone.

**Decisions made:** 5, one of them corrected in place. The example may name a config older than the live one while nothing is deployed. A strong marker always leaves `title`; the other three groups leave only with a date. `at` is a `point` marker; `this` stays inside the span. Every backlog row carrying a due date is chip-dated, on an earlier day, and the `Origin` column names it.

**The defect worth remembering:** the example's opening panel put `Social alpha application deadline` at the top of the Default list, with `Due today`, while the contract and answer key both say a strong marker with no temporal expression resolves nothing and routes to Ideas. It had been through Gate 1 twenty-nine times. It was found by reading the fourteen-title table against case A23, not by any script, and no gate in the toolchain would have caught it: `gate2.py` checks that every drawn title is in the table, not that every drawn due date is derivable.

**The first fix was wrong and the Gate 1 reading caught it.** Adding a date word to the one row left five others in the same state, and the paragraph written to cover them claimed a backlog row with a due date shows the text that produced it, which five rows falsified. The real answer was already in the example: 5a dates `USB integration call` with a chip, a chip subtracts nothing from `title`, and a chip is the only input besides a date span that sets a `due_at`. All six dated backlog rows are chip-dated and the `Origin` column now says so. No typed text changed. The two decision-log entries written before the correction are sealed and stand; a correction entry sits under them.

**Caught in session:** the `version below the decision log` fixture anchored on the first entry under DELIBERATE DEVIATIONS, so prepending one broke it. Re-anchored on the heading alone. It reported `SETUP BROKEN` and counted a miss rather than passing, which is twice today that a fixture has failed loudly rather than quietly.

**Found, not fixed:** No check ties a due date drawn in the example to a date span in the text that produced it. That is the shape of the defect above and it can recur on any of the other seven backlog rows.

**The Gate 2 reading found three more, two of them worse than they looked.** The "Rules the answer key forced" heading said six and listed seven. `config.ts` carried its version in a header comment and an origin note pointing at an example nineteen versions old. And `shell/config.js`, which `gate4.mjs` imports, had never been regenerated after `config.ts` changed: it held `a.2` and no `point` group, so all 86 cases ran against a config that was not the one in force. `gate2.py` now compares every string literal in the emitted file against the source and fails on any difference, and it fails on a version number written into any companion file. Two new planted defects in `selftest.py`, which now runs 19.

**And a fourth, found in the same reading.** The config was exported as `configA1`, two versions after a.1, imported under that name by `gate4.mjs` and `shell/app.js`. Renamed `partAConfig`, and `gate2.py` now fails on a version inside an identifier as well as one in prose. `selftest.py` runs 20.

**The pattern across all four:** every version number written anywhere except VERSIONS went stale, and none of them were caught by a gate. A comment, an origin note, an emitted file, an export name. The rule was already written down; nothing enforced it outside `spec.md`.

**Save point:** `example 30, config a.3, contract 8, key 7, gates 1, 2 and 4 all waiting on a hand`

**Next job:** Press Gate 1 on example 30, Gate 2 on contract 8 and config a.3, Gate 4 on key 7, in that order.

---

## Session 38 — 4 August 2026

**Job:** Widen the identifier check to every source file, after Gates 1, 2 and 4 were signed.

**Stage before / after:** 4 / 5

**Files changed:** `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 21. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` runs 86 of 88, all failing on the key, 0 on invariants alone.

**Decisions made:** 1. The version-in-a-name check reads every `.ts`, `.js`, `.mjs` and `.py` in the bundle, code only, strings and comments stripped.

**Why code only:** the same string has to be allowed in three places and forbidden in one. The decision log records what the export used to be called. `selftest.py` holds the broken spelling so it can plant it. `gate2.py`'s own message names the pattern it catches. Only a live identifier is the defect, so strings and comments come out before the match runs.

**Proved by hand:** renaming the export back inside `gate4.mjs` fails the gate naming that file, and inside `shell/app.js` fails naming that one. Both were invisible to the check as written yesterday. A fixture now plants it in `gate4.mjs`, and the selftest sandbox carries `gate4.mjs` and `shell/app.js` so the glob can see them.

**Found, not fixed:** the check is a pattern match on the word `config`. A version carried in a name that does not contain it, `schemaV2` or `keyA1`, still gets through.

**Save point:** `gates 1, 2, 3 and 4 signed; stage 5 open`

**Next job:** Stage 5, first rule. Run `node gate4.mjs` after it and expect exactly the cases that rule covers to stop failing.

---

## Session 39 — 4 August 2026

**Job:** Close the hole in the version-in-a-name check.

**Stage before / after:** 5 / 5

**Files changed:** `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 23, none crashed. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` runs 86 of 88, all failing on the key, 0 on invariants alone.

**Decisions made:** 1. The nouns come out of VERSIONS, not from a word written into the check. 2. Four aliases are hand-kept. 3. A traceback is a miss, not a catch.

**How it reads a name:** an identifier is split on underscores and on case changes into parts. A part is a defect when it is a versioned noun and it either carries digits itself or sits next to a part that is digits with at most one letter in front. `keyA1`, `schemaV2`, `contract8` and `answerKey7` all fail; `config_version`, `gate4`, `sha1` and `utf8` all pass, and so does `monkey2`, because `key` is not one of its parts.

**Proved by hand:** planted `schemaV2` in `shell/app.js` and `srcKeyV7` in `gate4.mjs`, neither holding the word `config`, and both were invisible to yesterday's check. Both are fixtures now.

**Found while doing it:** the `config.ts` identifier fixture had been renaming `partAConfig`, which is the name `gate2.py` regexes on to find the config body. The gate crashed on a traceback and `selftest.py` read the non-zero exit as a catch, so the fixture proved nothing from the session it was written. Crashes are now reported separately and counted as misses.

**Found, not fixed:** the alias list is hand-kept, and an all-caps run reads as one part, so `KEYA1` gets through where `keyA1` does not.

**Pressed by hand:** planted `const keyV9 = 0;` in a throwaway `.ts` file. Gate 2 failed naming the file and the name; deleted it and the gate passed. `selftest.py` 23 caught 0 missed, `gate4.mjs` 86 on the key, render exact, all on the Windows box.

**Decided at the press:** `schema` stays in the alias list as reserve, although no identifier holds it today.

**Save point:** `gates 1, 2, 3 and 4 signed; gate 2 re-pressed on the widened check; stage 5 open`

**Next job:** Stage 5, first rule: section A, the verb. One token at a time through `verb_lexicon`.

---

## Session 40 — 4 August 2026

**Job:** Stage 5, rule 1: the verb.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `shell/check_render.mjs`, `shell/check_loud.mjs`, `gate4.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 23. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` reports 35 of 86 agreeing, 51 naming a rule not yet written, 0 on invariants alone, 0 errored.

**The rule:** every token of the typed line, lowercased and stripped of leading and trailing punctuation, is looked up in `verb_lexicon` in the order it was typed and the first match wins. `verb_phrase` keeps the token as typed. No match gives an empty `verb_phrase` and `other`. The verb then reads three maps: `verb_to_type`, `verb_to_context` and `duration_defaults`, with a missing `verb_to_context` entry giving `undetermined`.

**Predicted before running:** the 26 A cases minus A23 and A24, plus C2, C3 and C5, plus the 10 G cases. **Actual:** the same list minus A2 and A26. Nothing turned green that was not predicted.

**Found:** A2 and A26 both read `check`. The key gives them the `phone` context and `verb_to_context` has no `check` entry, so the engine gives `undetermined`. Left red rather than parked or corrected, and it blocks nothing else.

**Also this session:** `resolve()` returns `raw_text`, `id`, `created_at` and `config_version` from the input, without which no case could ever be green. `gate4.mjs` reads the stage from `spec.md` and inverts its verdict on it. The two Stage 3 harnesses now hand `resolve()` a real config.

**Save point:** `stage 5 open, rule 1 written; 35 of 86 green; check context disputed`

**Next job:** Settle `check`. Then rule 2.

---

## Session 41 — 4 August 2026

**Job:** Settle `check`.

**Stage before / after:** 5 / 5

**Files changed:** `tests/answer_key.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 23. `gate4.mjs` 37 of 86 agree, 49 name a rule not yet written, 0 on invariants alone.

**Decision:** the key was wrong, not config. A2 and A26 read `undetermined`. `phone` says the work happens on a phone; checking a sensor is the sensor. `confirm` and `give` already read `undetermined` in the same table.

**Cost:** the key bumps. Gate 4 was signed on the previous version and Stage 4's reading of the runner cannot be re-run, because the placeholder it tested against now holds rule 1. Both edited rows failed on three other fields under the placeholder, so the Stage 4 condition still holds for them; that was established by reading the Stage 4 run, not by re-running it. Recorded in FOUND, NOT FIXED, and every later key edit inherits it.

**Caught by the gate while writing this:** a config version string typed into a FOUND, NOT FIXED line failed Gate 2 on the stray-version rule.

**Also received:** an audit workbook of the key at the previous version. 15 issues, 12 gaps. I2 is the one settled here. The rest are triaged and not yet actioned.

**Save point:** `stage 5 open, rule 1 written; 37 of 86 green; key audit open`

**Next job:** B8's unclipped `earliest_start`, then the duplicate score definition, then blank versus `(empty)`.

---

## Session 42 — 4 August 2026

**Job:** Freeze the Stage 3 placeholder.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.stage3.js`, `gate4.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 23. `gate4.mjs` 37 of 86 agree. `gate4.mjs --placeholder` passes the Stage 4 reading on the current key: 86 run, 86 fail, 0 on invariants alone.

**Correction to Session 41.** That session recorded that Stage 4 could not be re-run once the engine had a rule. Wrong. The only thing missing was the file. Restoring it and running the current key against it passes, so the key at its current version demonstrably still meets the Stage 4 condition rather than being argued to.

**Save point:** `stage 5 open, rule 1 written; 37 of 86 green; key audit decided, batch not yet written`

**Next job:** The key batch. All fifteen decisions are made.

---

## Session 43 — 4 August 2026

**Job:** The key audit, all fifteen decisions, in one bump.

**Stage before / after:** 5 / 5

**Files changed:** `tests/answer_key.md`, `schema/contract.md`, `gate4.mjs`, `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 24. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 99 agree, 83 name a rule not yet written, 0 blank cells, 0 on invariants alone. `gate4.mjs --placeholder` still passes the Stage 4 reading on the enlarged key.

**The audit was wrong about the duplicate scores, and so was my check of it.** Both used symmetric padding. The contract states two leading spaces and one trailing, and that definition reproduces all nine hand figures to the digit. What was actually missing was the rounding rule, now written: half-up to two decimals, before the comparison with `threshold`. Nothing was regenerated because nothing had moved.

**What changed in the key:** three cell readings defined and 61 blanks filled; `date_marker` and `date_phrase` columns across section B; a `list` column across A, B, E and F; B8 clipped; the end-of-day instant at 23:59:59; two comma rows that separate the sum rule from its two rivals; section D's `max` split into `trigram`, `word_match` and `similarity_max`; twelve gap cases written, three parked with their question stated; two Gujarati rows; two cases carrying their own `now`; the config version dropped from the header; three cosmetic errors fixed.

**What changed in the toolchain:** a blank cell in a declared column now fails the run. `gate4.mjs` reads a per-case `now`, takes zero or several `existing_tasks`, and maps the `list` column to the shown output. `gate2.py` catches a config version in companion prose in any file, not in two spellings, and `selftest.py` plants the spelling that escaped.

**Cost, stated plainly:** the green count fell from 35 to 16, because the key now checks routing the engine does not decide. That is the next rule.

**Save point:** `stage 5 open, rule 1 written; key at 104 cases, 16 of 99 green; three cases parked`

**Next job:** Stage 5, rule 2: the list.

---

## Session 44 — 4 August 2026

**Job:** Settle the three parked cases.

**Stage before / after:** 5 / 5

**Files changed:** `tests/answer_key.md`, `schema/contract.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 24. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 102 agree, 0 blank cells, 0 parked, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Decisions:** 1. A typed duration is not read and config gains no member; the words stay in `title`. 2. A time beats a day in one line, and the anchor comes from the marker when there is one and from the expression when there is not, which reverses `at` being the cause of `point`. 3. An ended band rolls to the same band tomorrow; only bands roll.

**What moved:** three rows that stated nothing now state values, so the key runs 102 of 104 and every running case asserts something. Nothing turned green, because all three wait on rules not yet written.

**Save point:** `stage 5 open, rule 1 written; key at 104 cases, 16 of 102 green, nothing parked`

**Next job:** Stage 5, rule 2: the list.

---

## Session 45 — 4 August 2026

**Job:** Stage 5, rule 2: the dates.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `config.ts`, `shell/config.js`, `schema/contract.md`, `gate4.mjs`, `shell/check_render.mjs`, `shell/check_loud.mjs`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 24. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 102, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The rule:** find the hedge, the marker and the temporal expression; the anchor comes from the marker when there is one and from the expression when there is not; resolve the window, clip it by `now` when `now` is inside it, and take the midpoint. A time gives an instant, an `end` marker gives the window's last instant, a `start` marker gives its first.

**Predicted before running:** every date field on all 28 B rows, and no case turning green, because section B asserts `title` on every row and that rule is not written. **Actual:** exactly that. All 28 fail on `title`, six also on `list_header`, and on nothing else.

**Found:** the runner could not expand a key date carrying seconds, so the two rows at 23:59:59 read as mismatches when they agreed. Fixed in `expand`.

**Found:** both Stage 3 harnesses were handing `resolve()` an empty `now`. Second time a new input has broken them, same cause each time.

**Save point:** `stage 5 open, rules 1 and 2 written; 16 of 102 green; 45 cases waiting on titles`

**Next job:** Stage 5, rule 3: titles.

---

## Session 46 — 4 August 2026

**Job:** Three corrections to the date rule, all from reading the run.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 24. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 105, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Decisions:** 1. `in` makes a duration into a time and sits inside the expression, not in `marker_words`. `call kushan in 30 mins` is 11:10; `call kushan 30 min` stays a length and is not read. 2. A band and a clock time in one line contradict, and the time wins. 3. A rolled band offers a chip back to the day it came from, and never stops the capture to ask.

**Cases added:** B29 `in 30 mins`, B30 `in 2 hours`, B31 `morning 14:00`. All three fail on `title` alone, which is the next rule.

**Not changed:** B25 still rolls to tomorrow. The chip is what was added, and it is a Gate 6 obligation rather than a record field.

**Save point:** `stage 5 open, rules 1 and 2 written; key at 107 cases, 16 of 105 green`

**Next job:** Stage 5, rule 3: titles.

---

## Session 47 — 4 August 2026

**Job:** Make the key readable by hand, and test the two rules together.

**Stage before / after:** 5 / 5

**Files changed:** `tests/answer_key.md`, `gate4.mjs`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 24. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 111, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Raised on reading the key, and all four were right:**
1. No weekday on any date, so no row could be checked without a calendar. Every date now carries one and the runner checks it. Planting `Thu 7 Aug` stops the run.
2. `next month` looked like it should be September and `today` looked like it could not be 9 Aug. Both rows were right and both were unreadable: the clock override sat in the last column. It is now the second.
3. Every case in section A routes to Ideas, so nothing put a real line, a verb and a date together, and the Default list never carried a task with a verb, a type, a context and a duration. Section H, six cases.
4. E1 stated a dash for `list` while stating every other value.

**Section H passed its first run cleanly in the sense that matters:** all six fail on `title` alone. The verb rule did not read `friday` as a verb, the date rule did not read `form 8` as a date, and `Ghar kharch hisab in 30 mins` matched no verb and the right instant.

**Save point:** `stage 5 open, rules 1 and 2 written; key at 113 cases, 16 of 111 green`

**Next job:** Stage 5, rule 3: titles.

---

## Session 48 — 4 August 2026

**Job:** Press Gate 4 on the current key, and make the weekday check prove itself on every run.

**Stage before / after:** 5 / 5

**Files changed:** `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 111. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Pressed by hand:** Gate 4 on `answer_key` 12. Section H read, the three rows carrying their own clock read, `--placeholder` run and passing on 111 cases with 0 on invariants alone. VERSIONS now carries `gate4 signed on answer_key 12`, five versions on from the last press.

**New fixture:** a weekday that contradicts its date. It is the first case in `selftest.py` read by `gate4.mjs` instead of `gate2.py`, because `gate2.py` cannot see it. The sandbox now carries the shell files the key runner imports.

**Save point:** `stage 5 open, rules 1 and 2 written; gate 4 signed on the current key; 16 of 111 green`

**Next job:** Stage 5, rule 3: titles.

---

## Session 49 — 4 August 2026

**Job:** Press Gate 2 on the current contract.

**Stage before / after:** 5 / 5

**Files changed:** `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 16 of 111. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Pressed by hand:** Gate 2 on contract 12 and config a.4. The fourteen rules in `Rules the answer key forced` were read back in plain words, six of them written before the last press and eight since, and every one read as decided. VERSIONS now carries `gate2 signed on contract 12`.

**State of the signatures:** all four gates are now signed on the files in front of them. Gate 1 on example 30, Gate 2 on contract 12, Gate 3 on shell 1, Gate 4 on answer_key 12.

**Save point:** `stage 5 open, rules 1 and 2 written; all four gates signed on current files; 16 of 111 green`

**Next job:** Stage 5, rule 3: titles.

---

## Session 50 — 4 August 2026

**Job:** Stage 5, rule 3: the title.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `tests/answer_key.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 48 of 111, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The rule:** take out the words the engine consumed, the date span and the marker, and touch nothing else. A strong marker always goes, because it carries no content. A weak, start or point marker goes only when it found a date. A hedge stays. If taking the span out would leave nothing, the whole line stays.

**Predicted before running:** every case fails on `title` today, so every one should stop, and the B and H rows expecting `Default` should turn green because the placeholder already returns it. **Actual:** 16 green became 48, and not one case fails on `title`.

**Found before writing a line of it:** H6 stated a title that kept its strong marker, contradicting A23, E3 and the contract rule all three rest on. Written three sessions ago, read past twice including at the Gate 4 press, caught only by writing the rule that reads it. Key bumps to 13.

**What the 63 reds are now:** 39 on `list_header` alone, 13 on `compare_key`, 12 on `similarity`, 11 on `normalised`, 6 on the duplicate dialog, 3 on the comma sum, 3 on lines that must be refused.

**Save point:** `stage 5 open, rules 1 to 3 written; 48 of 111 green; 39 waiting on the list`

**Next job:** Stage 5, rule 4: the list.

---

## Session 51 — 4 August 2026

**Job:** A hedge leaves `title`.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 48 of 111, no case failing on `title`. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Decision:** `maybe call kushan tomorrow` draws as `call kushan`. The title rule removes the words the engine consumed, and a hedge is consumed like any other; keeping it made `title` and `normalised` differ for a reason no other pair of fields differed for. Five rows change: B21, E2, F10, H5, and the reasoning under F10.

**Owed:** `date_firmness` `soft` renders nowhere in Part A and the hedge no longer reaches the screen through `title` either, so a hedged capture and a plain one now draw identically. The record keeps `date_hedge` and `raw_text`. A screen trace is owed and its form is undecided, recorded in FOUND, NOT FIXED.

**Save point:** `stage 5 open, rules 1 to 3 written; 48 of 111 green; hedge trace owed`

**Next job:** Place the hedge trace, then Stage 5, rule 4: the list.

---

## Session 52 — 4 August 2026

**Job:** Place the hedge trace, and Stage 5 rule 4: the list.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `shell/check_render.mjs`, `schema/contract.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 80 of 111, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Hedge trace:** `due_phrase` reads `Tuesday, maybe` for a soft date. Decided and written into the contract; `due_phrase` has no rule and no column in the key, so nothing checks it yet. Both arrive together.

**The list rule:** `Default` when `due_at` is set, `Ideas` when it is not. Nothing else decides it.

**Predicted:** 39 cases turning green and nothing else moving. **Actual:** 48 became 80, which is 32 rather than 39, because seven of those rows also fail on `normalised` or on the duplicate fields and stayed red for those.

**One list disagreement is left,** E5, and it is correct: the chip supplies the date, the engine does not read chips yet, so the task has no `due_at` and routes to Ideas. It is the only case waiting on the chip.

**Found:** `check_render.mjs` was handing `resolve()` an empty line, which now routes to Ideas and draws the wrong panel header. It hands in the line the example was captured from instead. Third time a Stage 3 harness has broken on a new rule, same cause each time.

**Save point:** `stage 5 open, rules 1 to 4 written; 80 of 111 green; the duplicate side is what is left`

**Next job:** Stage 5, rule 5: `normalised` and `compare_key`.

---

## Session 53 — 4 August 2026

**Job:** Stage 5, rule 5: `normalised` and `compare_key`.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 90 of 111, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The rule:** `normalised` is `title` lowercased, punctuation stripped, whitespace collapsed, trimmed. `compare_key` is `normalised` with every purely numeric token removed.

**Derived from `title`, not from `raw_text`.** The contract defines both as the line minus the same structured spans, so writing a second stripper would mean two copies of one rule that have to agree forever.

**Predicted:** eleven cases on `normalised` and thirteen on `compare_key` stop failing, and the D rows stay red on the comparison itself. **Actual:** exactly that. 80 became 90, and no field named `normalised` or `compare_key` appears in the run.

**Save point:** `stage 5 open, rules 1 to 5 written; 90 of 111 green; the duplicate comparison is the largest block left`

**Next job:** Stage 5, rule 6: the duplicate comparison.

---

## Session 54 — 4 August 2026

**Job:** Stage 5, rule 6: the duplicate check.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `gate4.mjs`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 104 of 111, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The rule:** build both `compare_key`s; if they match while the `normalised` differ, the lines differ only by a number and nothing is asked; otherwise the dialog fires when the score reaches `threshold` and both keys reach `min_chars`. The score is the higher of the trigram and the word measure, rounded half-up to two decimals before the comparison.

**Every one of the fourteen D rows agrees,** including the nine hand-computed scores, which the engine now reproduces to the digit from the contract's definition.

**Found:** five cases failed on a trailing zero. The key writes `1.00` for a ratio and the record holds the number 1. The runner compares numeric fields as numbers now.

**Owed, and recorded:** the dialog's band sentence. The contract asks for `"check sensor" already exists, due today.` and the engine writes the first clause only, because the band needs `deadline_band` and that has no rule. The key checks the dialog as present or absent, so nothing catches it.

**Save point:** `stage 5 open, rules 1 to 6 written; 104 of 111 green; seven left`

**Next job:** Stage 5, rule 7: the three lines that must be refused.

---

## Session 55 — 4 August 2026

**Job:** Stage 5, rules 7 and 8: the comma sum and what never registers. Two jobs, recorded as a deviation.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `shell/check_loud.mjs`, `schema/contract.md`, `tests/answer_key.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 111 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The comma rule changed shape.** Counting the words in every item required something to strip `Payments` and `to` off the front, and nothing said what. Counting commas instead needs no such rule: two commas are three payments, and the first chunk is one item whatever it holds. Only the chunks after a comma have to be a single word.

**C6 flipped and C8 entered.** C6 was written to disprove a rival rule and stated 10 under the old reading; under the new one it sums to 20. C8 is the same two chunks in the other order and does not sum, which is the pair that makes the rule readable and keeps a discriminator against the determiner rival.

**The refusal:** below two characters after trimming, or no letter and no digit, and `resolve()` throws. The screen keeps the Add button off, so reaching the engine with an empty box is a caller defect rather than a message for the user.

**Found:** `check_loud.mjs` was handing in an empty line, which the refusal now throws on. Fourth harness break, same cause every time.

**Save point:** `stage 5 open, rules 1 to 8 written; 111 of 112 green; the chip is the last one`

**Next job:** Stage 5, rule 9: the chip.

---

## Session 56 — 4 August 2026

**Job:** The chip leaves the engine.

**Stage before / after:** 5 / 5

**Files changed:** `schema/contract.md`, `schema/types.ts`, `gate4.mjs`, `shell/app.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **112 of 112**, 0 errored, 0 on invariants alone. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Decision:** a chip types its words into the box. `date_chip_tap` leaves `CaptureInput`, which drops from ten inputs to nine. A chip was a second path for a date to reach the record, and two paths need a rule for which wins. A new chip is now a screen change. `Pick date` and `Park` produce no words and are deferred.

**Stage 5 is finished as far as the command can tell.** Every case in the key agrees with the engine. E5 turned green with no rule written for it, which is the outcome the runner exists to make visible: the last red case was closed by removing an input rather than by adding logic.

**Blocking Gate 5:** `spec/example.md` says a chip sets a `due_at` and subtracts nothing from `title`, and shows seven rows carrying a due date with no date span in `raw_text`. The engine can no longer produce such a row. Stage 1 has to be rewritten and Gate 1 re-pressed before Gate 5 means anything.

**Save point:** `stage 5 code complete, 112 of 112; example contradicts the chip decision; gate 5 blocked`

**Next job:** Rewrite `spec/example.md` for the chip decision.

---

## Session 57 — 4 August 2026

**Job:** Rewrite `spec/example.md` for the chip decision.

**Stage before / after:** 5 / 5

**Files changed:** `spec/example.md`, `schema/contract.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 112 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**What changed:** seven rows in the fourteen-title table now show the date words that produced their dates, and the `Origin` column names the day each was typed instead of naming a chip. Three paragraphs rewritten, and section 5a says the tap types the words.

**Nothing drawn changed.** Every title in the drawn column is what the line looks like with its date words taken out, so the panel is character-for-character what it was, which `check_render.mjs` confirms.

**Each line was run through the engine before being written down.** All seven produce the title the panel already draws, the verb the table already states, and the due date the card already claims, including `Social alpha application deadline monday` coming out `hard`, which is the tier-1 demonstration the ranking argument rests on.

**Two rows carry an earlier capture day:** `file form 8 friday` typed Wed 29 Jul, and `Social alpha application deadline monday` typed Fri 31 Jul. The other four were typed today. A relative word means what it meant on the day it was typed.

**Save point:** `stage 5 code complete, 112 of 112; example rewritten; gate 1 and gate 5 both waiting on a hand`

**Next job:** Gate 1 on example 31, then Gate 5.

---

## Session 58 — 4 August 2026

**Job:** State when each line was typed, and press Gate 1.

**Stage before / after:** 5 / 5

**Files changed:** `spec/example.md`, `gate2.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 112 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Raised on reading the rewrite:** the table gave the day a line was typed and then quoted due times that only follow if it was typed at 10:40. Four rows were underivable as written. Every row now states the moment it was typed, and the example says once that everything drawn is seen at Mon 3 Aug 10:40. `check sensor today` typed at 09:30 is due 16:45; the same words at 10:40 would be 17:20.

**Found while doing it:** `gate2.py` read the task table by counting pipes, so adding a column made it read the wrong cell for every title. It failed loudly and the reader now keys on the column name. Two other tables in that file are still read positionally.

**Pressed by hand:** Gate 1 on example 31.

**Save point:** `stage 5 code complete, 112 of 112; gate 1 signed on example 31; gate 5 waiting`

**Next job:** Gate 5.

---

## Session 59 — 4 August 2026

**Job:** Stage 5, rule 9: `deadline_band`, `due_phrase`, and the dialog's missing clause.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `gate4.mjs`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 112 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Decisions:** the nine card sentences as tabled; `this_week` ends Sunday night; a soft date reads `Due around Friday`.

**The key caught the rule twice.** The `due_phrase` column for 31 B rows and 6 H rows was derived by hand from the stated table before the engine was asked. Two rows came out wrong against it: `friday 5pm` read `Due at 5pm` and lost four days, and `tonight` read `Due this tonight`. The code changed; the key did not.

**The dialog's clause is written:** `"check sensor" already exists, due today.` when the open task has a due date, and the sentence stops after the name when it does not. Unchecked, because every open task the key hands in is dateless.

**Save point:** `stage 5 complete, nine rules, 112 of 112 with the card sentence checked on 37 rows`

**Next job:** Gate 5.

---

## Session 60 — 4 August 2026

**Job:** A span wider than a day says the span.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 112 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Raised on reading the sentences:** `next month` read `Due 16 Sep`. The instant is real and the sentence was false about how it was arrived at. A span wider than a day now names itself: `Due this weekend`, `Due next week`, `Due next month`, and `Due around next month` when hedged.

**Five rows changed:** B11, B12, B13, B26, H5. The record keeps the instant, which is what the ranking reads; the card keeps the words, which is what the person typed.

**Also confirmed against the run:** `tonight` reads `Due tonight` with no `this`, and `around` appears only when `date_firmness` is `soft`, which only a hedge word sets.

**Save point:** `stage 5 complete, nine rules, 112 of 112; gate 5 waiting`

**Next job:** Gate 5.

---

## Session 61 — 4 August 2026

**Job:** Two defects in the comma rule.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 112 of 112. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Found by running the rule over lines no case covered.** `call kushan, tomorrow` counted the date as a second call and drew as `call kushan,`. `Meet Priya, the new CFO, on Thursday` drew as `Meet Priya, the new CFO, on`. Neither was caught by eight fitted cases, because none of them put a date beside a comma or a preposition beside a date.

**Both fixed:** the commas are counted on `title`, so the date is gone first; a separator left with nothing to separate goes with what it separated; and `on` joins `this` as a word belonging to the expression.

**Section C states a title now,** on all nine rows, because a rule that changes what is counted can change what is drawn. C9 is the new case.

**Decided and kept:** the order-dependence, since allowing multi-word chunks after a comma would read the appositive as three meetings. And no ceiling on the sum, since a cap would be a second fitted number on a fitted rule, and batching by verb is already on the LATER LIST.

**Save point:** `stage 5 complete, 112 of 112, key at 115 cases; gate 5 waiting`

**Next job:** Gate 5.

---

## Session 62 — 4 August 2026

**Job:** Move `threshold` to 0.6 and record that the key does not constrain it.

**Stage before / after:** 5 / 5

**Files changed:** `config.ts`, `shell/config.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 25. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 113 of 113. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The finding:** the key's duplicate scores leave a gap. The lowest that fires is 0.82 and the highest that stays quiet is 0.50, so any threshold from 0.51 to 0.82 produces every verdict in the key. The number was never tested by anything.

**Proved by doing it:** the threshold moved from 0.8 to 0.6 at config `a.5` and not one row changed. Both the contract and section D now say the range is unpinned, so nobody later reads 0.6 as measured.

**What would pin it:** a pair scoring inside the gap whose right answer is known. `call markan` against `call marken` is 0.75, and the question there is whether one letter in a name should interrupt, which is a judgement rather than arithmetic.

**Save point:** `stage 5 complete, 113 of 113, threshold 0.6 and known unpinned; three presses waiting`

**Next job:** Gate 2 on contract 21, Gate 4 on key 19, then Gate 5.

---

## Session 63 — 4 August 2026

**Job:** The rules block states how many rules it holds.

**Stage before / after:** 5 / 5

**Files changed:** `schema/contract.md`, `gate2.py`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 113 of 113. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Found when the block was read for Gate 2:** it opens `Seven rules that the contract implied and never stated` and holds nineteen. Nothing counted them. The count is stated properly now and `gate2.py` fails when it disagrees with the paragraphs below it, with a fixture planting the old seven.

**Also found, and it was mine:** the reading instruction for Gate 2 named one block for nine rules, five of which live elsewhere in the file. `due_phrase` and everything deciding its wording sit with the rendered strings in section 4; the end-of-day second sits with the timestamps; the rounding rule sits under Duplicate detection. The block now says so in its second paragraph.

**Save point:** `stage 5 complete, 113 of 113; contract 22; three presses waiting`

**Next job:** Gate 2 on contract 22, Gate 4 on key 19, then Gate 5.

---

## Session 64 — 4 August 2026

**Job:** A length of time answers in a length of time.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 114 of 114. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Raised while reading the sentences:** `in 30 mins` read `Due at 11:10am`, which asks the reader to convert back into the units they typed in. It reads `Due in 30 mins` now, and `in 2 hours` reads `Due in 2 hours`.

**The edge:** the length only answers in lengths while it stays one, meaning the same day and inside twelve hours. B32, `in 20 hours`, sits past it and reads `Due tomorrow at 6:40am`.

**A hedge adds nothing here.** `Due around in 30 mins` is not English, so the relative form takes no `around`.

**Save point:** `stage 5 complete, 114 of 114, key at 116 cases; three presses waiting`

**Next job:** Gate 2 on contract 23, Gate 4 on key 20, then Gate 5.

---

## Session 65 — 4 August 2026

**Job:** The shell hands `resolve()` a whole instant.

**Stage before / after:** 5 / 5

**Files changed:** `shell/index.html`, `shell/app.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 114 of 114. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Found by typing into the running shell:** the `now` box shipped `2026-08-03T10:40+05:30`, with no seconds, and every Resolve failed with a red box naming `resolve.js` and the unreadable instant. The engine was right to refuse; the shell was wrong to hand it. The default value carries seconds now and `readInput` fills them in when they are missing.

**The error box did its job.** It named the file, the function, the line and the value, which is what Gate 3 was pressed for.

**Save point:** `stage 5 complete, 114 of 114; shell usable; three presses waiting`

**Next job:** Gate 2 on contract 23, Gate 4 on key 20, then Gate 5.

---

## Session 66 — 4 August 2026

**Job:** The shell resolves live.

**Stage before / after:** 5 / 5

**Files changed:** `shell/app.js`, `shell/index.html`, `shell/resolve.js`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 114 of 114. `gate4.mjs --placeholder` passes the Stage 4 reading.

**What changed:** every keystroke and every control re-resolves, debounced at 80ms. The Resolve button still works and now does nothing the typing does not.

**A refusal is marked.** `refuse()` sets `refused` on the error it throws, so a half-typed line draws `(nothing to capture yet)` instead of a red box, while any other throw stays loud with the file, function and line. Both still throw; only one is a defect.

**Also added:** everything the engine returns prints beside the drawn panel, grouped as the contract's three groups. 37 saved fields, 13 working values, and both shown groups. The list is built from the returned object rather than written into the screen, so a field added to the record cannot be invisible here.

**Found straight after, twice:** the browser served the previous session's `app.js` and `resolve.js` from cache, so the live shell looked like it had not changed. `Cache-Control: no-store` on the document fixed the page and not the modules it names, so the second time the page was new and the code was still old, which reads as a defect rather than a stale file. `index.html` now imports `app.js` under a fresh query each load and `app.js` passes that query to `config.js`, `resolve.js` and `render.js`. The harnesses import `resolve.js` directly and are untouched.

**Save point:** `stage 5 complete, 114 of 114; shell live; three presses waiting`

**Next job:** Gate 2 on contract 23, Gate 4 on key 20, then Gate 5.

---

## Session 67 — 4 August 2026

**Job:** Start the list of lines that came out wrong.

**Stage before / after:** 5 / 5

**Files changed:** `shell/app.js`, `shell/index.html`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 114 of 114. `gate4.mjs --placeholder` passes the Stage 4 reading.

**New section in `spec.md`, TYPED AND WRONG.** Nine lines so far, T1 to T9, each with what was typed, what came out and what is wrong. It stays open: more are coming from typing tomorrow, and nothing is fixed until the list stops growing.

**Seven are rules that do not exist** rather than rules that are wrong: a second date, a second marker, a time in the past, times and dates written in shapes nothing reads, abbreviations. T6 is the one misfiring rule, where a comma is swallowed into a date span. T8 is the lexicon being thin rather than anything being wrong.

**The shell now shows every field in four columns** with a rule between them and the 23 fields worth watching picked out, which is what made this pass quick.

**Save point:** `stage 5 complete, 114 of 114; nine typed lines wrong and recorded; list open`

**Next job:** Take his list, add it to T1 onward, then fix the lot in one session.

---

## Session 68 — 5 August 2026

**Job:** The shell says what it understood, marks what changed, and labels every field.

**Stage before / after:** 5 / 5

**Files changed:** `shell/app.js`, `shell/index.html`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` 114 of 114. `gate4.mjs --placeholder` passes the Stage 4 reading.

**T10 and T11, found by asking which fields never move.** Across fifteen varied lines, 24 of the 63 returned fields changed and 39 did not. `is_hard` is one of the 39 and the contract says it reads `date_firmness`, so a tier-1 ranking override is dead. `resolved_window` and `clipped_window` are another two: the date rule computes both internally and writes neither, so they still hold the hand-copied morning band on every line.

**Four labels on every field.** Green where it changed since the last line. Red where it changed and no rule writes it. Grey where no rule writes it yet, so it must not move. Blue where only an input this screen cannot supply would move it. Plain black means it moves and did not this time.

**The readback sentence** says what the engine understood in one line. It is built from the same fields it summarises, so it compresses rather than checks, and the log says so.

**Save point:** `stage 5 complete, 114 of 114; eleven typed lines wrong and recorded; list open`

**Next job:** Take his list, add to T1–T11, then fix the lot in one session.

---

## Session 69 — 5 August 2026

**Job:** The dead inputs: the taps, what the capture row shows, `is_hard`, and the two frozen windows.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `shell/render.js`, `shell/check_render.mjs`, `gate4.mjs`, `tests/answer_key.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches the example's typed capture row; `check_loud.mjs` 6 of 6. `gate4.mjs` **121 of 121**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Four of the nine inputs were read zero times by any rule.** `type_chip_tap`, `significance_tap`, `bound_task_id` and `row_action`. Twelve frozen fields traced back to them. 114 green never caught it because every case in the key hands in `null` for all four, so the key tested nine inputs' worth of contract through five of them.

**Written:** a tap outranks what the line implied and `type_source` records which. `significance` defaults to 30, not 70. The capture row moves off `bound_task_id`. `type_chip` shows the type. The parsed date chip reads like the card. `sort_header` appears on Ideas. `is_hard` reads `date_firmness`. Both windows are written out of the date rule.

**Section I, seven cases.** The first anywhere to tap anything.

**Row actions parked,** with the question stated in the key's closing section: `resolve()` builds a record from `typed_line` and *mark that other task done* is not that shape.

**Found by reading the example rather than guessing:** the chips wrap rather than drop, and the current significance button is drawn as `[**High**]` rather than styled. The first draft had both the other way.

**`check_render.mjs` now targets the typed capture row.** Section 1 draws an empty box, `resolve()` refuses an empty line, and the harness agreed with that panel only while `chip_row` was a copy of it.

**Save point:** `stage 5, 121 of 121, nine rules plus the taps; row actions parked; T1-T9 and T14 open`

**Next job:** His list of typed lines, then T1 to T9 in one session.

---

## Session 70 — 5 August 2026

**Job:** T1, T2, T3, T6 and T9.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `config.ts`, `shell/config.js`, `schema/types.ts`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **127 of 127**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Five closed.** T2 and T3, clock shapes: five now, not two. T9, shorthand: `date_aliases` in config at `a.6`, expanded before anything is looked up. T1, `next friday`: the Friday after the coming one, and `next` leaves the title with the day it governs. T6, the swallowed comma: trailing punctuation is not part of an expression, so `pay a tomorrow, b` is two payments again.

**Six cases added,** B33 to B37 and C10, so every shape now read has a row that would catch it going away.

**Found while fixing T4 and T5, which are still open:** both currently resolve by string length. `call kushan friday tomorrow` takes `tomorrow` because the lexicon is searched longest phrase first, and `by after friday` takes `after` for the same reason. Neither is a rule; both are an accident of how the search is ordered.

**Save point:** `stage 5, 127 of 127, key at 129 cases; T4 T5 T7 T8 T14 open`

**Next job:** T4, T5, T7, T8, T14, once the four decisions are made.

---

## Session 71 — 5 August 2026

**Job:** T4, T5, T7, and a decision on T8.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **133 of 133**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Worse than T4 and T5 said.** Both contests were decided by word length, so `tomorrow friday` and `friday tomorrow` both took `tomorrow`, and `by after friday` and `after by friday` both took `after`. Reversing the words changed nothing: the engine was reading no order at all. The first typed wins now, with a longer phrase still beating a shorter one that starts in the same place.

**The loser leaves the title too.** A second date is the person correcting themselves; leaving it behind puts a date on the card the record does not hold. A second marker left behind is a stranded preposition.

**T7:** a bare clock time that has gone means the next one. `at 10AM` at 10:40 is tomorrow at ten. Only a bare one: `1 aug at 5pm` names a day and a named day is never moved, which is the guard that keeps a missed deadline from being swallowed.

**T8 kept, not fixed.** `go to office` stays a five-minute `other`. The lexicon should grow against real captures rather than one verb at a time.

**Six cases added,** B38 to B43, including both word orders of each contest and the guard on the roll.

**Save point:** `stage 5, 133 of 133, key at 135 cases; T14 open, row actions parked`

**Next job:** T14, then his backlog list.

---

## Session 72 — 5 August 2026

**Job:** Run the answer key against the outside parser.

**Stage before / after:** 5 / 5

**Files changed:** `spec.md`, `sessions.md`, `log.manifest`. No engine change.

**Tests:** unchanged and green. `gate4.mjs` 133 of 133.

**The result:** 47 of 133 as shipped, 69 once our vocabulary replaced its placeholder one, 78 once `context` is set aside because the two derive it from different things — theirs reads the nouns in the line, ours reads the verb. 55 disagree.

**What disagrees, and why none of it is a defect in either engine:** `1 aug` resolves to 2027 under chrono's `forwardDate`, which is B24 exactly. `by friday` lands at 18:29 rather than 23:59:59. `someday` is not a date word to it, so the whole phrase stays in the title. A weekend is a week. `after 5pm` is a point rather than a start. A comma list is never summed. Every one is a decision this project made and wrote down; a library that has not made them is silent rather than wrong.

**What it does better, and would still do better after any merge:** lemma lookup, so `replied` reaches `reply` without an entry per inflection. Two-word verbs. Weak-marker adjacency decided by character offset, so `submit by friday` fires and `order caps by courier` does not. Date shapes we have no parser for. And `tmrw` natively, which we added a config table for yesterday.

**Save point:** `stage 5, 133 of 133; outside parser measured at 78 of 133; nothing merged`

**Next job:** Decide what to harvest, on the evidence rather than on the README.

---

## Session 73 — 5 August 2026

**Job:** Harvest word endings and marker adjacency from the outside parser.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `config.ts`, `shell/config.js`, `schema/types.ts`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **139 of 139**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The model was agreed to and then not needed.** Endings are spelling and became a dozen lines of code; irregular forms are vocabulary and became a config table beside the date shorthand. `replied`, `paid`, `sent`, `booked`, `calling`, `submitting`, `files` all reach their verb now, and `follow up` works, which one token at a time could never express. The model stays on the LATER LIST, to be measured against the key rather than argued about.

**Marker adjacency, his rule.** A weak, start or point marker counts only when the date starts right after it. `pay by cheque` is not a deadline; `pay by cheque friday` is due Friday with `by` still in the title; `by next friday` counts because `next` is part of the date. A strong marker is exempt, which the first draft broke and A23 caught.

**Three rows changed, each asked first.** B19's `after` is no longer a marker. B40 and B41 now state adjacency rather than order, because two markers can never both touch the date, so the order rule they were written for cannot fire on them. Order still decides between two dates.

**Six cases added,** A28 to A33.

**Save point:** `stage 5, 139 of 139, key at 141 cases; T14 open, row actions parked, model on the later list`

**Next job:** T14, or his backlog list.

---

## Session 74 — 5 August 2026

**Job:** Ship the language model, read last.

**Stage before / after:** 5 / 5

**Files changed:** `shell/lemma.js` (new), `shell/resolve.js`, `schema/contract.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **139 of 139**, unchanged. `gate4.mjs --placeholder` passes the Stage 4 reading.

**Measured before shipping.** Thirty-six inflected lines: the rules alone reached 30, the rules with the model reached 30, and there was no line only the model reached. On six of them the rules beat it, because it lemmatises `spoke` to `speak` and `speak` is not one of the eighteen verbs while the irregulars table maps `spoke` straight to `talk`.

**Shipped anyway, and read last.** The lexicon, then `verb_irregulars`, then the spelling rules, then the model. Last is what makes it safe: it can add a word the first three miss and can never change one they reach. No answer moved and every case stayed green, which is the only reason a dependency that changes nothing today is defensible.

**Bundled once, committed, no build step.** 3.6 MB at `shell/lemma.js`, MIT. The shell serves it as a static file and the gate imports the same one, so there is one artefact rather than two that drift. The rebuild command is written at the top of the file.

**What it does not fix.** `handed over the ledger`, `acknowledged the mail`, `dispatching the panels` still read `other`. The model gets every ending right and still fails, because `hand`, `acknowledge` and `dispatch` are in no lexicon. The gap is vocabulary, and vocabulary is a config list.

**Save point:** `stage 5, 139 of 139, model shipped and read last; gates 2, 4 and 5 all waiting on a hand`

**Next job:** Gate 2 on contract 27, Gate 4 on key 24, then Gate 5.

---

## Session 75 — 5 August 2026

**Job:** The record keeps where a chip's words sit.

**Stage before / after:** 5 / 5

**Files changed:** `spec/example.md`, `schema/contract.md`, `schema/types.ts`, `shell/resolve.js`, `shell/app.js`, `shell/config.js`, `gate4.mjs`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **139 of 139**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**His point, and it was right.** The chip decision said a date arrives one way, and I had treated that as settling provenance too. It does not: recording how the words got there is not a second way for them to arrive. `chip_spans` is a list of character ranges, handed in and stored unread, and the engine returns an identical record without it, which was checked rather than asserted.

**The screen keeps the ranges as the line is edited.** Only the screen saw the edits, and the whole value of the field is what it says after one: tapped `This afternoon`, read the card, changed the words. A range that no longer covers what was tapped is the answer to that question, not a fault in it.

**Found while adding it:** `gate4.mjs` compared a list by turning it into text, and `String([])` is the empty string, which the runner reads as "the engine returned nothing". An empty list agreed with everything. Four list-valued fields in the contract were uncheckable.

**Stated on every row of section E,** not only the one with a chip, because a field written where nothing was tapped is the defect this field can have.

**Save point:** `stage 5, 139 of 139; chip provenance in; gates 1, 2, 4 and 5 all waiting on a hand`

**Next job:** Gate 1 on example 32, Gate 2 on contract 28, Gate 4 on key 25, then Gate 5.

---

## Session 76 — 5 August 2026

**Job:** A task carrying any date is in Default.

**Stage before / after:** 5 / 5

**Files changed:** `spec/example.md`, `schema/contract.md`, `shell/resolve.js`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **139 of 139**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**His reading of the key found it.** `after friday` sat in Ideas because the list read `due_at` alone, and a task with a day attached is not an idea. Exactly three rows had a date and sat in Ideas: B7, B17 and B40. Every other Ideas row carries no date at all, which is B18, B19, B20 and the whole of section A.

**Where they rank.** All three carry no `deadline_band`, so they sort below everything with a deadline. That is where a task you cannot start until Friday belongs, rather than out of the list.

**What it exposed, and was not fixed here:** those three now draw a card with a title and no sentence, because `due_phrase` reads `due_at` and there is none. `From Friday` is what belongs there. Recorded rather than invented in the session that made it visible.

**Save point:** `stage 5, 139 of 139; gates 1, 2, 4 and 5 all waiting on a hand`

**Next job:** the missing sentence, or the four presses.

---

## Session 77 — 5 August 2026

**Job:** The card says when a task can begin, and a start that has passed still means today.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **140 of 140**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**The blank card is filled.** `From Friday`, `From 5pm`, `From 20 Aug`. `Due` would be a lie on a task with no due date and silence was what those three drew for one session. The forms mirror the due ones exactly so the two sentences cannot drift apart, and a time today says only the time.

**A start does not roll.** `after 5pm` typed at six means today: the person is saying when they can begin and they can already begin, so pushing it to tomorrow takes away a task they could do now. A due date is the opposite and stays: `at 5pm` at six is tomorrow, because a due date in the past is a task born late.

**B44 added,** the same words as B42 an hour apart with the other anchor, so the exception is readable rather than buried in a comment.

**Save point:** `stage 5, 140 of 140, key at 142 cases; gates 1, 2, 4 and 5 all waiting on a hand`

**Next job:** the four presses.

---

## Session 78 — 5 August 2026

**Job:** A tapped date beats a typed one, and a second tap replaces the first.

**Stage before / after:** 5 / 5

**Files changed:** `shell/resolve.js`, `schema/contract.md`, `tests/answer_key.md`, `selftest.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** `gate2.py` passes. `selftest.py` catches 26. `check_render.mjs` matches; `check_loud.mjs` 6 of 6. `gate4.mjs` **142 of 142**. `gate4.mjs --placeholder` passes the Stage 4 reading.

**He asked for the chip's text to leave the line and record separately.** Laid out what that costs: a second way for a date to arrive, no way to edit a chip's words, and `chip_spans` losing the question it was added for. He took the alternative instead: the words stay in the line and a second tap replaces the first.

**Which exposed the real case.** Type `friday`, tap `This afternoon`, and the tap did nothing, because first-date-wins took the typed one. A tapped date beats a typed one now, and the screen clears the chip when the line is edited afterwards. Each half sits where the knowledge is: the engine has `chip_spans`, the screen saw the events.

**E7 and E8 added,** the same words with and without the tap, differing in `chip_spans` and nothing else. Without E8 the tapped case could pass for the wrong reason.

**E8 caught a defect as it was written.** A losing date expression was dropping its own words and leaving its lead word behind, so `friday This afternoon` stranded `This` in the title.

**Save point:** `stage 5, 142 of 142, key at 144 cases; gates 1, 2, 4 and 5 all waiting on a hand`

**Next job:** the four presses.

---

## Session 79 — 14 August 2026

**Job: T14 closed, and this file's claims corrected.**

**All four automated checks were re-run before anything was touched.** `gate2.py` passed, `selftest.py` caught 26 of 26, `gate4.mjs` ran 142 of 144 and every one agreed, `check_render.mjs` matched exactly and `check_loud.mjs` made six deliberate breaks loud. Nothing in the toolchain had drifted. What had drifted was `spec.md`, which claimed all four gates were signed on the current files four lines above the VERSIONS block saying otherwise, and carried four stale run counts, a spliced line and a doubled sentence.

**T14 is closed on section 2's layout.** Chips wrap, then three spaces, the type chip, the fill, the significance buttons and one space inside the border. Section 1's right-aligned variant was never a second layout rule; it was the empty state drawn under a second rule, which is the thing a finished example is not allowed to do. Both panels are redrawn, and the `· · ·` leader is gone from the example, from `render.js` and from `gate2.py`'s template list.

**Redrawing it found the empty screen had never been rendered.** Six presets fit the chip line exactly at the old budget, leaving nothing for the tail below, so `row()` threw. The screen the app opens on threw. No harness could have caught it: `resolve()` refuses an empty line, so `check_render.mjs` can only reach the typed panel, and the empty one is reachable only from a screen that fills `chip_row` and `significance_row` from config without asking the engine. That path is Gate 6's and is now recorded.

**Two contract Example cells disagreed with the rules beside them.** `card_title` showed `Social alpha application deadline`, keeping a marker word the title rule drops, which A23, E3 and H6 all contradict; H6 was corrected at the key's own version 12 and this cell was not. `significance_row` showed `[Low][Normal][High]` with nothing emphasised against a rule that says the current button is emphasised. Both found by reading. `gate2.py` reads those tables for shape and count and never asks whether a cell obeys the rule in the same row.

**What the audit found and did not fix.** The list is a constant: `cards`, `rank_key`, `decided_by`, `group_header` and `result_row` are literals in `shell/resolve.js`, and the answer key names none of them, so everything the screen draws below the input box is unverified. `existing_tasks` is empty on every call the shell makes. Ranking is nine names in config and a direction table in the example, with no contract rule and no code. Search has decisions in this file and zero entries in the contract. Gate 3's signature names a shell number that no file states.

**Save point:** `T14 closed; empty panel renders; gates 1, 2, 3, 4 and 5 all waiting on a hand`

**Next job:** the four presses, then the store.

---

**Added after the audit, at his call.** `shell/render.js` states a `SHELL_VERSION` and `gate2.py` reads it into VERSIONS. Gate 3's signature named a shell number no file stated, which made it the one signature whose staleness could not be read: the renderer could drift under a signed gate forever and nothing would say so. It sits in `render.js` because the panel is what the hand checks at Gate 3. A twenty-seventh fixture plants the opposite defect, the shell moving while VERSIONS does not.

---

**T14 was not closed on the second attempt either.** Asked which panels to read at Gate 1, the answer surfaced a third capture row in section 6, drawn a third way: seven spaces either side of the type chip and nothing inside the border. The first pass fixed the two panels that carried the `· · ·` leader and never looked for a panel without one. Corrected to the same rule as the other two.

**The bound-task box was drawn wrong and thirty-four passes read past it.** Its top and bottom rails sat one column right of its own sides and were one column narrow. Every row in the block was 68 characters, so width told nothing and only an eye could have caught it. `gate2.py` now checks that every box in the example closes under the corner it opened at, and a twenty-eighth fixture plants the defect.

---

## Session 80 — 14 August 2026

**Job: the store, and the list drawn from it.**

**Four calls, and everything goes through them.** `shell/store.js` is `all`, `add`, `update`, `remove`, all async, namespaced so the undo entry lives in the same seam as the tasks. One row per record, keyed `cascade:<namespace>:<id>`, because Supabase is Postgres and one JSON blob would have been fewer lines today and a rewrite the day it arrives. Async today for the same reason: a synchronous seam means changing every call site later rather than four function bodies. A browser that refuses storage falls back to memory and says so on the screen, because a session that will not start is worse than one that forgets.

**The four hand-written cards are gone.** `resolve()` returned the same four for every line typed since Stage 3, copied out of the example so the shell had something to draw. The answer key names none of `cards`, `rank_key`, `decided_by`, `group_header` or `result_row`, so forty sessions of green never asked whether they were real. `shell/cards.js` builds them from `existing_tasks`, which was an empty array on every call the shell had ever made.

**The order is a placeholder and says so.** Creation order, one comparator, `rank_key` still empty. The ranking is nine factors in three tiers and it is the next session; nothing else in the file changes when it lands.

**Two defects surfaced the moment the cards stopped being constants.** The panel heading was drawing `list_header`, which answers where the *typed* task will go, so it read `Ideas` above the Default list while a dateless line was half-typed. And `cards.js` first read the open state as `open`, which is not a member of the set: `ready`, `done`, `cancelled`. Every card vanished, which is how the mistake was found within a minute rather than at Gate 6.

**Add, and the actions.** Add creates the task, wipes the box, resets the chips and redraws. The duplicate dialog fires on Add and nowhere else, because live it would appear and vanish under the next keystroke; Cancel leaves the typed text where it is. Each row carries Done, Pin and Delete. Delete removes the row for real, and the undo entry holds the only copy, which is why it is stored rather than held in a variable.

**Owed to the contract, and the reason Gate 2 is open again.** The card's button row is a shown output nothing describes, and `delete` is not a member of `row_action`. The screen draws both already, which is the wrong way round.

**Save point:** `store wired, list real, order is a placeholder; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the ranking.

---

## Session 81 — 14 August 2026

**Job: the ranking, all nine factors.**

**Why it stayed unbuilt for eighty sessions.** The three tiers and every direction were written in `spec/example.md`, in a table, complete and correct, since Stage 1. Two of the orderings that table depends on, the one for `date_precision` and the one for `date_firmness`, existed in no config object: they were prose inside a Direction column. `deadline_bands` and `type_order` had been in config all along, which is why those two factors always looked ready and the other two never were. A rule written where only a person can reach it reads as finished and is not.

**The tiers, in the contract first and then in the code.** Tier 1 is `pinned` then `is_hard`, true before false, and nothing beats them under any mode. Tier 2 is `lexicographic`, which runs tier 3 in order and stops at the first factor that separates two tasks. Tier 3 is the nine. A value a config list does not hold sorts last rather than first, because unknown is not urgent and `indexOf` returning -1 would have made it the most urgent thing on the screen.

**`deadline_band` is recomputed when a stored task is ranked.** It is a working value, not a stored field, so a task read back out of storage carries none. Reading the absent one would have put every task in the same band the first time the page was refreshed, which is the sort of thing that looks like a ranking bug and is a storage bug.

**A trailing clause has to be true of the task carrying it.** `decided_by` names the term that separated a row from the row below, and three of the eleven terms have a sentence written for them. A row separated by `significance` at the default would have read `you marked it Normal`, which is a claim nobody made. The other terms decide the order and say nothing, which is the honest outcome rather than a gap.

**`working.decided_by` is empty on every typed line, and that is right.** It is a property of a position. The line being typed has no position until it is added, so it has no neighbour and nothing has been decided about it. `rank_key` is different: it is the task's own terms, so it is computed and returned.

**What is owed, and it is growing.** Gate 2 is open on three things the screen draws that the contract does not describe: the card's button row, `delete` as a `row_action` member, and `rank_key` and `decided_by` riding on each card. And nothing in the key names `cards`, `rank_key` or `decided_by`, so the nine factors could be reordered tomorrow and every gate would still pass. The order is checked by reading the screen and by nothing else.

**Save point:** `ranking built, nine factors, three tiers; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** Gate 2, then key cases for the order.

---

## Session 82 — 14 August 2026

**Job: live search.**

**Four tiers, and the query is `normalised`.** Exact, then prefix, then a shared word, then fuzzy above `search.fuzzy_threshold`. A task is placed by the highest tier it reaches and never appears twice. Searching on `normalised` rather than on the raw line means a date word typed into the box is never something to look for, and it is the same string the duplicate rule starts from, so one line cannot match on a word the other ignores.

**The fuzzy threshold is its own number, and looser.** 0.5 against `duplicate.threshold`'s 0.6. A result is not a question: a false positive costs nothing, where a false dialog interrupts. That was already the decision; it had no config object until now.

**Only open tasks are searched.** He chose it and it holds up: a done or archived task was put out of the way deliberately, and searching it back into view undoes the reason it was closed. `DONE` stays in the header vocabulary and draws no rows while that holds. A group with nothing in it says `(none)` rather than disappearing, so the panel does not change shape under the cursor halfway through a line.

**Nothing is capped.** A query matching twenty tasks shows twenty and scrolls. A cut list hides the one being looked for and says nothing about having cut it.

**Two placeholders could not hold what search needed.** `group_header` was a single string and `result_row` an array, and three groups do not fit between them. They are one `results` list now, an entry per group, each carrying its own header and its rows, and both names live on as the fields of an entry. That is what a placeholder hides: not that it is wrong, but that its shape was never asked a real question.

**Found by the first real query.** A result row threw out of `row()` because the title and the right-hand half together ran one character past the border. The right half is fixed width now and a long title is cut with an ellipsis: a row that will not fit is a row nobody reads.

**`gate2.py` was reading three interfaces and there are five.** `ResultRow` and `ResultGroup` hold two shown outputs each, so the gate reported four contract entries as having no home in types when what had stopped short was its own reader.

**Save point:** `search live, four tiers, open tasks only; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** tapping the parsed chip to clear the date.

---

## Session 83 — 14 August 2026

**Job: three decisions built together, at his call, to reach something usable.**

**The dateless task was being created and then hidden.** Drawing Default alone meant `Website revamp`, `Ghodiya charger` and `Notes for cascade` vanished on Add. Ten of the twelve real-backlog lines in the answer key carry no date, so an MVP would have swallowed most of what he typed at it. The screen toggles between the two lists now, and both come back on every call: choosing the list with an input would have made the engine answer a question about the screen.

**Ideas is sorted, not ranked, and the reason is worth keeping.** Every ranking factor above `est_duration_min` reads a date. On a list where no task has one, the first six tie on every row and the order falls out of the tie-break, which is an order nobody chose. Duration is the only term that says anything there. That is also why the header offers Duration as a *choice* rather than a rank.

**An Ideas card has no sentence.** `card_reason` is empty, and the badge moves up onto the title line rather than leaving a blank one under it. That is the same emptiness `From Friday` was written to close on the other list, arriving from the other side.

**Editing saves, and carries four things over.** The line is re-resolved into a fresh record; `id`, `created_at`, `pinned` and the task's state come from the old one. Everything the words decide is re-read, because the words are what changed. Saving leaves the bound state, which is one of the three ways out the decision log already named.

**A stated year is taken as stated.** `Pick date` writes a year exactly when the picked date is not in the current one, and the engine could not read one: `20 Aug 2027` resolved to 2026 and left `2027` stranded in the title. A four-digit number directly after a calendar date now belongs to the expression and leaves `title` with it. Past years too: someone who spells out 2025 means 2025.

**Found while writing it up.** `sort_header` is still computed from the typed task's `list_header` rather than from the list on screen, so it appears and disappears with the line being typed instead of with the toggle. The same mistake the panel heading made two sessions ago, in the one place still making it.

**Save point:** `toggle, editing and stated years; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** tapping the parsed chip to clear the date.

---

## Session 84 — 14 August 2026

**Job: the MVP is two screens, and three rules follow.**

**The shape he described.** A list screen: saved tasks in order, each row carrying Done, Delete and Pin, and tapping the task itself opening edit. A `+` opens the capture screen, which holds the box at the top, the tap buttons with it, and the matching tasks underneath, changing as the line is typed. Capture and edit are the same screen.

**That answers a rule rather than breaking one.** The decision log restricted binding to a tapped search result because every other path risked editing a task while believing you were capturing. Capture being its own screen answers it directly: on the list screen there is no box to confuse it with.

**`date_spans`, a thirty-ninth `Task` field.** `date_phrase` reported what was read and never where. The parsed-date chip could show `✓ this morning` and the screen had no way to take those words back out of the box when it was tapped, so the whole tap-to-clear decision was unbuildable. Offsets are found by walking the line rather than by adding word lengths: internal spacing survives into `title`, and two spaces would have shifted every offset after them. Words that touch merge, so `20 Aug 2027` is one thing to delete rather than three.

**A search matching nothing draws nothing.** `(none)` was written to stop the panel changing shape under the cursor while the box and the list shared a screen. They no longer do, and two headers over no rows is a panel saying no twice.

**`sort_header` is always returned, and that was the last of the same mistake.** It was computed from the typed task's `list_header`, so it appeared and disappeared with the line being typed instead of with the toggle. Which list is on screen is the screen's question, the same answer the panel heading got two sessions ago and `cards`/`ideas` got one session ago.

**Save point:** `two screens settled, date_spans in; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the empty list, the one decision left.

---

## Session 85 — 14 August 2026

**Job: the last decision, and the MVP written down in one place.**

**An empty list screen shows nothing.** No message, no illustration, no prompt to add a first task. The toggle and the `+` are already on the screen and they say what to do. A sentence explaining an empty list is the app talking about itself, which is what D-1 says the typing is supposed to replace. That is the same answer the empty search got, reached from the other end.

**`MVP.md`.** Every screen, every control, every state, the four search tiers, the nine ranking factors and the sentence forms, on one page. Positions, sizes and colours are deliberately absent: those are Claude Design's. It is written as settled rather than as a proposal, because everything on it was decided one question at a time over the last several sessions and nothing on it is open.

**What is owed, unchanged.** Gate 2 on the card's button row, `delete` and the `+` as actions, and `rank_key` and `decided_by` riding on each card. Then Gates 3, 4 and 5. And nothing in the key names `cards`, `ideas`, `rank_key`, `decided_by` or `results`, so the ranking and the search tiers could both be reordered tomorrow with every gate still green. That is the real hole and it is list-shaped, which no key section is yet.

**Save point:** `MVP decided end to end and written to MVP.md; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 86 — 14 August 2026

**Job: ranking factor 5.**

**It was already in config, which is not the same as being decided.** `type_order` has held all fourteen members since Stage 2 and the ranking has read it since the ranking existed. What it never had was a reason. The order was written once, fitted to nothing, and no case in the key touches it.

**Three things were wrong with it.** `deadline` at position 2 is nearly dead, because a deadline-typed task usually carries `is_hard`, which tier 1 separates before factor 5 runs: this factor only ever sees the soft ones. `waiting` at 9 put an un-doable thing above three types that are at least yours. And `purchase` above `decision` said "quick first" one line before factor 6 says it properly, in minutes.

**Reordered on a stated principle: how much of the task is yours to do right now.** Three members moved. `maintenance` above `habit`, because an obligation beats a choice. `waiting` below `information`, because nothing on it is yours. `project` up one, because it still has a next step you can take.

**Still fitted to nothing, and recorded as such.** The order is arguable now rather than arbitrary, which is a different thing from evidenced. He chose to leave it unpinned by the key, on the same footing as `duplicate.threshold`: pinning a guess makes it harder to correct, and the first week of real captures is the evidence that would move it.

**Save point:** `factor 5 reordered on a principle; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 87 — 14 August 2026

**Job: pushing a task from the list.**

**He corrected a wrong assumption and it resolved the whole problem.** I had said a push that moves the date without rewriting the words would silently snap back on the next edit, because the box refills from `raw_text`. It does not. Once a task is added the typed line is gone from the screen: `title` is what the list draws and what the edit screen draws, and `raw_text` is provenance that is kept and never shown. So a push has no words in view to contradict, and the second way a date can arrive, which this project has refused twice, does not arise at all.

**One rule falls out of that and had to be written.** A title carries no date words by construction, because they left when the task was created. So re-reading an edited title finds no date, and clearing the date on that evidence would destroy it on every edit of every task, pushed or not. An edit that finds no date leaves the date alone. The date chip on the edit screen is what shows the date and the one control that clears it, which is what we had already decided it does.

**Targets come from precision, notes come from load.** A task told at a band is pushed to another band, not to a Tuesday at 09:00: the same rule as `due_phrase`, the finest granularity that is true. Each target says what the day it lands on already holds, because pushing into a fuller day is the mistake the whole control exists to prevent. An overdue task is the exception and pushes to today or tomorrow, since a task already late is not helped by being later.

**Significance is not weighted into the load, and that was a real choice.** A High task does not take longer. What importance decides is *who moves*, and it already does that as ranking factor 2, so the bottom of an overloaded day is already the least important thing on it. Weighting it twice would also have cost the sentence its traceability, which the learning-layer rule in this file demands.

**The load is a sum of guesses and says so.** `est_duration_min` is a default per verb. Eight tasks at thirty minutes is four hours of assumption, so the note reads `6 tasks, roughly 4h` rather than a figure to the minute. `capacity_min_per_day` is 180, fitted to nothing, on the same footing as `duplicate.threshold`.

**`push_count` and `first_due_at`.** The only history a `Task` keeps; everything else in it is a snapshot. A task pushed once met a busy day. A task pushed six times has something wrong with it, and a seventh push will not fix it.

**Save point:** `push built, load-aware; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 88 — 14 August 2026

**Job: tabs, and duration off the screen.**

**The badge is gone entirely.** He asked for the minutes to go, on the grounds that duration is the engine's to reason with. It is: it orders the Ideas list, it is ranking factor 6, and it is what a day's load is made of. With the minutes hidden, a verb on its own explained nothing, so the whole badge went, and `result_row` kept `due_phrase_short` and dropped the rest.

**Three tabs and a toggle, which reverses Stage 1 cleanly.** `Tasks`, `Ideas`, `Done`, with `Today`, `Tomorrow` and `Upcoming` inside the first. Part A has had no tab bar since Stage 1, and the reason recorded then was that a tab nothing fills is a value with no origin. `deadline_band` fills these, and has since the ranking was built. That is what makes this a reversal rather than a change of mind.

**Overdue sits in Today.** A separate place for it means the tab opened first is not the real day.

**Done tasks are reachable again.** The store session put them out of reach of everything on purpose, and a row tapped by mistake had no way home. A Done row is a title alone: `Overdue since Friday` on a finished task describes a deadline that no longer applies, and nothing else was wanted. `undone` brings it back.

**One matcher, two boxes.** The list screen's search filters the tab in place through the same four tiers the capture screen uses, exposed as a single function so the two cannot disagree about what counts as a match. The pools differ, and each is right: open tasks on capture, because a done task is not a duplicate risk, and done ones on the Done tab, because finding something finished is why anyone looks there.

**Recorded and not fixed, at his call.** The Ideas list is sorted by a number no row shows. Newest-first was offered and declined. It is the same shape as the objection that kept tabs out of Part A for eighty sessions, which is why it is written down rather than left to be rediscovered.

**Save point:** `tabs in, duration out; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 89 — 14 August 2026

**Job: the load stops being drawn and starts choosing.**

**He named the principle, which is worth having in one sentence.** A lot of what the app collects exists so the suggestions are better, and the reader never learns it. Four fields are in that class now: `est_duration_min`, `push_count`, `first_due_at`, and the day's load built from the first of them. None appears on any screen.

**So the push buttons lost their notes and gained a job.** `⇢ Tomorrow (3 tasks, full)` was the version that explained itself. It is now `⇢ Next week`, and Tomorrow is simply absent, because that day is already over `capacity_min_per_day`. The load does the same work with nothing to read: it chooses the days rather than annotating them. When every day ahead is full they are all offered anyway, since a press with nowhere to land is worse than a press into a busy day.

**The cost is real and is written down once.** A suggestion whose reason is invisible is a suggestion nobody can correct. When a push target looks wrong there will be nothing on the screen to argue with, and the fitted numbers behind it, `capacity_min_per_day` and the per-verb durations, are guesses that were going to be corrected by being visibly wrong. The LATER LIST's rule that a learning layer must stay traceable now applies to a system that already is not. Taken deliberately, at his call.

**`push_note` leaves the contract.** Shown outputs fall from 27 to 26.

**Save point:** `quiet fields settled; gates 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 90 — 14 August 2026

**Job: two sentences per row, and two pickers.**

**Mobile says less, and `card_reason_short` is what it says.** The trailing clauses come off: `You called this a deadline`, `you marked it high`, `You pinned this`. Each of them explains a position that the position already shows, which is why they were the cheapest thing to lose.

**The overdue lead was the one that cost something.** It is not a trailing clause, it is the lead, and taking it away leaves either nothing or `Due Wednesday` on a task four days late, which is a lie. It collapses to `Overdue`, two syllables, saying the one thing that matters.

**The hedge stays on both.** `Due around Friday` comes from someone typing `maybe friday`. `around` changes what the date means rather than decorating it, so dropping it would not be saying less, it would be saying something else.

**Both sentences come back on every call.** The web app draws one and the mobile app draws the other, and which screen is asking is the screen's question. Same shape as `due_phrase` and `due_phrase_short`, and the fourth time that answer has been the right one.

**`Park` is gone.** It had sat in `chip_presets` since Stage 2 with no rule behind it, marked deferred every time it came up. `Pick time` takes its place beside `Pick date`, and both type what they pick into the box, so a date still arrives one way. The four capture panels in the example are redrawn and Gate 1 reopens.

**Save point:** `mobile sentence and both pickers in; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 91 — 14 August 2026

**Job: repeats, and the type chip stops being a dropdown.**

**Fourteen options in a dropdown was the wrong control and he said so.** The engine already derives one type from the verb, and `verb_to_type` maps a verb to exactly one, so there are no runners-up to offer. Alternates would have to come from a new table with no evidence behind it. `type_suggestions` is a fixed three, `deadline` `action` `appointment`, shown beside the derived one, and the other eleven sit behind a small button. A fixed short list is honest where a guessed one is not.

**`recurrence` has a shape after sitting empty since Stage 2.** An interval and nothing more.

**Marking a repeat done spawns the next occurrence, and only then.** Rolling one record forward was the alternative and it breaks two things already built. A weekly task done thirty times would show zero times in Done, because nothing ever closes. And `push_count` and `first_due_at` would accumulate across occurrences until the drift they measure stopped meaning anything: "pushed six times" is a fact about one occurrence or it is nothing. Spawning on close rather than on schedule also means there is never more than one open occurrence, so three weeks late on a weekly task is one row and not three.

**The next date counts from the schedule.** Rent due the 1st and paid the 4th is next due the 1st. The schedule is stepped from the occurrence just closed until it lands in the future, which keeps the anchor. Stepping from `now` would move that anchor every time the task was done late, and a monthly reminder would walk down the calendar.

**A push moves one occurrence and leaves the series alone.** One busy month must not shift a monthly reminder permanently.

**`spawned_from` is what makes Undone safe.** Undoing a done takes back what the done created. Without it the press leaves two rows, the one that came back and the one that was made, and nothing on screen explains the second.

**Save point:** `repeats and the advanced panel in; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** the screen, from `MVP.md`.

---

## Session 92 — 14 August 2026

**Job: Supabase.**

**The seam held.** `store.js` was built two weeks of sessions ago as four async calls so that this day would be four function bodies. It was. `store.supabase.js` is the same four names and nothing above it changes.

**Instants are stored twice, and this was the decision worth making slowly.** The contract holds ISO local-with-offset, and `deadline_band` reads the same calendar day *in the user's zone*. `timestamptz` alone keeps the moment and drops the offset, so the instant survives and the day boundary moves. Each instant is a `timestamptz` beside an offset column, split on write and rejoined on read inside the store, so no caller ever sees a half-translated record. Proved on three offsets including a negative one.

**Nothing in the record said who owned it.** Forty-two fields and not one of them a user. `owner` plus row-level security, with a policy per verb rather than one for all: widening read access later must not widen write access by accident.

**`config_version` is evidence now.** It has been on every record since Stage 2, pointing at a config living only in the app bundle, so a row saying `a.13` could not be checked against anything once a.14 shipped. The config is written to its own table the first time it is used.

**The gate caught the thing this session was most likely to get wrong.** Marking the 4 August `config_version` deviation as expired, by editing that entry, was rejected: the decision log is append-only and `gate2.py` counts sealed entries. The sealed line is untouched and the expiry is a new one. That deviation named its own price when it was written, a Stage 1 rewrite and a Gate 1 press per config bump, and the price is now payable: `spec/example.md` stamps the live config.

**A second deviation, recorded rather than taken quietly.** Storage is Stage 7 and Stage 6 has not happened, because the screen is being drawn from `MVP.md` in a design tool rather than here. The risk is that the stage which checks a drawn screen against the example arrives after the data it draws is already persisted.

**Save point:** `schema and Supabase store written; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** point the shell at it behind a flag.

---

## Session 93 — 14 August 2026

**Job: clashes, alarm variables, per-account numbers.**

**Two timed tasks clash when their windows overlap.** His call, over the alternative of clashing on stated times alone. The window is `due_at` plus `est_duration_min`, which means the check runs on a per-verb default rather than a measurement: `call kushan at 5pm` and `meet supplier at 5:15pm` collide only because `call` is assumed to take fifteen minutes and nobody said so. Recorded in FOUND, NOT FIXED, because the first false warning will look like a bug and will not be one.

**The two decisions collide in the wording.** Duration is a quiet field, so a warning computed from duration may not state what it was computed from. `"meet supplier" is at 5pm.` No minutes, no overlap length. A sentence that cannot show its working is what this pair produces together, and writing it down now is cheaper than rediscovering it the first time a warning looks wrong.

**Only a `point` anchor occupies a slot.** An `end` anchor is 23:59:59, a deadline rather than a booking. Reading one as occupied would have made every task due today clash with every other, which is the failure this check would have shipped with.

**Windows are half-open here too,** so back to back is not a collision. That is the fourth place that rule has paid for itself.

**The alarm fields move house.** `alarm_type`, `alarm_lead_min` and `alarm_repeat_min` have said "always empty in Part A" since Stage 2. They are set in the advanced panel now, and Part A still fires nothing: a browser cannot wake itself, so the scheduler and the push that would make an alarm sound stay in Part B. Recording the request and firing it are different pieces of work and only one of them is here.

**Personal numbers leave config for an account.** Three hours is what a full day feels like *to him*, and 0.6 is how alike is too alike *to him*. A second account was about to inherit both. Config holds the value an account starts from and `cascade_settings` overrides it, so an account with no row still works and signing up is not a form to fill in before the app does anything.

**Save point:** `clash, alarm variables and account settings in; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** point the shell at Supabase behind a flag.

---

## Session 94 — 14 August 2026

**Job: what an alarm says, and when.**

**One lead for everything, changed per task.** A table keyed by `commitment_type` was offered — appointments needing getting-there time, deadlines needing at least their own duration — and declined. He is right that it would have been another list fitted to nothing, joining `type_order`, `capacity_min_per_day` and `duplicate.threshold`. A number the person can move is more honest than a guess dressed as a rule.

**What that costs is written down once.** Fifteen minutes is short for a job that takes thirty: being told at 4:45 about a half-hour thing due at 5 is being told too late to start it. The app cannot say so, because duration is a quiet field and the warning would have to name the minutes. Moving the number is the answer and the person has to know to move it.

**An alarm needs a stated time, and this is a limit rather than a gap.** A task due `Friday` resolves to 23:59:59, so a lead from that instant rings at a quarter to midnight, which is not a reminder about Friday. The fix would be a second rule inventing a time of day nobody gave, which is what this project refuses everywhere else: the chip rule, the year rule, the push rule all say the same thing. Recorded and not worked around.

**A notification is the smallest screen there is,** so it draws `card_reason_short`. That output existed four sessions before anything needed it twice.

**Push and Snooze are kept apart.** One moves the task, the other moves the telling. `Snooze` carries its own number because it is the only action whose effect cannot be read off its own label.

**`alarm_at` is derived and never stored,** like every other working value. A stored one would go stale the first time the lead changed.

**Save point:** `alarm content and timing settled; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** point the shell at Supabase behind a flag.

---

## Session 95 — 14 August 2026

**Job: the per-type lead table, with every value the same.**

**He put the shape in and left the numbers out, which is a better move than either of the two we argued about.** I wanted a table with fitted numbers; he declined it as another guess. This is the third thing: fourteen entries, all fifteen minutes, so nothing is claimed and the structure exists.

**What that buys.** A correction later is a number change rather than a structural one, and nothing is recorded as evidence that is only a guess. That is the opposite of how `type_order`, `capacity_min_per_day` and `duplicate.threshold` arrived: each shipped with a fitted number and each has been carrying a caveat in FOUND, NOT FIXED ever since. This one carries no caveat because it asserts nothing.

**And what it costs, stated in the contract rather than left to be found.** While every value is equal the table changes no behaviour. A config object now exists that no case could distinguish from its absence: if the whole thing were deleted, nothing in the key would notice. That is the honest state of it.

**The lead is read three ways in order:** `alarm_lead_min`, then `alarm_lead_by_type[commitment_type]`, then `alarm_defaults.lead_min`. The per-task override still wins, which is what he asked for two sessions ago and is unchanged.

**The argument for pulling the numbers apart is written down where the table lives,** so whoever moves them first does not have to reconstruct it: an appointment's lead is about getting there, a deadline's is about having time to do the thing, and a deadline told with less warning than the job takes is an announcement rather than a warning.

**Save point:** `lead table in, all values equal; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** point the shell at Supabase behind a flag.

---

## Session 96 — 14 August 2026

**Job: accounts and sync.**

**The account is the sync.** No pairing, no device list, no share code. Signing in on a second device is the whole of it, and there is nothing else to explain to anyone.

**Email and password rather than a magic link.** A magic link makes every sign-in wait on an email arriving, and D-1 says typing the thought is the work. The cost is a password to remember, which is what the reset flow is for.

**Confirmation is on, and that is what makes a reset possible at all.** An address typed wrong at sign-up is an account that can never be recovered, because the only way back in is a mail to that same address. Confirming first turns a locked account into a sign-up that did not finish.

**A reset is two halves that happen days apart.** `requestReset` sends the link; the click comes back carrying a recovery session and `setPassword` spends it. The gate reads the URL at boot and opens on the password screen, because a person who clicked "forgot my password" and lands on a sign-in form has been asked the one question they already said they cannot answer.

**The reset form says the same words whichever address is typed.** An error that distinguishes a known address from an unknown one turns the form into a way of asking who has an account here.

**Local first, always.** `all` answers from the cache and never waits on a network. A write lands locally before it is sent, so the list redraws at the speed of the machine and a lost connection changes nothing about what typing feels like. What a connection changes is when the other device finds out.

**The outbox holds actions, never a flag on a Task.** A record written to Postgres from this device is byte-identical to one written from any other. No sync bookkeeping reached the contract's shape, which is the same reason `alarm_at` is derived and the load is a quiet field.

**Newest wins, and Postgres decides.** A trigger drops an update whose `updated_at` is older than the row's. It went there rather than into a `where` clause because a client is one bug away from forgetting the comparison and the database is not. This is the third rule to move into the schema for that reason, after the cross-field invariants and RLS.

**Absence is the tombstone, so there is no fourth table.** A pull fetches every row and deletes anything the cache holds that the server does not, minus what is still queued here. A task deleted on the laptop disappears from the phone because it stopped being in the answer.

**Undo stopped syncing, which reverses session 92.** The undo entry is the previous state of a task on the device that changed it. It has to work with the aeroplane mode on, which a row fetched over a network cannot, and syncing it would mean pressing Undo on a phone to reverse something done on a laptop an hour ago. `cascade_undo` stays in the schema; the shell stops writing to it. Reversible, and written down so it is a decision rather than a drift.

**A defect found by using it rather than by reading it.** `cascade_config` had a read policy and no insert policy, and `ensureConfig()` has been writing into a table that refused it since session 92. Every stamp written since would have pointed at nothing. Fixed with an insert policy and no update or delete policy, so a version's body is write-once and `a.15` means the a.15 that shipped.

**Realtime is the fast path and never the only one.** A dropped socket is silent, so reconnect, tab focus and one minute each pull. A task that never arrived is otherwise indistinguishable from a task that was never made.

**Signing out empties the cache.** One account's tasks are on this machine and the next person to sign in on it is not necessarily the same person.

**The shell now boots through a gate.** `boot.js` decides between the gate and the app; `app.js` changed by one import line, one status line and one event listener. Three stores answer to the same four calls and nothing above them can tell which one it got, which is what the seam was built for eighteen sessions ago.

**Save point:** `accounts and sync built; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** Gate 6 — the screen, against MVP.md.

---

## Session 97 — 14 August 2026

**Job: undo, against newest-wins.**

**The defect I reported was not the defect.** I said the trigger silently reverted an undo of a done, a push or a pin, because the restored record carries its old `updated_at`. The undo path was a delete followed by an add, so the trigger — `before update` — never saw it, and the restore landed. The reasoning was sound and the premise was wrong, which is worse than being wrong outright: it was checkable and I did not check it.

**There was a real defect underneath, and it is the delete-then-add itself.** Two writes for what is one change. The pair is not atomic, so a connection lost between them leaves the task gone from the server with its return sitting in a queue. And every other device sees an ordinary edit arrive as a delete and then an insert, which is not what happened.

**So restoring is now an update when the task is still there and an add when it is not.** The delete-then-add was only ever right for the delete.

**The restored record takes a fresh `updated_at`, which reverses what session 92's schema said.** Undo is a change made now, a press a moment ago, and under newest-wins a change made now is the one that stands. The old stamp would have been refused by the trigger, silently, on any task another device had touched since — the defect I reported, arriving by the path I did not look at. `prior_state` is still a whole record; this is the one field of it that is not restored.

**What that costs.** `updated_at` is the ninth ranking factor, most recently touched first, so an undone task moves to the top of its ties rather than back to where it sat. That reads as correct — it was just touched — but it is a change to a position, recorded here rather than discovered later.

**Save point:** `undo settled against newest-wins; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** Gate 6 — the screen, against MVP.md.

---

## Session 98 — 14 August 2026

**Job: screen 1, the list.**

**Two things had to exist before a screen could be drawn at all, and neither was visible until one was tried.**

**A card carried no id.** The harness matched a card back to its task by title, which two tasks are allowed to share, and a row is a thing to press: every press has to name the task it lands on. `card_id` is the thirty-third rendered output. Nothing in the answer key names a card, which is why a card missing the one field a screen needs survived seventeen sessions.

**`resolve()` refuses an empty line, and the list screen opens on one.** Correctly refuses: there is no capture in an empty box. But the lists are not a capture. They are what is already stored, and they exist whether or not anything is being typed. The opening screen had nothing to draw and the only way out was to hand the engine a line nobody wrote. `listOnly()` returns the three lists from the stored tasks, and `resolve()` calls it too, so one pass builds the cards for both callers and the list on screen 1 cannot disagree with the list under the capture box. That is the fifth time the answer has been to share a function rather than a description.

**The screen is new files beside the harness, not instead of it.** `index.html` draws every field and is what `check_render` pins character for character; `mvp.html` draws what a person sees. Deleting the harness would cost two checks to save a file.

**The design, and the one thing reversed while building it.** A row is a title and a sentence, and it also carries five things to press. The actions were hidden until hover, which enforced the sentence beautifully on a laptop and put every control out of reach of a thumb. They are typographically subordinate instead: mono, uppercase, small, low contrast, gaining contrast when addressed. The row still reads as two lines and answers to a finger.

**One colour, three jobs:** the focus ring, the tab you are on, and a pin. Nothing else in the app is coloured, so a colour anywhere means a state. The tab you are on is marked by its own type going heavier and larger rather than by an underline, so state is carried once.

**Both sentences come back and the screen picks,** on a 600px query, live. `card_reason_short` on a phone. That output existed eight sessions before anything drew it twice.

**Nothing on a row shows a duration, a push count, or a day's load.** The push targets they choose are on the row; the numbers behind them are not.

**With nothing stored the screen shows nothing.** No message, no illustration, no prompt.

**What is not built.** Screen 2. Tapping a row says so rather than doing nothing, because a control that swallows a press reads as broken. Tasks are still added from the harness, and both screens read the same store.

**Save point:** `screen 1 built against MVP.md; gates 1, 2, 3, 4 and 5 waiting on a hand`

**Next job:** screen 2 — capture and edit.

---
## Session 99 — 14 August 2026

**Job: screen 2, capture and edit.**

**One box at the top, the tap buttons with it, the matching tasks below.** The same screen for both jobs, reached empty by `+` or with a task loaded by tapping a row. Everything re-reads on every keystroke: the date, the type, the matches. A date arrives one way, through the words in the box — all four preset chips and both pickers type words, and nothing on the screen sets a date field.

**The box is built once and never redrawn.** Everything around it repaints on every keystroke. Replacing a focused input mid-word loses the caret on a laptop and dismisses the keyboard on a phone, and this is a screen whose whole job is being typed into.

**Three things `MVP.md` specified and nothing drew are drawn.** One dialog carrying either or both warnings, the undo toast, and the clash warning in all three of the places it fires. The third is a push, which happens on screen 1, which is why the dialog is its own file rather than a function inside screen 2.

**Three defects were found by running it, and none of them by any gate.**

**The date chip vanished the moment a task was loaded.** A title carries no date words — they left the line when the task was made — so re-reading one finds no date and the chip had nothing to draw. `MVP.md` says the chip is what shows the date *and* what clears it, so a loaded task had neither. It reads the stored task's card instead, and tapping it on a loaded task drops the stored date rather than removing words. What that costs is written down: the card is the mobile sentence, so an overdue task's chip reads `overdue` where a typed one would read `since Wednesday`.

**The task being edited was offered as a match to open.** It is an exact match for its own title, and a row that reloads what is already loaded is a row that goes nowhere.

**Marking a repeat done early spawned the next occurrence on the same date.** The loop in `nextDue` stepped only while the date was still in the past, so a monthly rent due the 1st and paid the 28th took no step at all and left two open rows for one commitment. The next occurrence is the next one. The answer key names no repeat case, which is why five green checks had nothing to say about it.

**A fourth defect was found by reading rather than running, and it is older.** Loading a task for editing re-derived its type and its significance from the title, so every save quietly reset a tapped `deadline` back to a derived `action` and a High back to Normal. The words that implied them were consumed on capture; there is nothing left in the title to re-read. Both are loaded back now.

**`AlarmType` was declared twice.** Session 93 inserted the widened union at the top of `types.ts` instead of replacing the old `"none"`, and `tsc --strict` has been failing with two `TS2300` errors ever since while `spec.md` said it compiled clean. Fixed, and the gap behind it recorded: five commands run before and after every change and none of them is the compiler.

**`MVP.md` said two things about the day load.** The control table said each push button says what the target day holds; nine lines later the same page says the app says none of it. Session 89 settled that and the table cell was a leftover. Screen 1 had followed the prose; the Claude Design files followed the table, and print the load, the full-day threshold and the per-verb duration defaults it is summed from.

**Six new files, and two of them exist only because two copies of one function is how disagreement starts.** `mvp.clock.js` was written on screen 1 and copied into screen 2 the same day. `mvp.paint.js` is `el` and `button`, which were in four files. `mvp.words.js` holds the chip arithmetic as pure functions, `mvp.panel.js` the advanced panel, `mvp.dialog.js` the one dialog, and `mvp.edit.css` the styles — the last three left `mvp.edit.js` to keep it under the cap.

**`Tomorrow AM` is left broken on purpose.** It is a chip preset, a chip types its label, and `AM` strands in the title. Underneath it, a band word after a day word is consumed and then ignored, so `tomorrow morning` and `friday morning` resolve to the bare day. Both ways out are his and both cost more than a screen session: editing `chip_presets` bumps config, and a config bump buys a Stage 1 rewrite and a Gate 1 press. Written into TYPED, AND WRONG as T15.

**Save point:** `screen 2 built; gates 1, 2, 3, 4 and 5 waiting on a hand, and Gate 6 now with them`

**Next job:** T15, or Gate 6.

---
## Session 100 — 14 August 2026

**Job: a band word touching a named day narrows it.**

**`tomorrow morning` was two hits and one answer.** The day won on position, the band's word left the title having changed no field, and the record came out identical to a bare `tomorrow`: a whole day, nine in the morning to midnight, midpoint half past four. The same for `tomorrow evening`, `tomorrow night`, `friday morning`. `this morning` worked the whole time, because the band was alone and nothing was competing with it. Found by trying to make a chip type its own label, which is the fourth time a rule has turned out to be missing the moment something real had to use it.

**Adjacency decides, which is the rule the two markers already use.** Only a band starting where the day ends belongs to it, so `tomorrow call about the evening slot` is one date and not a task for tomorrow evening. That is the same test, in the same file, for the third pair of things that can be beside each other.

**A named day carrying a band does not roll.** A bare band that has ended is the same band tomorrow — the third arm of the band rule, B25. A band on a day the person named is not, because the day was named, and a named day or date in the past stays in the past. `today morning` at two in the afternoon is an overdue task, which is what the day rule said before the band was attached to it.

**A calendar date can take a band over from the lexicon.** `20 Aug morning` had `morning` winning on position, so the date was never looked for at all: the branch that reads a spelled-out date runs only when the lexicon found nothing. `20 Aug` sat in the title of a task due this morning. A band is the one kind a date is allowed to displace, because the band is what the date is being narrowed by, and only where the two are touching.

**The sentence says the band only where the day was named, and the key is what settled that.** The first version read the finest granularity that was true and made B25 read `Due tomorrow morning` for a bare `morning` typed at two. It is true and it is not what was asked: nobody said tomorrow, the roll is the engine's own answer, and reporting it as though it were typed claims a word the person did not use. The discriminator is the phrase with `this`, `on` and `next` taken off — if what is left is the band alone, the band was the whole expression. 142 of 142 again.

**The 4 August deviation expired in `spec.md` and never in `gate2.py`.** It named its own price: a Stage 1 rewrite and a Gate 1 press for every config bump once records were being stored. Session 92 declared it payable. Nothing ever charged it. `spec/example.md` stamped `a.13` through a.14 and a.15, the gate exempted that file by name, and the stamp sits inside a table cell, which the gate skips anyway on the grounds that a config version in an Example column is illustrative. This one is the stamp. The example reads the live config now and the gate reads it by name, proven by putting `a.13` back and watching it fail. A rule written where only a person can reach it reads as finished and is not, and that is the third time this project has written that sentence.

**What is left of T15 is the label, and its price is measured now rather than guessed.** `Tomorrow AM` still strands `AM`, because `am` is not a date word. Relabelling it to `Tomorrow morning` bumps config, and four capture panels in the example draw the chip row: the second and the fourth have one trailing space, so the row re-wraps and the panel changes shape, and `check_render` pins the first of them character for character. That is the Stage 1 rewrite the deviation predicted, arriving on schedule. The cheaper alternative is still open and still his: `am` and `pm` as band words, which keeps the label and puts `5 pm` in the way of it.

**Save point:** `day plus band narrows; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** the `Tomorrow AM` label, or Gate 6.

---
## Session 101 — 14 August 2026

**Job: the app has its own address and goes on a home screen.**

**It lives at the root.** `shell/mvp.html` is gone; `index.html` is the app. The Stage 3 harness keeps `/shell/` and everything `check_render` pins, which was the point of building the screen beside it rather than instead of it. Two copies of the way in is the shape every duplicate defect in this project has had, and there is one now.

**The worker is network first, and that is the decision worth writing down.** The usual advice is cache first, because it is faster. It is the wrong trade here. A cache-first worker keeps serving a version of the app that is no longer in the repository, on someone else's phone, with nothing on screen saying so. That is exactly the defect of sessions 96 and 98 — a browser serving a module from cache, which read as a fix that did not work rather than a file that was never fetched — made permanent and put out of reach. Every cold start waits on the network instead. Slow and correct beats fast and lying.

**It is written to evict its predecessor, because there was one.** A dead Cascade sat at this address for three weeks with its own cache-first worker installed, including on his phone. `skipWaiting` and `clients.claim` take over on first sight rather than waiting for every tab to close, and activation drops every cache this file did not make. The dead worker was also deleted from the repository first, on its own commit, so that a browser checking for an update got a 404 and discarded it. Order mattered more than content there.

**No pre-cache list.** The app is a few dozen small modules whose names change as it is built, and a list of them in the worker would be a second inventory to keep in step with the first. What is cached is what has been fetched. The cost is that the very first visit must be online, which it always was going to be.

**Supabase is not cached.** The store has its own answer for being offline, a local cache and an outbox, and a stale reply served from the worker would be a second answer disagreeing with it. Proved by taking the network away and cold-starting: the app opened, the list was right, and a task typed with no connection landed.

**`tsc --strict` runs inside `gate2.py` now.** It was the one artefact in the project with no check under it, which is how `AlarmType` came to be declared twice and stay that way for five sessions while `spec.md` said the contract compiled clean. A missing compiler fails the gate rather than skipping: a check that says nothing when its tool is absent reads as a tooling problem and hides an untested gate, and that has happened here four times. Proved by putting the second declaration back and watching the gate name both lines.

**Save point:** `live at its own address, installable; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** the `Tomorrow morning` rename.

---
## Session 102 — 17 August 2026

**Job: the four controls a tap-only capture could not reach, and the label that stranded a word.**

**Whatever a person can set while capturing is an input.** `duration_tap`, `firmness_tap` and `notes_text` go into `CaptureInput` beside the two taps that were already there, so `resolve()` returns one complete record. The alternative was three more lines in the save's patch beside the nine it already carries, and every one of those is another place a value can be written from and another pair that can silently disagree. The rule is in the contract now rather than in a habit: if a person can set it while capturing it is an input; if it exists only because the task already existed, the save patches it.

**A tapped duration outranks the verb's default and a comma list's sum.** `call` was fifteen minutes because the lexicon says so, and nothing had ever measured it. The clash window, the day load that chooses which push targets are offered, and the whole order of the Ideas list are sums of that guess. `duration_source` reads `selected` when the box was touched, which makes `summed` unreachable on any such line — correct, and it narrows where that value is ever seen.

**A tapped firmness reaches ranking tier one, which no tap-only capture could.** `is_hard` follows `date_firmness` and the only way to set it was to type `deadline`, `by Friday`, `no later than`. Six chips and a picker could not make a task hard. The row carries an `auto` position that clears the tap, because a tap with no way back makes the marker words unreachable for the rest of that task's life. `auto` and `normal` look identical on screen today, since the words usually say normal anyway.

**Notes are read and never matched.** `notes_text` does not enter `normalised`, so a note reaches neither search nor the duplicate warning. This is the one decision in the session that gets more expensive the longer it waits: stored records are never rewritten, so notes feeding `normalised` in some later session would leave every task captured before that day unsearchable by its own note for ever, which is a permanent split in what one field means. Not being able to find a note by its contents is the cheaper half to change later, so that is the half left open.

**`Tomorrow morning` and the end of T15.** The band-on-a-named-day rule built in session 100 consumes the whole label, so nothing strands in the title. It cost precisely what the 4 August deviation predicted: a config bump, four capture panels in `spec/example.md` redrawn by hand, and `check_render` red until they were. `am`/`pm` as band words was the cheaper alternative and is not needed.

**Two defects, both found by making the change rather than by reading it.**

**`check_render` was counting.** It took five lines from one below the typed line, which was exact while the chip row was two lines and wrong the moment a longer label wrapped it to three: it then compared a correct panel against a window one row lower and reported every line as a difference. That reads as five defects in the renderer. It finds its window now, from the box down to the panel's closing rule, so a chip row is free to grow. This is the fifth time a check has been pinned to a number that later moved.

**`keepDate` carried the stored firmness back over a tapped one.** A title carries no date words, so every edit of every stored task lands in that branch. The new control would have worked once and then been quietly undone on save, on the one screen it lives on.

**`mvp.edit.js` crossed the 400-line cap and the date chip row left as `shell/mvp.chips.js`.** The right seam rather than the convenient one: every control in that file does the same single thing, which is put words in the box. `mvp.panel.js` grew from 86 lines to 188 and now holds everything that corrects what the typing said — type, duration, firmness, repeat, alarm, lead, ring-again, notes — in the order a person reads them.

**Recorded and not built: the whole of the workflow.** Settled this session in full and written into `spec.md` under DECIDED, NOT BUILT, because a decision that lives only in a conversation reads as finished and is not. One table and no `cascade_edge`; `waits_for` as `jsonb` with `kind` per dependency so `if` and `else` are expressible; `delay_min` from the start, which is what a TIMER operator would have been; LOOP is `recurrence`, which already existed. An undeclared cycle is refused at save and a declared loop is legal, which is what separates a broken graph from a chase that runs three times. A blocked task disappears. `blocker_ref` stops being the authority, because one `Uuid` cannot hold three upstreams.

**Save point:** `duration, firmness, notes and the alarm interval on screen 2; T15 closed; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** the workflow migration, or the export.

---
## Session 103 — 17 August 2026

**Job: two hard deadlines on one day, and a way out of the account.**

**The collision he asked for could not be a widening of the one that already existed.** `clash_dialog` reads occupied slots and only a `point` anchor occupies one, so a deadline sitting at 23:59:59 is invisible to it. Making it visible was the obvious move and is wrong: every task due today would collide with every other, which is the reason session 93 excluded `end` anchors in the first place. `deadline_dialog` reads promised days instead — both tasks `hard`, same local calendar day, times not read at all. Two checks, two shapes, kept in step by hand from here.

**Both tasks have to be hard, and that is the part with a price.** A normal date is a plan and may be moved. Warning on two of those would fire on an ordinary Tuesday and teach a person to press through the dialog without reading it, which costs more than the warning buys. So two things genuinely promised for one day stay quiet unless somebody marked them hard, and marking one is a tap a person has to know to make. Session 102 is what made that tap reachable at all; before it, only typing `deadline` or `by Friday` could.

**Neither warning can say whether the day will hold the work.** The day's load is a sum of `est_duration_min`, a per-verb default the reader never sees, so `also` is the whole of the sentence: another promise already sits there, and nothing about whether both fit.

**`dayWord` is a second copy of a rule that already exists**, and a deliberate one. `readDuePhrase` names days inside a phrase it also builds a clock and a hedge for, and pulling four words out of it is a change to a function six key sections depend on. The comment above the copy is where the third copy gets refused.

**Screen 3 exists because there was no way out.** Signing in has had a screen since session 96. Leaving an account had no control anywhere in the app, so the only exit was clearing browser storage by hand. It draws the signed-in address, four counts, an export and a sign-out, and in local mode it says so rather than showing a sign-out that would do nothing.

**The four counts are the first numbers this app has ever shown a person.** That is allowed, and the line is worth stating: a count of rows is a fact, where `est_duration_min` is a per-verb guess. The quiet-fields rule is about guesses wearing the clothes of measurements, not about arithmetic.

**The export writes the records exactly as stored, with no shape of its own.** A file in an invented shape needs an importer written against that shape, and the one thing an export has to survive is this project changing its mind about a field. It carries whatever defects the records carry, which is the point.

**One hole closed while passing through.** The harness's `need()` guard named seven of ten capture fields and four of five card fields, so `resolve()` could have stopped returning `clash_dialog`, `deadline_dialog` or `card_id` and every check would still have been green. `check_loud` covers all three now. Sixth time a check has turned out to be looking at less than it appeared to.

**No theme, font, size or layout change, by his decision.** The UI report that offered them ships with the bundle; the only thing taken from it is the account screen, which was the one item in it with logic rather than taste behind it.

**Save point:** `two collision checks, one dialog; screen 3 with export and sign-out; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** use it for a few days, then the workflow migration.

---
## Session 104 — 17 August 2026

**Job: the R2 design applied, and everything that does not work marked.**

**He reversed the morning's decision and asked for the design.** So the visual system is the pack's own: warm ground `#f5ead8`, cards `#fdf7f0` at 18px on a soft elevation, terracotta `#c67139`, Fraunces over Figtree. The token block at the top of `mvp.css` is the whole of it, which is the only reason a change this wide is reversible in one edit.

**Two things had to be rebuilt rather than recoloured, and both were load-bearing.**

The row actions were subordinate *because* they were mono. Small, uppercase, letter-spaced, low contrast: four signals carried by one face. There is no mono face in this system, so the same four signals are rebuilt out of Figtree at 600, and a row still reads as a title and a sentence that happens to carry controls. Recoloured and nothing else, `PIN DELETE` would have become ordinary text sitting under the sentence and competing with it.

Colour meant one thing and now means three. Accent is pressable, `#c0492b` is overdue, `#e1eecc` is synced. The old rule was one colour with three jobs and it worked because the ground was cool and flat; a warm palette cannot carry overdue on type weight alone. Three is the limit, and the limit is stated on the account screen rather than left to be inferred by whoever adds the fourth.

**Done became a circle and the word left the action row with it.** The design's own control for it, and the one thing on a row a thumb finds without reading. Two controls for one outcome is how two of them come to disagree, which is the same argument that took `Park` out of config and merged four functions into one over the last twenty sessions. The Done tab reuses the same circle, filled, as Undone.

**Where the design and the engine disagreed, the engine won and the design's shape stayed.** That rule settled three arguments in one session. The `+1h` and `+3d` nudges are drawn exactly where the design puts them and carry the engine's own push targets, because a band pushes to a band and a day over capacity is not offered — two fixed offsets would have been two numbers nothing chose. The `All / Timed / Soft` segmented control is drawn as the segmented control it is and carries `Today / Tomorrow / Upcoming`, a choice of three that already exists. `Now` is a heading, a count and a wash over the Today list rather than a fourth list, because the ranking already puts overdue first.

**The sync state moved from the foot of the page into the header.** The foot is the last place a person looks and this is the first thing they want when a task has not arrived on the other phone. It is drawn from a remembered word and corrected a frame later, because `sync.status()` is async and the draw is not: a stale word for one frame beats a header that jumps after the page has settled.

**Everything that does not work is now written where it can be seen.** A register on the account screen, the same table in `MVP.md`, fourteen lines. `decided` and `later` are kept apart in it, and that distinction is the whole value of the list: "we chose not to" and "we have not got to it" are different answers and only the second one is worth chasing. Every drawn-but-dead control gets one treatment — dimmed, and on a press it says in one sentence what is missing and which Part owns it. A control that swallows a press reads as broken; a control that explains itself reads as unfinished, which is what it is. `Workflow` on a row is the only one drawn today.

**What it cost, recorded rather than discovered later.** `mvp.css` crossed the 400-line cap, so screen 3's styles left as `mvp.account.css`; the split is by screen, the seam every other split in this shell has used. The gate's stylesheet holds the same six colours as literals rather than tokens, because it draws before `mvp.css` is fetched and a token there would mean an unstyled screen on the one page a first-time user sees — so two files now carry one palette and they will drift. Fraunces and Figtree are more font than the app pulled before, and the worker is network first, so a cold start waits on them.

**No gate could see any of this.** `check_render` pins the Stage 3 harness at `/shell/`, which has its own styling and is deliberately not the app. That separation was argued for in session 98 on the grounds that deleting the harness would cost two checks to save a file, and this is the second session it has paid for itself.

**Save point:** `R2 design applied, not-built register drawn; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** use it for a few days, then the workflow migration.

---
## Session 105 — 17 August 2026

**Job: the design did not arrive, and there was no way to tell.**

**The stylesheet was the one file in the app with no cache-buster.** Every module is loaded under `?v=${Date.now()}`, and the query is carried on to everything a module imports — that was the session 96 fix and again the session 98 fix. The `<link rel="stylesheet">` in `index.html` had nothing. The document is never cached and its stylesheet was, so the whole of session 104's design landed in the repository and never reached the phone. Reported as "it still shows everything black and white", which is exactly right: the previous stylesheet was still being served and the previous stylesheet is cool and flat.

**Third time for the same defect, in the file type nobody thought to bust.** Twice it was a module; this time it was CSS. Both earlier times it read as a fix that had failed rather than a file that had never been fetched, and so did this one.

**A static file cannot carry a date, so it carries the shell version** — and that is the kind of number that goes stale, because it depends on somebody remembering. So `gate2.py` reads it: the query in `index.html` and the query on both `@import` lines inside `mvp.edit.css` must all equal `SHELL_VERSION`, and a missing query fails as loudly as a wrong one. Proved by setting it to 19 and watching the gate name the file and both numbers, and again by removing it entirely.

**The `@import` lines needed it too, which is the part that would have been missed.** An imported sheet is fetched under its own address. Busting the outer file alone leaves `mvp.css` and `mvp.account.css` stale one level down — the same defect one layer in, arriving as a design that is half applied, which is harder to read than one that is not applied at all. Three literals now hold one number and the gate is what holds them together.

**The account screen states the running shell and config versions.** He asked where the version number is and the answer was nowhere: the app has never shown one. That is what made this defect cost a round trip — there was no way on screen to tell a build that had not arrived from a build that had arrived and looked wrong. Two numbers and one sentence about closing the app fully, which is what a phone needs to let go of an old copy.

**Save point:** `stylesheet busted and gate-checked; build version on screen; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** use it for a few days, then the workflow migration.

---
## Session 106 — 17 August 2026

**Job: a web layout, and the sync that threw him off the capture screen.**

**The defect first, because it was costing him tasks.** A screen's `window` listeners outlived the screen. `mountList` registered `cascade:store-changed` and nothing ever removed it. Mounting screen 2 empties `#screen`, which takes the list out of the document and leaves its closure alive and still listening. The next sync event — a realtime message from the other device, or the sixty-second pull — called `reload()`, which called `draw()`, which wrote the list straight back into the element screen 2 was using. Typing a task and being returned to the list mid-word is precisely what that produces. Every navigation added another listener, so a long session got worse rather than staying broken at a constant rate.

**Every mount returns a handle now and the router unmounts the previous screen before mounting the next.** Proved rather than argued: mount, unmount, fire the event, count the redraws. One listener while mounted, none after, no redraw. Screen 2 had the same leak in a milder form — it repainted the screen it belonged to — and it accumulated one repaint per visit.

**Then the layout. A phone navigates because it has one screen's worth of room; a laptop does not.** Making the wide window navigate anyway was the whole of "both look the same". At 940px the app is two panes: the list on the left, the capture panel on the right, both live and neither waiting on the other. A row press loads the panel rather than replacing the screen, so the list keeps its scroll, its tab and its search — all three of which it lost on every single edit before this.

**The panel is sticky and draws no Back button.** Sticky because a capture box that leaves the window the moment you scroll to find the task you were about to edit is worse than no panel at all. No Back because its destination is already on screen, and a control whose destination is visible explains nothing.

**Three keys, and only where there is a keyboard to press them.** `n` to capture, `/` to search, `Escape` to let go of a field. Nothing fires while a field has focus, so `n` typed into a title is an `n`. This is the other half of what makes a web version a web version: a window that size is being used with two hands, and reaching for the mouse to put a caret in a box is the thing that makes a stretched phone app feel like one.

**The breakpoint is now stated twice, in `mvp.css` and in `mvp.js`.** They must agree. CSS cannot decide whether a tap navigates or loads a panel, and JavaScript should not be measuring the window to lay out a grid. That is a genuine duplicate rather than an accident, and it is written down where both halves live rather than left for the first person who changes one of them.

**Crossing the breakpoint mid-session lands on the list with the panel closed**, which is the route a phone would be on. Dragging a window narrow with a panel open had to land somewhere and the answer should be the same place a phone starts.

**`mvp.css` crossed the 400-line cap again and the wide layout left as `mvp.wide.css`**, entirely inside one media query. Below the breakpoint that file changes nothing, which is what makes "the phone layout is the default" true rather than claimed. Fourth stylesheet, fourth `?v=` query, and all four are checked by yesterday's gate rule — the first thing that rule has caught for free.

**Save point:** `two layouts; the sync-over-capture leak fixed and proved; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** use it, then the workflow migration.

---
## Session 107 — 17 August 2026

**Job: the search box that took one letter.**

**The defect.** `draw()` emptied `root` and rebuilt everything on it, including the search input, on every keystroke. So the element being typed into was destroyed after the first letter and replaced by a fresh one carrying the same value, and the `focus()` call on the very next line addressed the old node, which was detached by then and focuses nothing. One letter, then the caret gone.

**It is the same defect screen 2 was built to avoid, and the rule was already written down.** Session 99: "the box is built once and never redrawn. Everything around it repaints on every keystroke; replacing a focused input mid-word loses the caret on a laptop and dismisses the keyboard on a phone, and this is a screen whose whole job is being typed into." Screen 1 got a search box nine sessions later and none of that reasoning came with it. That is the fifth time a rule written for one place turned out to be needed in two, and the fifth time nothing carried it across.

**Screen 1's chrome is built once now.** Header, tab row, search box, `+`, toggle: all made at mount. `paint()` changes their text and their pressed state and never their identity. Only the list and the toast are rebuilt, and neither of those can hold a caret. Proved by typing four letters into the mounted screen and checking the element is the same object afterwards, that no input was constructed during the typing, and that the value survived.

**The toggle is built once and hidden on the other tabs, rather than built only inside Tasks.** A control that appears and disappears moves the row above it, and the row above it is the tab row a person is aiming at when they change tabs. The cost is three buttons in the markup that are not always reachable, which is worth one line of comment.

**The header date is recomputed on every paint.** Built once, it showed yesterday's date on a tab left open past midnight, over a list that had already rolled over to today.

**`mvp.row.js`.** The file crossed the 400-line cap making its chrome build-once, so a row and a block of rows left, with everything they need handed in as an argument. The seam is the right one rather than the convenient one: a row can no longer read the screen's state behind its own back, which is the shape that let it quietly depend on `tab` before.

**Save point:** `screen 1's chrome built once; search survives typing, proved; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** use it, then the workflow migration.

---
## Session 108 — 17 August 2026

**Job: say what arrived, and stop shipping half of it.**

**The report was that the web layout did not work and no version was shown, and the code was not at fault.** The capture panel mounts correctly under a wide window — proved headlessly before touching anything. What was wrong was the delivery. The session 107 `changed` zip held session 106's files and 107's files and not 105's, so `mvp.account.js` never reached him and the version block he had specifically asked for was missing from a build that otherwise looked correct. I told him the bundle included the previous session, which was true of one previous session and not the one that mattered.

**A half-applied set of files across three sessions is indistinguishable from a bug in the code.** That is the whole lesson, and it cost an hour of telling one from the other. The zip is cumulative from the last build he has confirmed running, from here, and it is in the decision log rather than in my memory.

**The app now states what it is running on, and can catch this itself.** `mvp.css` sets `--css-version` and `mvp.wide.css` sets `--wide` inside its media query; `mvp.js` reads both through `getComputedStyle` and draws one loud line when either disagrees with `SHELL_VERSION`. Three separate sessions have now been spent on the question "did this arrive", and the answer was never on screen.

**A wide window missing its layout stylesheet looks exactly like a phone.** That is the worst kind of failure this project has produced, worse than the black-and-white one, because it does not look broken — it looks like a decision. The same argument as the network-first service worker in session 101: slow and correct beats fast and lying, and silent and wrong is the thing to design against.

**Four states proved rather than assumed:** everything agreeing and the strip silent; a stale stylesheet named with both numbers; the wide sheet missing and named; and no stylesheet at all.

**The build number is in the header.** It was on the account screen only, which is one press away, and one press is too far when the question is whether a push arrived at all. Every screenshot of the app now carries its own version, which is exactly what the last three rounds of this were missing.

**`mvp.chrome.css`.** The toast and the truth strip left `mvp.css`, which crossed the 400-line cap again. Both belong to no single screen: the toast is fixed to the window and the strip is about the build. Fifth stylesheet, fifth `?v=` query, all five checked by the gate rule from session 105.

**Save point:** `the app reports its own build and catches a stale stylesheet; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** confirm build 27 is running, then the workflow migration.

---
## Session 109 — 17 August 2026

**Job: the `Cascade Web` frame, whole, with everything unbuilt drawn and marked.**

**His instruction was to keep the shape and mark what is missing rather than leave it out, and it is the right call.** A nav or a panel that grows later moves everything a person has learned the position of. So the rail and the detail panel are built as the design draws them, and the eleven controls behind them that have nothing to do yet are dimmed, tagged `WIP`, and say on a press what is missing and which Part owns it. That is the same reasoning session 98 used when a row press said the edit screen was not built yet instead of swallowing the press: a control that explains itself reads as unfinished, which is what it is, where a control that does nothing reads as broken.

**One treatment for all eleven.** Eleven different ways of saying "not yet" is eleven things for a person to learn. The sentences live in one object per file, so they cannot drift apart in tone as they get edited one at a time.

**Three things the design draws are deliberately NOT drawn, and are NOT marked WIP.** A duration on every row, a day's load beside each push target, and a push count. All three are collected and none of them is ever shown, which is the quiet-fields rule from session 89. Drawing them would reverse a decision rather than fill a gap, and the distinction is worth the paragraph: `decided` and `not yet` are different answers, exactly as in the not-built register, and only the second is worth chasing.

**The detail panel is read-only and `Edit` hands the task to the capture box.** Every field it shows is already set in the editor, and a second control for one field is how two controls come to disagree — a bill this project has paid four times now. One extra press is the price and it is the cheap side of the trade.

**A row press means three different things at three widths, and that is the layout rather than three special cases.** On a phone it navigates. At 940 it loads the box above the list, because that is the only place the task can be shown at that width. At 1180 it selects into the detail panel and leaves the box alone, because a press on a row is "show me this" and the box is for the thing not written down yet.

**Two breakpoints now, each stated in exactly one stylesheet and in `mvp.js`.** 940 moves the capture box above the list; 1180 adds the rail and the detail panel. A rail needs a first column and a panel needs a third, and at 940 there is room for neither. Crossing either one mid-session lands on the list with whatever does not fit closed.

**The rail's counts come from the list's own `listOnly()` pass, handed over rather than read again.** A number beside `Today` that disagreed with the rows under it would be the same defect as two orderings for one list, which is the thing this project has avoided five times by sharing a function rather than a description.

**Save point:** `the web frame built whole, WIP marked in place; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** confirm build 28, then the workflow migration.

---
## Session 110 — 17 August 2026

**Job: the pickers.**

**The words were never the problem, and that was checked first.** `dateWords` returns `20 Aug`, `timeWords` returns `5:30pm`, and the engine reads both correctly, with the year appearing only when it is not this one. What failed was reaching the native control at all.

**Two causes, and the second one is the one worth writing down.**

**The chip was a `<label>` with an invisible `<input type="date">` stretched across it.** So whether the control opened depended on the press landing on the browser's own calendar indicator, which sits at the right edge of the field — under a chip of a different width, in a position nobody had measured. Hit sometimes for time, never for date. Reported exactly that way. It is a real button calling `showPicker()` now, with focus-and-click as the fallback where `showPicker` is missing or refused, and the field takes no clicks at all. The field stays 1px at the bottom-left of the chip rather than being moved off the page, because a browser anchors the popup to where the field is and not to what opened it.

**And the row was rebuilt on every keystroke.** A picker that is rebuilt while it is open closes without returning anything, and opening a calendar takes several clicks and a few seconds. Every repaint in that window — a keystroke in the box, a sync arriving from the phone — destroyed the input the calendar was attached to. A date picker that never works and a time picker that works when you are quick is precisely what that produces.

**Third place, second time late.** The capture box has been built once and never redrawn since session 99, with the reasoning written out in full. The search box got the same treatment in session 107, two sessions ago, after failing the same way. This row was still being thrown away and remade. Only the tick chip actually changes, so only the tick chip is repainted now. The rule is stated once more, in the file, in capitals: anything that can hold a caret or an open popup is built once.

**Four things proved rather than argued:** the chip press calls `showPicker`; the input is the same object after a repaint; picking a date types `20 Aug` into the box; and picking a time afterwards types `5:30pm` beside the date rather than after the sentence, which is `typeBeside` doing what session 99 built it for.

**The gate now holds `--css-version` to `SHELL_VERSION`.** Yesterday's runtime check reads that token to decide whether to accuse the browser of serving an old stylesheet. A token left behind by a version bump would have the app blaming the browser for a mistake in the repository, which is the worst possible failure for a check whose whole job is telling those two apart. Proved by setting it to 24 and watching the gate name both numbers.

**Save point:** `pickers open and survive a repaint, proved; gates 1, 2, 3, 4, 5 and 6 waiting on a hand`

**Next job:** confirm build 28, then the workflow migration.

---

---
## Session 111 — 17 August 2026

**Job: the alarm, integrated. It rings, it can be snoozed without unlocking, and a task whose alarm was slept through escalates.**

**An alarm needs a stated time, and now the screen says so.** `canAlarm()` has required `has_time` since session 94, for a reason worth restating: a task due "Friday" resolves to 23:59:59, so a lead off that instant rings at a quarter to midnight, which is not a reminder about Friday. The engine has refused that all along and the panel drew the toggle anyway, so setting an alarm on a timeless task looked like it worked and silently did nothing. The row is drawn only while the line carries a time, and in its place sits one sentence naming the time as what is missing. A control that cannot work is worse than an absent one: absence reads as a decision, presence reads as a promise.

**`alarm_type` lost `repeat` and became a toggle.** Every alarm rings for two minutes, snoozes itself for five, and does that up to five times, so "ring again every" was a second way of asking for what an alarm already does. A task that should come back another day has `recurrence`, which predates this by twenty sessions. `alarm_repeat_min` is deleted rather than deprecated: nothing is live, and a field kept for a data set that does not exist is a field nobody can delete later.

**The snooze intervals moved from capture to the ring.** 5 / 10 / 30 / 60, one button each on the lock screen. Nobody knows at capture how long they will want a thing pushed back by, and the number is only ever wanted with the thing in front of them. 15 came off the list because four buttons is already the most a thumb should have to aim at on a lock screen at six in the morning.

**Push is not on the lock screen, and that is what made the rest of the design simple.** Choosing a push target reads the day's load off every other task, which the app does and a dead WebView cannot. So a push needs an unlock. The version that shipped precomputed targets into the alarm payload and added a `PUSH:<iso>` outcome verb; his call removed both, and with them the question of how stale a load computed hours before ringing is allowed to be.

**THE DEFECT THAT MATTERED, and it was in the bridge rather than the app.** `syncAlarms()` diffed desired alarms against armed ones on the ring instant. A snoozed alarm's ring instant is not its derived instant, so it either fell out of the desired set for being in the past and got cancelled, or looked stale and got re-armed back to a time that had already gone. Opening the app during a snooze ended the snooze. The fix is `armedFor`: the shell records the derived instant it armed against, the diff compares that, and an alarm already armed for the right instant is left alone whatever its ring time says. The same field is what lets the auto-snooze chain run without reporting each step to the store, which saves five writes and five sync round trips per unanswered alarm.

**Two homes for a snooze, and neither is redundant.** `alarm_snoozed_until` on the task is the truth and reaches the other devices. The shell holds its own copy because the WebView is usually dead when an alarm rings, and something has to be able to re-ring without it. They are allowed to disagree for as long as an outcome takes to drain.

**A slept-through alarm escalates the task without touching importance.** Importance is user-set only and has been since July, so the escalation needed its own term. `alarm_unanswered_at` is the live marker and joins `pinned` and `is_hard` as the third tier-1 override, third so a soft task with a missed alarm cannot jump a hard task without one. `reminder_fatigue` is the count, nothing clears it, and it stops being a working value: it was sourced from a Part B structure, which meant zero in every record and read by nothing, and a count that lives only in memory is gone at the next refresh. A push, a Done or an edit that moves the date clears the marker and leaves the count. The same pair as `first_due_at` and `push_count`.

**The row says why it jumped.** Colour cannot say it: three states is the limit and pressable, overdue and synced are all three. So it is a trailing clause on `card_reason`, spoken only when true, and absent from `card_reason_short` where no trailing clause goes.

**`check_alarm.mjs`, the sixth check, is the first thing in 110 sessions to assert an order out of `rank_key`.** No key case names `cards`, `rank_key` or `decided_by`, and that is a shape mismatch rather than an oversight: the key runs `resolve()` over a typed line, and cards are built from `existing_tasks`. A third override reorders every list in the app with all five other checks green, which is precisely the surface every defect found by running the app has been in.

**Files changed:** `types.ts`, `config.ts`, `shell/config.js`, `shell/alarm.js`, `shell/alarm.bridge.js` (new), `shell/check_alarm.mjs` (new), `shell/cards.js`, `shell/push.js`, `shell/repeat.js`, `shell/resolve.js`, `shell/resolve.stage3.js`, `shell/app.js`, `shell/mvp.js`, `shell/mvp.panel.js`, `shell/mvp.edit.js`, `shell/mvp.detail.js`, `shell/store.supabase.js`, `shell/render.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `index.html`, `schema.sql`, `contract.md`, `example.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`, and six Kotlin files plus the manifest additions under `android/`

**Tests:** `gate2.py` passes at 13 inputs, 13 working values, a 44-field `Task`, 39 shown outputs and 36 config objects. `selftest.py` catches 28 of 28. `gate4.mjs` runs 142 of 144 and every one agrees. `check_render.mjs` still matches example section 1 exactly. `check_loud.mjs` proves 6 of 6 breaks loud. `check_alarm.mjs`, new, passes 38 assertions covering the gate, the ring instant, the snooze and unanswered records, push and spawn clearing, and three ordering cases. `tsc --strict` clean.

**Not tested:** nothing has been run on a phone. The eight alarm tests that passed on the Nothing Phone (2) were against the standalone test app, not this build, and the auto-snooze chain reaching its limit is a ninth test that never existed.

**Save point:** `alarm integrated, six checks green, nothing run on a device`

**Next job:** build the Capacitor shell and run the nine alarm tests against this build.

---
## Session 112 — 17 August 2026

**Job: four defects he found by running build 29 on the phone, and the one thing that was stopping the alarm from being diagnosed at all.**

**`in 5mins` did not parse, and `in 5 mins` did.** The rule wanted three tokens: `in`, digits, a unit. A joined `5mins` is two. Fixed by reading the number and the unit out of one token as well as two. THIRD TIME a rule written for one spacing met a person writing another: `5.30pm` was T2 and `5 pm` was T3, and both were the same shape of mistake. A spacing is not a grammar. Whatever rule comes next that reads a number beside a word should be written for every spacing on the first pass.

**Saving an edit warned that the task duplicated itself, clashed with itself, and shared its own deadline day.** ONE root cause under three symptoms. `resolve()` writes `new_id` into the record on every call, an edit included, and all three finders exclude by `t.id !== task.id`, so the guard compared a fresh id against a stored one and excluded nothing. The exclusion is `bound_task_id` and it is applied once, in `readCapture` and at the `readDuplicate` call, rather than inside the three finders: their own guard stays as a second line, and the list, the search and Ideas keep reading the whole set, which they must. The check proves both directions, because an exclusion that goes too far is the same defect facing the other way: the same line typed fresh must still warn.

**The header is sticky and a saved edit returns to the list.** He reported no way back after editing. Back is drawn on the narrow layout and survives every repaint, so there were two candidates and no way to tell them apart from here: the header scrolling out of reach once the advanced panel is open, and a saved edit leaving the screen with nothing further to do on it. Both are answered without knowing which he hit. An edit is finished when it is saved, and the wide layout is unaffected because its `onBack` is null by design.

**THE ACCOUNT SCREEN NOW SAYS WHETHER ANYTHING CAN RING, and this is the one that mattered.** Two installs of this app look identical on a phone: the browser's home-screen copy and the Android APK. Only the second carries the plugin. He had three icons and a silent alarm, and there was no way to tell which app was running or whether Android had granted anything, so a silent alarm had three possible causes and no evidence. The block reads `present` or `not present`, says why a browser copy cannot ring, and where the shell is present but a permission is missing it offers the button that opens the two system screens. THAT BUTTON IS THE FIRST CALLER `requestAlarmPermissions()` HAS EVER HAD: I wrote it and `isNativeShell()` into the bridge in session 111 and called neither from anywhere, then told him the app would prompt him. It never could. A function with no caller is not a feature, and nothing in six checks looks for one.

**`selftest.py` reported SETUP BROKEN rather than a miss, for the fifth time.** The fixture pinned "34 rules" and the contract now states 35. It reads the number live now, the way the config-object fixture two lines above it already did. A fixture that pins a moving value reads as a tooling fault and hides an untested gate.

**Files changed:** `shell/resolve.js`, `shell/mvp.edit.js`, `shell/mvp.edit.css`, `shell/mvp.account.js`, `shell/mvp.css`, `shell/render.js`, `shell/check_alarm.mjs`, `selftest.py`, `index.html`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** all six green. `gate2.py` passes. `selftest.py` catches 28 of 28. `gate4.mjs` runs 142 of 144 and every one agrees. `check_render.mjs` exact. `check_loud.mjs` 6 of 6. `check_alarm.mjs` now 46 assertions, adding the three self-comparison cases, the still-warns-when-fresh case, and four spacings of a length of time.

**Not tested:** nothing has rung on a device yet. The account screen is what will say why.

**Save point:** `four field defects fixed, the app now states whether it can ring`

**Next job:** read the Alarms block on the account screen, then the nine alarm tests.

---
## Session 113 — 17 August 2026

**Job: going back is the phone's own gesture, and a push can be made from the alarm.**

**THE DRAWN BACK WAS IN THE WRONG PLACE AND THE FIX WAS NOT A BETTER PLACE FOR IT.** Session 112 made the editor header sticky so Back stopped scrolling away, and he reported it still unreachable. That is because the top of a tall phone is where a thumb cannot get to at all, and no amount of stickiness changes that. The system gesture has neither problem: it works from anywhere on the screen, it is the same swipe as every other app on the phone, and it is already what a hand reaches for. The list is the base history entry and every navigation away pushes one, so a back from the list has nothing left and Android closes the app, which is right. The drawn button stays and now calls `history.back()` rather than jumping to the list, so the two cannot end up one entry apart.

**Push moved onto the alarm, which reverses his own earlier decision, and the cost is stated rather than absorbed.** Three turns before the first build he settled that moving a due date needs an unlock, and that removed the precomputed-target design along with the `PUSH:<iso>` verb. Both are back. The reason the first design refused them has not changed: choosing a push target reads the day's load off every stored task, and the shell has none, so the two targets the row would offer are computed when the alarm is ARMED and carried in the payload. A task armed on Monday for Friday offers Friday's targets as Monday saw them. They refresh whenever the app opens, because the diff re-reads them, and they are deliberately NOT part of the diff's comparison: re-arming an alarm because a label changed would be a lot of writes to change two words.

**An alarm with no targets draws no push row.** Not a disabled button, not a default. A button with no target would have to invent a due date, and inventing a date is what this project refuses in every other place it has come up.

**A push from the lock screen cancels the alarm rather than re-arming it.** The derived instant behind it no longer exists once the date moves, and the app re-arms against the new date on its next sync. `pushed()` already clears the snooze and the unanswered marker, so nothing extra was needed there.

**Files changed:** `types.ts`, `shell/config.js`, `shell/alarm.js`, `shell/alarm.bridge.js`, `shell/mvp.js`, `shell/check_alarm.mjs`, `shell/render.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `index.html`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`, and `AlarmStore.kt`, `AlarmActivity.kt`, `AlarmActionReceiver.kt`, `CascadeAlarmPlugin.kt` under `android/`

**Tests:** all six green. `gate2.py` passes at 40 shown outputs. `selftest.py` catches 28 of 28. `gate4.mjs` runs 142 of 144 and every one agrees. `check_render.mjs` exact. `check_loud.mjs` 6 of 6. `check_alarm.mjs` at 50 assertions, adding the push targets and the empty-target case.

**Not tested:** the back gesture and the push buttons have not been run on a device. The Kotlin changed, so this one needs a new APK rather than only a push.

**Save point:** `back is the system gesture, push is on the alarm, shell 31`

**Next job:** rebuild the APK, then the nine alarm tests.

---
## Session 114 — 17 August 2026

**Job: what an unlock is for.**

**Applying a press at unlock with the app closed is refused, not deferred.** He asked for the queue to land on unlock alone. It cannot: the WebView is dead while the phone is locked and unlocking starts no process of ours. Making it happen means Kotlin writing to Supabase directly, which is a second copy of the auth token, the newest-wins rule, the offset split and the outbox, in a second language. Every duplicated rule in this project has drifted eventually, and this one would buy a few seconds of earliness.

**So Done and a push bring the app forward and a snooze does not, which is what he asked for as the fallback.** The important part is what the unlock is doing: every press is queued in the shell whatever happens next, so an un-unlocked Done still lands the next time the app is opened, hours later or the following day. Coming forward makes the change visible rather than making it happen. Done and a push change the record and a change nobody can see is a change nobody can trust. A snooze changes nothing about the task, so being asked to unlock at six in the morning to acknowledge one is the app taking more than it gave.

**`surface()` does nothing when the WebView is already alive.** It heard the live event and applied the press before the queue was read, and pulling a running app to the front would take the screen off whatever was on it.

**Done in the notification shade routes through `AlarmActivity` now, drawing nothing.** A broadcast receiver cannot reliably start an activity from the background on Android 10 and later, so leaving the shade's Done as a broadcast would have given one Done that comes forward and one that does not. The activity answers a `verb` extra and finishes without drawing, so both presses take one path. Snooze in the shade stays a broadcast, because it must not start anything.

**Files changed:** `AlarmActivity.kt`, `AlarmActionReceiver.kt`, `AlarmService.kt`, `CascadeAlarmPlugin.kt`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Nothing in the web app changed**, so `SHELL_VERSION` stays 31 and the header will still read 31. This session is an APK rebuild and nothing else.

**Tests:** all six green, unchanged from 113: `gate2.py` passes, `selftest.py` 28 of 28, `gate4.mjs` 142 of 142, `check_render.mjs` exact, `check_loud.mjs` 6 of 6, `check_alarm.mjs` 50 assertions.

**Not tested:** none of the Kotlin has been run. The three paths that need a device are Done from the lock screen, Done from the shade, and a snooze leaving the phone locked.

**Save point:** `done and push surface, snooze stays locked, shell 31 unchanged`

**Next job:** rebuild the APK and run the nine alarm tests.

---
## Session 115 — 17 August 2026

**Job: the stylesheet is always exactly one version behind, and this is the fourth time the cache has been the answer.**

**The pattern was the diagnosis.** v29 against v30, then v30 against v31. Never two behind, never ahead. Every module in this app is imported under a fresh `?v=`, so those are unique URLs and always come off the network. `index.html` cannot carry one, because it is the address. So the page is the one file that can go stale, and a stale page carries the previous version's `<link>` while the modules it loads are current: new JavaScript, old HTML, a stylesheet behind by exactly one.

**Network-first was not enough, and the layer under it is where this lived.** `sw.js` has fetched network-first since session 101 and is not at fault. `fetch()` inside a worker goes through the browser's own HTTP cache, and GitHub Pages serves `index.html` with a ten-minute lifetime, so for ten minutes after a push the worker was handed the previous page without a request leaving the phone. He restarted the app twice inside that window, which is why restarting looked like it did nothing. Waiting would have worked, which is the worst kind of defect: one that heals before it can be investigated. The document is fetched with `cache: "reload"` now, and only the document, because everything else already has a unique URL.

**The `<meta http-equiv="Cache-Control">` in `index.html` never did anything and is kept as a label.** A browser ignores a cache directive carried inside the document it governs: by the time the tag is read, the response has been stored. It read as a solved problem for four sessions. The comment above it now says what actually solves it and where both halves live.

**The app repairs the stylesheet rather than only complaining about it.** `tellTheTruth()` has drawn a loud line about a stale sheet since session 108, and a loud line about something the person cannot fix is a complaint. The app knows `SHELL_VERSION`, so it re-points the link at it and re-reads the token; the old sheet is left in place until the new one has loaded, so nothing flashes unstyled. What stays loud is the case this cannot repair: a sheet fetched AT the right version still reporting the wrong one, which is the repository disagreeing with itself rather than the browser being behind. The two failures now read differently, which they never did before.

**Both halves are kept even though either would do.** The worker fixes it for a browser that has one; the link repair fixes it inside a WebView, on a first visit before the worker is in control, and on any surface where the worker is not running. Neither is a reason to stop the gate reading every `?v=` in the repository: what makes the FIRST paint right is the repository being right, and the repair only rescues the second.

**Files changed:** `sw.js`, `index.html`, `shell/mvp.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `shell/render.js`, `gate2.py`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** all six green. `gate2.py` passes, `selftest.py` 28 of 28, `gate4.mjs` 142 of 142, `check_render.mjs` exact, `check_loud.mjs` 6 of 6, `check_alarm.mjs` 50 assertions.

**Not tested:** the repair path has no harness. It needs a real browser holding a real stale page, which no check in this project can produce.

**Save point:** `the page is fetched past the browser cache and the sheet repairs itself, shell 32`

**Next job:** the nine alarm tests.

---
## Session 116 — 17 August 2026

**Job: Done did not stop the alarm, which is a defect I put in last session.**

**THE RULE THAT WAS BROKEN: stopping the noise must never depend on an unlock.** Session 114 routed the notification's Done through an activity so the app could come forward afterwards. An activity on a locked phone waits for the keyguard, so `handle()` — whose first line stops the ringing service — did not run until the phone was unlocked. The alarm went on ringing through a press that had already been made, which is worse than the press doing nothing: a control that does not work can be pressed again, and one that works late teaches a person that pressing it does not work.

**Every notification action is a broadcast again, Done included.** A broadcast runs immediately whatever the screen is doing. The stop, the cancel and the queue all happen there.

**The pull-forward moved to the end of `handle()` and is allowed to fail.** Everything that matters has already happened by the time it runs. Android restricts background activity starts, and on a locked phone this is what raises the keyguard rather than what applies the press: the QUEUE applies the press, whenever the app is next opened. If the start is refused nothing is lost, which is what makes it safe to attempt at all. Session 114 had this the wrong way round: the convenience was load-bearing and the correctness was riding on it.

**The `verb` extra path in `AlarmActivity` is kept and is now unused.** Four lines, and the only way to drive that screen without a person pressing something.

**Files changed:** `AlarmService.kt`, `AlarmActionReceiver.kt`, `AlarmActivity.kt`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Nothing in the web app changed.** `SHELL_VERSION` stays 32.

**Tests:** all six green, unchanged. No harness reaches any of this; it is Kotlin and a locked phone.

**Save point:** `the ring stops on the press, not on the unlock`

**Next job:** the nine alarm tests.

---
## Session 117 — 17 August 2026

**Job: ask for every permission, including the one that was only reachable through Android's own settings.**

**FOUR PERMISSIONS, AND THEY FAIL DIFFERENTLY.** That is the whole reason this needed more than one button. Without notifications nothing appears however loudly it rings. Without exact timing the ring drifts, by minutes normally and by longer while the phone is idle. Without full-screen access it arrives as a notification and the alarm screen never appears, so Done and one snooze are all that is reachable and the four snooze buttons and the push targets are unreachable. Without battery exemption a ring can be held back. Only the first two stop it working; the other two make it worse quietly, which is the harder kind to notice, and is exactly what he hit.

**"Something is missing" is not something a person can act on.** The account screen said that for two builds while the answer was one switch in a settings screen most people do not know exists. Each permission is now a row with its own state and, when it is off, one sentence saying what it costs and a button that opens the screen for that one thing. There is also a button that walks through everything missing, because four screens in a row is fine when you have just installed the app and wrong when you are fixing one switch.

**Full-screen access can be read, not only requested.** `canUseFullScreenIntent()` arrived with Android 14, which is the same release that stopped granting the permission on declaration alone to anything that is not a clock or a dialler. An app installed outside the Play Store is neither, as far as the system is concerned. The settings action is written as a string literal rather than referenced through the constant, so this compiles against a platform older than the one that added it.

**The list redraws when the app comes back to the front.** Returning from a system screen is the only moment the answers can have changed, and it is exactly the moment the person is looking at the list. Without it the screen would tell someone to turn on a switch they had just turned on.

**Files changed:** `CascadeAlarmPlugin.kt`, `shell/alarm.bridge.js`, `shell/mvp.account.js`, `shell/render.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `index.html`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Tests:** all six green. Nothing here has a harness: it is four system screens and a phone.

**Save point:** `every permission named, read and requestable from the account screen, shell 33`

**Next job:** the nine alarm tests.

---
## Session 118 — 17 August 2026

**Job: the back gesture, which was built for a browser and deployed into a WebView.**

**TWO LAYERS AND I BUILT ONE.** Session 113 made the list the base history entry and pushed one on every navigation, with `popstate` putting the screen back. That is correct and complete in a browser. Inside the Capacitor WebView the gesture never reaches it: the activity sees it first, and what happens there is Capacitor's default, which goes back in WebView history when it judges there is history to go back to. Entries added with `pushState` are same-page, and whether a WebView counts one as somewhere to go back to is a thing that varies rather than a thing to rely on.

**So the app is asked.** `window.__cascadeBack()` returns true when it handled the gesture and false when there is nothing left, and `MainActivity` closes the app only on false. The decision sits in the file that knows which screen is showing, instead of being inferred from a history list two layers away. `popstate` stays for the browser, and the two agree because the hook calls `history.back()` rather than navigating on its own.

**A back closes an open dialog before it leaves a screen.** A dialog is the nearest thing on the screen and a gesture aimed at anything is most likely aimed at that. It presses Cancel, which is the one way out of a dialog that changes nothing.

**`MainActivity.java` now lives in the repository.** Leaving it as a step in prose is what lost the plugin registration two sessions ago: the app built, ran, looked right and had no alarm in it, and nothing about the build said so. A file can be copied wrong once and then diffed. A step can be forgotten every time.

**Files changed:** `shell/mvp.js`, `shell/mvp.dialog.js`, `android/MainActivity.java` (new), `android/README.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Not tested:** the hook has no harness. It needs a WebView and a thumb.

**Save point:** `back is one decision in one file, asked by both layers`

**Next job:** the nine alarm tests.

---
## Session 119 — 18 August 2026

**Job: ten field reports from build 34, in one pass — the load, the reach, the readings, and two questions answered in writing.**

**THE LOAD TIME WAS TWO DECISIONS STACKED.** `index.html` imported `mvp.js` under `?v=${Date.now()}`, so every launch was a set of URLs no cache had seen and the whole graph came off the network cold — including `lemma.js`, 3.6 MB and nine tenths of the graph, statically imported in front of the first paint. The clock query was right while the document could go stale; session 115 ended that, so the query is `?v=<SHELL_VERSION>` now, `gate2.py` holds it there like the stylesheet, and `sw.js` serves any URL stating a version from the cache, because a new version is a new address chosen by a document that is always fresh. The model loads BEHIND the app: the chain reads it last and can only add, so before it arrives a verb resolves exactly as it did the day the model shipped. Stated cost: a lemma-only verb missed in the first second or two, healed by the next keystroke. Runners await `lemmaReady`. A leftover `console.log` in `resolve()` that wrote the typed line to the console on every keystroke also left.

**THE ACCOUNT SCREEN WAS ASKING A SESSION-113 PLUGIN SESSION-117 QUESTIONS.** The web half updates on every open and the Kotlin only on an APK rebuild, by design, and nothing measured the gap: an absent reading was drawn as `off` and a press called a method that did not exist and failed silently — his two symptoms, one cause. The plugin states its build now (`version()`, build 2), the bridge states the build it was written against, and the screen draws the difference as a loud sentence naming the fix. Absent readings say `unknown`. The Kotlin also opens settings when Android will no longer show the notification prompt: refused twice, the runtime prompt never appears again and the old code drew nothing.

**Reach and touch.** A 60px `+` floats bottom-right on the narrow layout (the bar's `+` is the most-pressed control in the app and sits where a thumb cannot go); wide layouts hide it because the capture box is on screen. The page carries `env(safe-area-inset-*)` so the header no longer sits under the status bar, and the sticky editor header offsets by the same inset. The platform's blue tap flash is off and buttons are not selectable text. Push targets became standard ladders of four or five per precision on a sideways strip; the rules under them are unchanged. The date chip row is the same kind of strip and gained five standard times (`time_suggestions`, config a.18); the two pickers wear the accent, which spends no new colour because pressable is what accent means.

**The two questions, answered as decisions.** `Workflow` left the row — MVP.md has said since session 104 that a row carries Pin, Delete, the Done circle and its push targets, and the WIP places that remain are the rail and the detail panel. And a row's sentence is not drawn when it exactly equals `Due <slot>` for the slot it sits under — thirty rows reading `Due today` under a tab called Today was the heading said back. A time, a hedge, an overdue, a window all keep the sentence, so a task spanning days still states its span. Both are screen decisions; the engine and the key are untouched. Pin and Delete are glyphs, words kept for screen readers, the pin filled while pinned.

**Files changed:** `index.html`, `sw.js`, `gate2.py`, `shell/render.js`, `shell/resolve.js`, `shell/push.js`, `shell/mvp.row.js`, `shell/mvp.list.js`, `shell/mvp.chips.js`, `shell/mvp.edit.js`, `shell/mvp.account.js`, `shell/alarm.bridge.js`, `shell/config.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `shell/mvp.wide.css`, `config.ts`, `types.ts`, `contract.md`, `example.md`, `gate4.mjs`, `shell/check_render.mjs`, `shell/check_alarm.mjs`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`, and `CascadeAlarmPlugin.kt` under `android/`

**Versions:** example 41, contract 52, config a.18, shell 35, answer_key 28. Config is 37 objects. No schema change and no migration: `ensureConfig()` upserts a.18 on the first write.

**Tests:** all six green. `gate2.py` passes (now also holding the `mvp.js?v=` to SHELL_VERSION). `selftest.py` 28 of 28. `gate4.mjs` 142 of 142. `check_render.mjs` exact. `check_loud.mjs` 6 of 6. `check_alarm.mjs` passes. Proved headlessly: a verb resolves through the lexicon before `lemmaReady` and identically after it; the day ladder reads Tomorrow · +2 days · Next week · +2 weeks · Next month.

**Not tested:** the safe-area insets, the FAB, the strips and the stale-shell sentence need a phone. The Kotlin changed, so the permission rows only fully resolve after an APK rebuild — until then the loud sentence and the `unknown` readings are the fix.

**Save point:** `launches come off the cache, the model loads behind the app, and the APK states its age`

**Next job:** rebuild the APK, then the nine alarm tests.

---
## Session 120 — 18 August 2026

**Job: build 35's first five screenshots, and one instruction — the scroll goes down, not across.**

**THE SIDEWAYS STRIPS BROKE THE ROW.** A row is `tick | body | nudges` on a grid, and the nudges track is `auto`, which sizes to INTRINSIC width. A sideways nowrap strip of five buttons has the intrinsic width of all five — `overflow-x` hides the excess but does not shrink the wish, and a percentage `max-width` is ignored during track sizing. So the track ate the row, the title collapsed to a few letters, and the pin and bin stacked in the sliver left over. The capture screen failed the same way one layer down: nowrap chips shrank their picker wrappers until `Pick date` sat on `Pick time`. Both strips are vertical now — his instruction, and also what the geometry wants, since a column's intrinsic width is one label. The push ladder is a column capped at 70px (two and a half rungs); the date chip row wraps as chips do everywhere else, capped at 96px (two rows and a hint of the third). No scrollbars drawn; the half-cut rung/row is the affordance; first rung always in view.

**A scrolled screen slid back under the clock.** The env() padding positions only the unscrolled page — padding scrolls away with the content it wraps. A fixed, paper-coloured, touch-inert strip exactly the inset's height sits over the top edge now; scrolled content passes behind it. 0px in a browser tab.

**The glyphs state width/height attributes as well as the CSS rule** — an unsized SVG is 300×150 by default, and one late stylesheet is all it takes.

**The screenshots also confirmed session 119's diagnostics working**: header reads the build, the account screen names the APK's Kotlin as build 1 against expected 2 with the rebuild sentence, unreadable switches say `unknown`, readable ones say `on`. The APK rebuild instruction stands; no Kotlin changed this session.

**Files changed:** `index.html`, `shell/render.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `shell/mvp.row.js`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Versions:** shell 36. Everything else unchanged: example 41, contract 52, config a.18, answer_key 28. No schema change, no migration, no Kotlin change.

**Tests:** all six green. gate2 PASS (sealed at 447), selftest 28/28, gate4 142/142, check_render exact, check_loud 6/6, check_alarm PASS. Layout is the one thing these cannot see; the fix is geometry reasoned in writing and needs the phone.

**Not tested:** the vertical scrollers, the capped heights and the scrim need the phone. The permission rows still wait on the APK rebuild.

**Save point:** `the strips scroll down, the row got its width back, the clock sits on paper`

**Next job:** rebuild the APK, then the nine alarm tests.

---
## Session 121 — 18 August 2026

**Job: eleven reports from build 36, one structural — a pick should put no words in the box.**

**SEARCH NEVER WORKED FROM A PHONE.** The matcher compares against `normalised` (lowercase); a phone keyboard capitalises the first letter of anything; so `Pcb` scored zero against `pcb pin requirement`. The capture box never hit it — its line is normalised inside the engine — which is why every desktop test passed. Lowercased at the call site.

**A PICK PUTS NO WORDS IN THE BOX.** A date still arrives one way, through words in the ONE line the engine reads; what moved is where the words live on screen. The box holds what was typed; picked words compose onto the line's end under a `chip_span`; the tick chip shows the reading and takes the pick back. Date pick replaces the picked date, time pick replaces the picked time, the two coexist (Tonight + 9pm → tonight at 9pm, proved headlessly). A pick on an empty box waits, previewed on the tick — composed immediately, the date words became the title. Engine, contract inputs, key untouched.

**THE DATE BLOCK IS THREE PIECES.** Pinned row (tick, Pick date, Pick time) that never scrolls; a date scroller of ten phrases, each proved against the engine before joining config a.19 (`day after tomorrow` failed — reads `from tomorrow`, strands `day` in the title — and is out; This evening, Tomorrow afternoon/evening, Next weekend, Next week, Next month joined); the five times on their own row. Nothing anywhere is cut in half any more: the scroller and the push ladder fade at the bottom edge — the 120 half-cut affordance read as a defect, and was one.

**The rest.** Slot-owned header dates (Tomorrow wears tomorrow, Upcoming says where it starts, Ideas/Done wear nothing). Slot totals (`Today · 1h 40m`) — a logged amendment to session 89's quiet rule, the ONE place a duration appears; rows and push targets stay quiet. Panel order: notes, alarm, repeat, firmness, duration, type. Back button left screen 2; the head exists only while a task is bound. Account draws Turn on for `unknown` as well as `off`. Export: Downloads in a browser; inside the APK the WebView ignores blob downloads — recorded under FOUND, NOT FIXED, fix belongs to the next Kotlin session.

**Files changed:** `index.html`, `shell/render.js`, `shell/config.js`, `config.ts`, `shell/mvp.chips.js`, `shell/mvp.edit.js`, `shell/mvp.panel.js`, `shell/mvp.list.js`, `shell/mvp.account.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `contract.md`, `example.md` (chip rows redrawn in both boxes), `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Versions:** example 42, contract 52, config a.19, shell 37, answer_key 28. Config still 37 objects; `ensureConfig()` upserts a.19, no migration, no Kotlin change.

**Tests:** all six green. gate2 PASS (sealed 459), selftest 28/28, gate4 142/142, check_render exact against the redrawn example box, check_loud 6/6, check_alarm PASS. Proved headlessly: all ten presets resolve with clean titles; box+pick composition resolves at every combination tried; the empty-box guard holds.

**Not tested:** everything visual needs the phone. The APK rebuild from session 119 is still pending and now also carries the export gap.

**Save point:** `search works from a phone, picks stay out of the box, nothing is cut in half`

**Next job:** rebuild the APK, then the nine alarm tests.

---
## Session 122 — 18 August 2026

**Job: build 37 on the phone — the scroll that read as vanished, the type control, four words for the alarm.**

**THE SCROLL DID NOT VANISH; ITS AFFORDANCE DID.** Build 37 capped the date scroller at exactly two rows, hid the scrollbar, and put the fade in the row gap where it painted nothing — two opaque rows with no hint below them is a wall whatever the overflow property says. His sizing stands now: one row visible per group (~3 options), the rest down a vertical scroll with a thin DRAWN scrollbar, a fade over real chips, and `overscroll-behavior: contain` so the strip scrolls instead of the page.

**THE TYPE CONTROL IS A DROPDOWN OF ALL FOURTEEN — a logged reversal of session 91, on his instruction.** Three chips answer "which of these three"; he asked "how many types are there", which they cannot. The native select wears the engine's guess as its value and is what the design always drew (`⟨action ▾⟩` since Stage 1), so the chips were the deviation and this is the return. Session 91's substance stands: one derived type, no runners-up, nothing guessed. The Type group left the advanced panel (same control twice); panel runs notes, alarm, repeat, firmness, duration. `type_suggestions` stays in config — the Stage 3 harness reads it — and the contract says so.

**Alarm note: `Needs an exact time.`** His edit, near verbatim.

**Files changed:** `index.html`, `shell/render.js`, `shell/mvp.edit.js`, `shell/mvp.panel.js`, `shell/mvp.css` (version), `shell/mvp.edit.css`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Versions:** shell 38, contract 53. Config unchanged at a.19 (37 objects), example 42, answer_key 28. No Kotlin change.

**Tests:** all six green; sealed 463.

**Not tested:** the drawn scrollbars, the fade, the dropdown and the one-row caps need the phone. APK rebuild from 119 still pending.

**Save point:** `the scroll shows itself, the type control answers how many, the alarm asks in four words`

**Next job:** rebuild the APK, then the nine alarm tests.

---
## Session 123 — 18 August 2026

**Job: the lock screen rang and wrote nothing; the alarm moves onto the capture screen; his slide review.**

**EVERY LOCK-SCREEN OUTCOME WAS SILENTLY LOST.** `apply()` passed the changed record alone to `tasks.update(...)` where the store's contract is `update(id, record)`; the store threw `is not here` into a catch and Done, Push, Snooze and the unanswered escalation all wrote NOTHING — the alarm rang correctly and then forgot everything it decided. All four branches now pass the id. Honesty note: `check_alarm.mjs` proves the pure functions and never calls `apply()`, so this walked straight past it — recorded in the log. Web-half fix only; no APK rebuild needed for it.

**A lock-screen Done spawns the repeat's next occurrence** exactly as the list's Done does. Before this, only the in-app press spawned, so a weekly task closed from the alarm screen silently ended its series.

**THE ALARM LIVES ON THE CAPTURE SCREEN** while the line carries an exact time: toggle + `rings 2:45pm` (due minus lead, config default). No time, no row; the panel keeps Lead and the four words.

**His slides:** date chips as TWO SIDE-BY-SIDE SCROLL COLUMNS (near `This…`/`Tonight` left, later right, ~3 chips each, drawn scrollbar + fade); repeat read back as one sentence (`every week on Tuesday at 3pm`, derived from the anchoring due date); `year` joined the repeat units (one line in `step()`, n×12 months — proved headlessly, 14 Aug 2026 + 1 year → 14 Aug 2027); number inputs wear sheet + drawn edge (a field, not a chip); the sticky header wears the paper (no band behind the bound chip); avatar is `•••`; the narrow bar's `+` is gone (FAB covers it; wide keeps `+`); push ladder shows three rungs; search covers every not-done task when text is present, placeholder `search all tasks`, and any slot/tab press clears it.

**Files changed:** `index.html`, `shell/render.js`, `shell/alarm.bridge.js`, `shell/repeat.js`, `shell/mvp.edit.js`, `shell/mvp.panel.js`, `shell/mvp.chips.js`, `shell/mvp.list.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `shell/mvp.wide.css`, `types.ts`, `contract.md`, `MVP.md`, `spec.md`, `sessions.md`, `log.manifest`

**Versions:** shell 39, contract 54. Config unchanged a.19, example 42, answer_key 28. No Kotlin change.

**Tests:** all six green; sealed 470. Year spawn proved headlessly.

**Not tested:** the fixed lock-screen outcomes and the capture-screen alarm need the phone.

**Save point:** `the lock screen keeps its word, the alarm shows itself before the panel, the chips know now from later`

**Next job:** his phone pass on build 39; the nine alarm tests, especially 9 (unanswered escalation), now that outcomes actually write.

---
## Session 124 — 18 August 2026

**Job: his build-39 slide review — nine items.**

**WHICHEVER TIME CAME LAST WINS.** A typed time outranked every later pick by sitting earlier in the composed line, so tapping `6pm` after typing `3pm` did nothing. A time pick now REPLACES the typed time token in the line; typing a time takes a standing pick back. His rule near verbatim ("whatever is typed or click last"). Logged as a Part-11 AMENDMENT to session 121's "picks put no words in the box" — replacing a time the person is superseding is not inserting words they did not choose. Detection regex covers usual typed shapes; a missed form keeps typed-wins, the safe side.

**A SCROLL IS NOT A PRESS.** Dragging the push ladder fired the rung's click. A press travelling >8px is swallowed before any rung hears it.

**A `Today` RUNG LEADS THE LADDER** for time/band/day tasks sitting on a later day — today at the task's own clock time, or now+1h if that has gone (a pull-forward that arrives overdue is a trap). gate4 unchanged — the key does not pin ladders.

**Alarm row sits directly under the box** (his arrow) and states the day: `rings 4:45pm today` / `tomorrow` / `on Monday` (inside six days) / `on 20th August` (beyond), plus `· repeats` when the task does.

**Repeat group redesigned to his slide:** Never button beside the `Repeat every` label, wearing the app's sentence once a repeat is set (`every Wednesday at 5pm`); tapping it always returns to never; number + four units on one line. FOCUS BUG: the panel's number inputs (repeat, lead, duration) repainted per digit via `input`, rebuilding the field out from under the caret — all three now fire on `change`.

**Screen words:** `Later` where the engine says `Upcoming` (records unchanged); no slot lit while a search is on. Slide 1's coloured band was already gone in build 39 (his screenshot was build 38) — verified, nothing further.

**Files changed:** `index.html`, `shell/render.js`, `shell/push.js`, `shell/mvp.edit.js`, `shell/mvp.panel.js`, `shell/mvp.list.js`, `shell/mvp.row.js`, `shell/mvp.css`, `shell/mvp.edit.css`, `spec.md`, `MVP.md`, `sessions.md`, `log.manifest`

**Versions:** shell 40. Contract 54, config a.19, example 42, answer_key 28 all unchanged. No Kotlin change.

**Tests:** all six green; sealed 476.

**Not tested:** every item needs the phone — especially the ladder drag guard and the caret staying put in the number boxes.

**Save point:** `the last time wins, a scroll is not a press, tomorrow can come to today`

**Next job:** his phone pass on build 40; the nine alarm tests remain, especially test 9.

---

## Session 125 — 20 August 2026

**Job:** His build-40 `UI_review.pptx` (four slides), a flowchart of the due date / alarm / repeat / snooze / push journey read off the code alone, and every inconsistency that reading found.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/catchup.js` — created. Repeats the calendar walked past, stepped forward on open
- `shell/mvp.truth.js` — created. The stylesheet repair and the loud line, out of `mvp.js` at the cap
- `shell/mvp.tap.js` — created. The press-vs-scroll rule, once, for every scrolling strip
- `shell/mvp.alarms.js` — created. Screen 4, every armed alarm
- `shell/check_search.mjs` — created. The seventh check
- `shell/mvp.row.js`, `shell/mvp.chips.js` — the shared guard on the ladder, both date columns and the times row
- `shell/search.js` — the prefix tier is per word
- `shell/repeat.js` — `nextDue()` anchors on `first_due_at || due_at`
- `shell/mvp.list.js` — Done calls `alarmCleared()`; the `Alarms` button after the `Done` tab
- `shell/mvp.edit.js` — the lead slider beside the Alarm toggle; an add returns to the list carrying its toast; a saved edit that moves the date clears the alarm's leftovers and `first_due_at`
- `shell/mvp.panel.js` — the Lead group removed; the duration is a ladder slider; the repeat sentence is not truncated
- `shell/mvp.js` — the `alarms` route, and the toast that travels with a back
- `shell/mvp.edit.css`, `shell/mvp.chrome.css` — the two sliders, the wrapping repeat chip, screen 4
- `shell/check_alarm.mjs` — five assertions for this session's three behaviour changes
- `android/…/AlarmActivity.kt` — paper, ink and signal instead of ink on dark
- `shell/render.js` 41, `index.html`, `shell/mvp.css`, `shell/mvp.edit.css` — the six version sites
- `spec.md`, `MVP.md` — screen 4, the two sliders, eleven decision-log entries

**Tests:** all seven green. gate2 PASS, selftest 28/28, gate4 142/142, check_render exact, check_loud 6/6, check_alarm PASS (twelve new assertions), check_search PASS (eleven). Log sealed at 490. Honest gap recorded: no check reaches `catchUpRepeats()` itself, only the pure functions under it.

**What the flowchart found.** Ten inconsistencies, four fixed in code, two recorded. The four: the in-app Done left a spent snooze and an unanswered marker behind where the lock-screen Done cleared both; a saved edit that moved the due date cleared neither, and `ringAt()` prefers a snooze still ahead, so the alarm rang at a time the task no longer had; `nextDue()` stepped from `due_at` after a push had overwritten it, so a pushed occurrence moved the whole series; and `alarmCleared()` — the function stating the rule all three of those break — was exported and called by nothing.

**His call on the repeat rule, made this session:** step it forward on open. `overtaken()` asks whether the next scheduled date has itself arrived — one interval, not one minute — and `catchup.js` closes the stranded occurrence as `cancelled` and spawns the schedule's next future date, before the list draws and before the alarms arm. The cancelled row shows on the Done tab, so the miss stays visible. No undo slot is spent and the new id is derived, so two devices opening at once write one row. `mvp.js` crossed the 400-line cap on the way and split by concern: `mvp.truth.js`. **Recorded, not fixed:** `repeatSentence()` reads `due_at` without its offset and `ringSentence()` reads it with one — they agree on every device this has run on, and they are one field with two readings on one screen.

**Still owed:** the nine alarm tests on a device, especially test 9; the APK rebuild, which this session's Kotlin change now needs on its own account; Gates 1–6, all waiting on his hand since session 101.

---

## Session 126 — 20 August 2026

**Job:** His build-41 `UI_review.pptx`, five slides, nine items.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/alarm.js` — `nextRing()`: a repeat's ring steps forward through its own rule
- `shell/alarm.bridge.js` — `armedFor` is the schedule's instant; `ALARM_SHELL_EXPECTED` 3
- `shell/repeat.js` — `step()` exported, so the ring and the record derive it from one place
- `shell/mvp.edit.js` — the editor speaks about the date the save will keep; the toggle owns the lead default
- `shell/mvp.panel.js` — the Alarm group removed
- `shell/mvp.alarms.js` — three plain sentences, pills, no push ladder
- `shell/mvp.row.js` — a Done row states its day and carries `Revive`
- `shell/mvp.chrome.css` — pill acts; the dead ladder rule removed
- `shell/check_alarm.mjs` — eleven assertions for the schedule-following ring
- `android/…/AlarmActivity.kt`, `CascadeAlarmPlugin.kt` — the shell build, stated once and drawn
- `shell/render.js` 42, `index.html`, `shell/mvp.css`, `shell/mvp.edit.css`, `spec.md`, `MVP.md`

**Tests:** all seven green. Log sealed at 498.

**The one that mattered.** His slide asked "people need to know when will it ring next" and the honest answer was that it never would: an occurrence rings once, a spent instant is never armed, and the next occurrence only exists after a Done. A daily alarm rang once and stopped while the screen still said `every day`. The ring follows the rule now and the record is untouched.

**Still owed:** the APK rebuild, now two sessions deep — the paper lock screen and its build number both need it. The nine alarm tests on a device. Gates 1-6, waiting on his hand since session 101.

---

## Session 127 — 20 August 2026

**Job:** Reach the two write paths no check could reach.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/alarm.apply.js` — created. `apply()` out of the bridge, taking the store as an argument
- `shell/check_writes.mjs` — created. The eighth check, 28 assertions
- `shell/alarm.bridge.js` — delegates; three imports it no longer needs are gone
- `shell/catchup.js` — takes the store instead of importing it
- `shell/mvp.js` — hands the store in
- `shell/render.js` 43 and the five other version sites, `spec.md`, `sessions.md`

**Tests:** all eight green. Log sealed at 500.

**The point.** Session 123's defect was `update(record)` for `update(id, record)` in four branches, and six green checks missed it for four days because every value those branches computed was correct — the bug was in the CALL. A write path that imports the real store cannot be imported by a check at all, so the seam had to move before an assertion was possible. The store this check hands in throws when `update` is given anything but `(id, record)`. Proved by reverting one branch and watching the run fail.

**Still owed:** the APK rebuild, two sessions deep. The nine alarm tests on a device. Gates 1-6.

**Post-delivery fix, same day.** Session 126's `SHELL_BUILD` was added as a SECOND `companion object` in `CascadeAlarmPlugin.kt`, which Kotlin refuses — one per class. It reached him as a broken build and cost him a round trip through Android Studio. Moved into the companion the class already had. THE REAL GAP, recorded: nothing in this project compiles Kotlin. `gate2.py` runs `tsc --strict` over the web half; the six Kotlin files are read by no tool at all, so any Kotlin defect is found by him, on a phone, after a rebuild.

---

## Session 128 — 20 August 2026

**Job:** His `UI_review_R2.pptx`. Slide 2 was stale (builds 42 and 43 fixed both items); slide 3 was the lock screen with four asks.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/alarm.apply.js` — `CANCEL` and `DISMISS`
- `shell/alarm.bridge.js` — five push targets, the `repeats` flag, expected shell 4
- `shell/push.js` — the `time` ladder holds +1, +2, +3, +4 hours
- `shell/check_writes.mjs` — thirteen assertions for the two new verbs
- `android/…/AlarmActivity.kt` — scrolling rungs, `Pick…`, two cancel buttons
- `android/…/AlarmActionReceiver.kt`, `AlarmStore.kt`, `CascadeAlarmPlugin.kt` — the two verbs, the `repeats` field, shell build 4
- `shell/render.js` 44 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green.

**Stated plainly:** four Kotlin files changed and nothing in this project compiles Kotlin. Braces, parens and companion objects were checked by hand after session 126 shipped a file that could not compile. That is not a compiler.

---

## Session 129 — 20 August 2026

**Job:** His build-44 phone pass. Seven reports.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/alarm.js` — the versionless import, versioned
- `gate2.py` — a relative import in `shell/` without `?v=` is a failure
- `shell/alarm.bridge.js` — `armedAlarms()`, the shell's own list
- `shell/mvp.js` — `popstate` restores without pushing
- `shell/mvp.list.js` — a revived repeat lands on its next scheduled date
- `shell/mvp.edit.js` — the screen keeps the record it was handed
- `shell/mvp.row.js` — `Cancelled` on a cancelled row
- `shell/mvp.alarms.js` — a Repeats view, and `NOT armed on this phone`
- `shell/mvp.account.js`, `mvp.account.css` — the APK link
- `shell/mvp.chrome.css`, `render.js` 45 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green, with two stated warnings for the engine's own imports.

**On his item 4** — a revived task with an alarm, then edited, going missing — the cause is almost certainly the same catch-up collision as Revive, since a revived stale repeat was being cancelled on the next open whether or not it had been edited. Worth re-running on 45 before anything else is built for it.

**Still owed:** the APK rebuild to alarm shell build 4. The nine alarm tests. Gates 1-6.

---

## Session 130 — 20 August 2026

**Job:** Two reports from his build-45 pass.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/alarm.apply.js` — the instant parse reads its offset
- `shell/check_writes.mjs` — drift assertions at two offsets, with a fresh fixture
- `shell/mvp.list.js` — the bin cancels; `purge` is the only erase
- `shell/mvp.row.js` — `Delete for good` on a Done row; the bin says `Cancel`
- `shell/mvp.alarms.js` — `Delete` is `Cancel task` on both views
- `shell/render.js` 46 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green.

**The one that mattered.** One line read a local wall clock as UTC. On +05:30 that put every lock-screen Done's `updated_at` five and a half hours in the future, and the database's newest-wins trigger then refused every later write to that task in silence. Revive was never broken. Two sessions were spent looking at the wrong half of it — the catch-up collision in 129 was real and also a cause, which is what made this one hard to see.

**Still owed:** the APK rebuild to alarm shell build 4. The nine alarm tests. Gates 1-6.

---

## Session 131 — 20 August 2026

**Job:** His `UI_review_R2.pptx`, re-uploaded with new contents. Five items, three of which session 130 never saw.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/mvp.edit.js` — `||` not `??`: the stored-date fallback, finally reached
- `shell/mvp.account.js` — the APK link opens externally and is drawn once
- `shell/alarm.bridge.js` — four rungs to the lock screen; expected shell 5
- `android/…/AlarmActivity.kt` — the pickers on their own line, `Pick time` added
- `android/…/CascadeAlarmPlugin.kt` — shell build 5
- `shell/render.js` 47 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green.

**Process failure, recorded.** Session 130 was handed this file and did not open it, answering only the two items he had also typed in chat. Three items sat unread in the deck. A re-uploaded file with a familiar name is a new file.

**Still owed:** the nine alarm tests. Gates 1-6.

---

## Session 132 — 20 August 2026

**Job:** Four items from his build-47 pass.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/mvp.row.js` — the bell and the loop; the title row
- `shell/mvp.list.js`, `shell/mvp.edit.js`, `shell/mvp.alarms.js`, `shell/mvp.account.js` — undo removed
- `shell/push.js` — `Later today` lands today or is not offered
- `shell/check_alarm.mjs` — four assertions for that rung
- `shell/mvp.account.js`, `mvp.account.css` — the APK link on another host, with the address as text
- `shell/mvp.chrome.css`, `render.js` 48 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green.

**Note for the next pass.** The APK link now points at `raw.githubusercontent.com/freezigo-raj/cascade/main/app-debug.apk`, which assumes the file is committed at the repository root on `main`. If it is not, the address under the button is the one to use, and he should say which of the two hosts works — that is the one thing reasoning from here cannot settle.

**Still owed:** the nine alarm tests. Gates 1-6.

---

## Session 133 — 20 August 2026

**Job:** "All my tasks from all tabs vanished." Session 132's defect, found by him within the hour.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/mvp.list.js` — `say()` restored
- `eslint.config.mjs` — created. One rule: `no-undef`
- `gate2.py` — runs it when eslint is present, warns loudly when it is not
- `shell/render.js` 49 and the five other version sites, `spec.md`

**Tests:** all eight green, plus `no-undef` clean across the shell.

**The lesson, and it is the same one as session 123 in a different coat.** The value was never wrong; the NAME did not exist. Nothing in this project had ever asked that question, and a screen still cannot be mounted by any check because every screen imports the real store at module load. That seam is the next thing worth building.

**No data was lost.** The store was never written to. The screen simply never drew.

**Still owed:** the nine alarm tests. Gates 1-6.

---

## Session 134 — 20 August 2026

**Job:** His question: are done and cancelled tasks being checked for similarity? Yes, they were.

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/cards.js` — `isOpen` exported, and `onDefaultList` reads it
- `shell/resolve.js` — the duplicate check filters to open tasks
- `shell/search.js` — the same test, written out, with the reason it is not imported
- `shell/check_search.mjs` — five assertions that the panel and the dialog share a set
- `shell/render.js` 50 and the five other version sites, `spec.md`, `MVP.md`

**Tests:** all eight green.

**Why it surfaced now.** The rule has always read the whole store. Session 130 made the bin cancel rather than erase, so the closed set grows with every dropped task instead of vanishing — and a rule that was wrong quietly for a hundred sessions became wrong loudly in four days.

**Named, not done:** three engine files still carry their own copy of the open-task predicate. Consolidating them needs the engine's static-import style settled against gate2's version rule.

**Still owed:** the nine alarm tests. Gates 1-6.

---

## Session 135 — 20 August 2026

**Job:** The two items named as owed at the end of 134, and "forget the gates now".

**Stage before / after:** 5 / 5

**Files changed:**
- `shell/resolve.js` — five imports carry the version
- `shell/search.js`, `shell/clash.js`, `shell/push.js`, `shell/cards.js` — one `isOpen`
- `shell/repeat.js`, `shell/alarm.js` — the two remaining copies, named in place
- `gate2.py` — the excuse list removed, comments stripped before the import scan
- `spec.md` — the gates retired
- `shell/render.js` 51 and the five other version sites

**Tests:** all eight green, `no-undef` clean.

**The gates.** Retired rather than deferred. Five of six had been owed since session 101 and the app shipped to his phone every day regardless. The checks, the linter and his own use are what have been finding defects; the gates were finding none because nobody was running them.

**Still owed:** the nine alarm tests on the phone, and the workflow migration under DECIDED, NOT BUILT.
