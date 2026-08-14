# Cascade Part A — Answer Key

Stage 4 deliverable, version 28. Written against `schema/contract.md` and `config.ts`; see VERSIONS in spec.md.

**Every `action_verbs` member is reachable from `verb_lexicon`, checked by `gate2.py` against whichever config is in force.** Version 1 of this key expected eleven members that no lexicon entry could produce, because `verb_lexicon` was never updated when the members were added. The gate now fails on a dead member. No config version is named here: a version written into a companion file is what `gate2.py` exists to stop.

**Three ways a cell can read.** A value is an assertion the runner checks. `*(empty)*` asserts that the field is empty, which is also checked. `—` says the key states nothing for that field, and the runner skips it. A blank cell is none of these: it is an unfinished row, and the runner now fails on one rather than passing whatever the engine returns.

**Similarity is defined in `schema/contract.md`, not here.** Trigrams are a multiset over the `compare_key` padded with two leading spaces and one trailing space, `word_match` is over token sets, and the maximum is rounded half-up to two decimals before it meets `threshold`. Every score below was recomputed from that definition rather than by hand.

**Written by hand from the contract, before any logic exists.** No code produced any value below. Where a value is wrong, the contract is wrong or I read it wrong, and both are things to find now rather than after a resolver agrees with them.

**Every case that runs must disagree with the Stage 3 placeholder on at least one value stated here.** A case that cannot disagree is not a test. It names the gate that answers it in a `Handled by` cell and is reported as not run, rather than being counted as a failure it did not earn.

**`now` for every case:** `2026-08-03T10:40:00+05:30`, Monday. Same anchor as `spec/example.md`.

Every date below carries its weekday, and `gate4.mjs` checks the weekday against the date: a row that says Friday about a Thursday stops the run. Reference dates: Sat 1 Aug, Sun 2 Aug, **Mon 3 Aug** (the shared `now`), Tue 4 Aug, Fri 7 Aug, Sat 8 Aug, Sun 9 Aug, Mon 10 Aug, Thu 13 Aug, Sun 16 Aug, Thu 20 Aug, Tue 1 Sep, Wed 16 Sep.

**A case with its own clock says so in its second column.** Three do. Read that column before the row: `next month` means September at the shared `now` and August at a July one, and both are right.

Window bounds, half-open, from `window_bounds` and `time_bands`:

| Window | Bounds | Midpoint |
|---|---|---|
| day | `[09:00, 24:00)` | 16:30 |
| morning | `[09:00, 12:00)` | 10:30 |
| afternoon | `[12:00, 18:00)` | 15:00 |
| evening | `[18:00, 21:00)` | 19:30 |
| night | `[21:00, 24:00)` | 22:30 |
| weekend | `[Sat 09:00, Mon 00:00)` | Sun 04:30 |
| week | `[Mon 09:00, next Mon 00:00)` | Thu 16:30 |
| month | `[1st 09:00, 1st next 00:00)` | 30-day 04:30, 31-day 16:30 |

---

## A. Verbs, one per member

`due` empty on all of these, so all route to **Ideas**.

| # | Input | `verb_phrase` | `action_verb` | `commitment_type` | `context` | `est_duration_min` | list |
|---|---|---|---|---|---|---|---
| A1 | `call kushan` | `call` | `call` | `action` | `phone` | 15 | Ideas |
| A2 | `check sensor` | `check` | `check` | `action` | `undetermined` | 30 | Ideas |
| A3 | `pay coolindia` | `pay` | `pay` | `deadline` | `bills` | 10 | Ideas |
| A4 | `submit the tender` | `submit` | `submit` | `deadline` | `bills` | 30 | Ideas |
| A5 | `message vivek` | `message` | `message` | `action` | `phone` | 5 | Ideas |
| A6 | `make finance software` | `make` | `make` | `project` | `undetermined` | 60 | Ideas |
| A7 | `meet the supplier` | `meet` | `meet` | `appointment` | `undetermined` | 60 | Ideas |
| A8 | `send energy data to om` | `send` | `send` | `action` | `phone` | 5 | Ideas |
| A9 | `reply to dishit` | `reply` | `reply` | `action` | `phone` | 5 | Ideas |
| A10 | `talk to rajkot customer` | `talk` | `talk` | `action` | `phone` | 15 | Ideas |
| A11 | `give arshad ledger` | `give` | `give` | `action` | `undetermined` | 10 | Ideas |
| A12 | `file form 8` | `file` | `file` | `deadline` | `bills` | 30 | Ideas |
| A13 | `sharad DSC renew` | `renew` | `renew` | `deadline` | `undetermined` | 30 | Ideas |
| A14 | `demo trial date finalize` | `finalize` | `finalize` | `decision` | `undetermined` | 30 | Ideas |
| A15 | `confirm testing` | `confirm` | `confirm` | `action` | `undetermined` | 10 | Ideas |
| A16 | `karjat booking` | `booking` | `book` | `purchase` | `undetermined` | 20 | Ideas |
| A17 | `billing for prompt` | `billing` | `bill` | `deadline` | `bills` | 15 | Ideas |
| A18 | `hiring viraj IT` | `hiring` | `hire` | `project` | `undetermined` | 60 | Ideas |

**`check` gives `undetermined`.** A2 and A26 read `phone` through version 7, which was wrong: `phone` says the work happens on a phone, and checking a sensor is the sensor. `verb_to_context` holds only the verbs that imply a context, so `check` has no entry and R3 gives `undetermined`, which is what the engine does. `confirm` and `give` were already `undetermined` in this table on the same reasoning.

**A19 to A22, the lexicon gaps.** Nothing in `verb_lexicon` matches.

| # | Input | `verb_phrase` | `action_verb` | `commitment_type` | `context` | `est_duration_min` | list | Note |
|---|---|---|---|---|---|---|---|---|
| A19 | `Srilanka tickets` | *(empty)* | `other` | `action` | `undetermined` | 5 | Ideas | `tickets` is deliberately absent from `verb_lexicon` |
| A20 | `Kena investment` | *(empty)* | `other` | `action` | `undetermined` | 5 | Ideas | Same. These two are the only rows in section A written to be `other`; A22, C2, F5, F9 and seven G rows reach it too. |
| A22 | `tasks` | *(empty)* | `other` | `action` | `undetermined` | 5 | Ideas | One word, no match |

**A28 to A31 are the shapes of a word, not new words.** The lexicon held 52 tokens for 18 verbs and a third of them were endings someone had typed once and added by hand, which is a list that can never be finished: `replied`, `booked` and `paid` were all missing and all fell to `other`. Endings are English spelling and are read by the engine; irregular forms are vocabulary and sit in `verb_irregulars` beside the date shorthand. A30 is a verb of two words, which one token at a time could not express at all.

**A32 and A33 are `by` without a date after it.** Paying by cheque is how the payment is made. A weak, start or point marker counts only when the date starts right after it, so `by` stays in the title in both, and in A33 the date is still Friday. A strong marker is exempt and has to be: A23's `deadline` carries no date and must still be hard.

**A21 and A23 to A27, nouns and sentence shapes.** A21 and A23 are nouns supplying the verb; A24 to A26 are one task each, with the first *matching* token winning rather than the first word. A21 read `other` through version 3, which was wrong: `itr` is in `verb_lexicon` and gives `file`. Table membership follows the shape being shown, not the id order, which is why A21 sits here and A22 sits above.

| # | Input | `verb_phrase` | `action_verb` | `commitment_type` | `context` | `est_duration_min` | `title` | `date_marker` | `date_firmness` | `date_precision` | `date_anchor` | `due_at` | list | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A21 | `personal ITR` | `ITR` | `file` | `deadline` | `bills` | 30 | `personal ITR` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | Corrected at version 4. The noun carries the verb. |
| A23 | `Social alpha application deadline` | `application` | `submit` | `deadline` | `bills` | 30 | `Social alpha application` | `deadline` | `hard` | `none` | `none` | *(empty)* | Ideas | Routes to Ideas while carrying `is_hard = true` |
| A24 | `call surat vehicle and confirm testing` | `call` | `call` | `action` | `phone` | 15 | `call surat vehicle and confirm testing` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | One task. `confirm` stays in the title and does nothing. |
| A25 | `make testing procedure and finalize steps` | `make` | `make` | `project` | `undetermined` | 60 | `make testing procedure and finalize steps` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | One task |
| A26 | `trial and check data` | `check` | `check` | `action` | `undetermined` | 30 | `trial and check data` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | `trial` is not in the lexicon, so the second token wins |
| A27 | `call kushan 30 min` | `call` | `call` | `action` | `phone` | 15 | `call kushan 30 min` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | A typed duration is not read. The words stay in `title`. |
| A28 | `replied to bharti singhal` | `replied` | `reply` | `action` | `phone` | 5 | `replied to bharti singhal` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | An ending, not an entry. `replied` reaches `reply` by spelling. |
| A29 | `paid coolindia` | `paid` | `pay` | `deadline` | `bills` | 10 | `paid coolindia` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | An irregular form. No spelling rule reaches it; `verb_irregulars` does. |
| A30 | `follow up with raj` | `follow up` | `reply` | `action` | `phone` | 5 | `follow up with raj` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | A verb of two words. One token at a time could not express it. |
| A31 | `submitting the tender` | `submitting` | `submit` | `deadline` | `bills` | 30 | `submitting the tender` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | A doubled letter goes with the ending. |
| A32 | `pay by cheque` | `pay` | `pay` | `deadline` | `bills` | 10 | `pay by cheque` | *(empty)* | `normal` | `none` | `none` | *(empty)* | Ideas | `by` with no date after it is not a marker, and stays in the title. |
| A33 | `pay by cheque friday` | `pay` | `pay` | `deadline` | `bills` | 10 | `pay by cheque` | *(empty)* | `normal` | `day` | `window` | Fri 7 Aug 16:30 | Default | Due Friday, and `by` still not a marker: the date does not start after it. |

---

## B. Time expressions

All with the same body, `call kushan`, so only the date fields differ. `action_verb` `call`, 15 min throughout.

| # | now | Input date part | `title` | `date_marker` | `date_phrase` | `date_precision` | `date_anchor` | `earliest_start` | `due_at` | `has_time` | `date_firmness` | list | `due_phrase` |
|---|---|---|---|---|---|---|---|---|---|---|---|------|
| B1 | — | `today` | `call kushan` | *(empty)* | `today` | `day` | `window` | Mon 3 Aug 10:40 | Mon 3 Aug 17:20 | false | `normal` | Default | `Due today` |
| B2 | — | `tomorrow` | `call kushan` | *(empty)* | `tomorrow` | `day` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 16:30 | false | `normal` | Default | `Due tomorrow` |
| B3 | — | `friday` | `call kushan` | *(empty)* | `friday` | `day` | `window` | Fri 7 Aug 09:00 | Fri 7 Aug 16:30 | false | `normal` | Default | `Due Friday` |
| B4 | — | `this friday` | `call kushan` | *(empty)* | `this friday` | `day` | `window` | Fri 7 Aug 09:00 | Fri 7 Aug 16:30 | false | `normal` | Default | `Due Friday` |
| B5 | — | `by friday` | `call kushan` | `by` | `friday` | `day` | `end` | *(empty)* | Fri 7 Aug 23:59:59 | false | `hard` | Default | `Due Friday` |
| B6 | — | `before friday` | `call kushan` | `before` | `friday` | `day` | `end` | *(empty)* | Fri 7 Aug 23:59:59 | false | `hard` | Default | `Due Friday` |
| B7 | — | `after friday` | `call kushan` | `after` | `friday` | `day` | `start` | Fri 7 Aug 09:00 | *(empty)* | false | `normal` | Default | `From Friday` |
| B8 | — | `morning` | `call kushan` | *(empty)* | `morning` | `band` | `window` | Mon 3 Aug 10:40 | Mon 3 Aug 11:20 | false | `normal` | Default | `Due this morning` |
| B9 | — | `afternoon` | `call kushan` | *(empty)* | `afternoon` | `band` | `window` | Mon 3 Aug 12:00 | Mon 3 Aug 15:00 | false | `normal` | Default | `Due this afternoon` |
| B10 | — | `tonight` | `call kushan` | *(empty)* | `tonight` | `band` | `window` | Mon 3 Aug 21:00 | Mon 3 Aug 22:30 | false | `normal` | Default | `Due tonight` |
| B11 | — | `weekend` | `call kushan` | *(empty)* | `weekend` | `span` | `window` | Sat 8 Aug 09:00 | Sun 9 Aug 04:30 | false | `normal` | Default | `Due this weekend` |
| B12 | — | `next week` | `call kushan` | *(empty)* | `next week` | `week` | `window` | Mon 10 Aug 09:00 | Thu 13 Aug 16:30 | false | `normal` | Default | `Due next week` |
| B13 | — | `next month` | `call kushan` | *(empty)* | `next month` | `month` | `window` | Tue 1 Sep 09:00 | Wed 16 Sep 04:30 | false | `normal` | Default | `Due next month` |
| B14 | — | `20 aug` | `call kushan` | *(empty)* | `20 aug` | `day` | `window` | Thu 20 Aug 09:00 | Thu 20 Aug 16:30 | false | `normal` | Default | `Due 20 Aug` |
| B15 | — | `at 5pm` | `call kushan` | `at` | `5pm` | `time` | `point` | *(empty)* | Mon 3 Aug 17:00 | **true** | `normal` | Default | `Due at 5pm` |
| B16 | — | `by 5pm` | `call kushan` | `by` | `5pm` | `time` | `end` | *(empty)* | Mon 3 Aug 17:00 | **true** | `hard` | Default | `Due at 5pm` |
| B17 | — | `after 5pm` | `call kushan` | `after` | `5pm` | `time` | `start` | Mon 3 Aug 17:00 | *(empty)* | **true** | `normal` | Default | `From 5pm` |
| B18 | — | `someday` | `call kushan` | *(empty)* | `someday` | `open` | `none` | *(empty)* | *(empty)* | false | `normal` | Ideas | *(empty)* |
| B19 | — | `after audit` | `call kushan after audit` | *(empty)* | *(empty)* | `none` | `none` | *(empty)* | *(empty)* | false | `normal` | Ideas | *(empty)* |
| B20 | — | *(no date)* | `call kushan` | *(empty)* | *(empty)* | `none` | `none` | *(empty)* | *(empty)* | false | `normal` | Ideas | *(empty)* |
| B21 | — | `maybe … tomorrow` | `call kushan` | *(empty)* | `tomorrow` | `day` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 16:30 | false | **`soft`** | Default | `Due around tomorrow` |
| B22 | — | `friday 5pm` | `call kushan` | *(empty)* | `friday 5pm` | `time` | `point` | *(empty)* | Fri 7 Aug 17:00 | **true** | `normal` | Default | `Due Friday at 5pm` |
| B23 | — | `yesterday` | `call kushan` | *(empty)* | `yesterday` | `day` | `window` | Sun 2 Aug 09:00 | Sun 2 Aug 16:30 | false | `normal` | Default | `Overdue since Sunday` |
| B24 | — | `1 aug` | `call kushan` | *(empty)* | `1 aug` | `day` | `window` | Sat 1 Aug 09:00 | Sat 1 Aug 16:30 | false | `normal` | Default | `Overdue since Saturday` |
| B25 | Mon 3 Aug 14:00 | `morning` | `call kushan` | *(empty)* | `morning` | `band` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 10:30 | false | `normal` | Default | `Due tomorrow` |
| B26 | Wed 15 Jul 10:40 | `next month` | `call kushan` | *(empty)* | `next month` | `month` | `window` | Sat 1 Aug 09:00 | Sun 16 Aug 16:30 | false | `normal` | Default | `Due next month` |
| B27 | Sun 9 Aug 23:30 | `today` | `call kushan` | *(empty)* | `today` | `day` | `window` | Sun 9 Aug 23:30 | Sun 9 Aug 23:45 | false | `normal` | Default | `Due today` |
| B28 | Sun 9 Aug 23:30 | `tomorrow` | `call kushan` | *(empty)* | `tomorrow` | `day` | `window` | Mon 10 Aug 09:00 | Mon 10 Aug 16:30 | false | `normal` | Default | `Due tomorrow` |
| B29 | — | `in 30 mins` | `call kushan` | *(empty)* | `in 30 mins` | `time` | `point` | *(empty)* | Mon 3 Aug 11:10 | **true** | `normal` | Default | `Due in 30 mins` |
| B30 | — | `in 2 hours` | `call kushan` | *(empty)* | `in 2 hours` | `time` | `point` | *(empty)* | Mon 3 Aug 12:40 | **true** | `normal` | Default | `Due in 2 hours` |
| B31 | — | `morning 14:00` | `call kushan` | *(empty)* | `morning 14:00` | `time` | `point` | *(empty)* | Mon 3 Aug 14:00 | **true** | `normal` | Default | `Due at 2pm` |
| B32 | — | `in 20 hours` | `call kushan` | *(empty)* | `in 20 hours` | `time` | `point` | *(empty)* | Tue 4 Aug 06:40 | **true** | `normal` | Default | `Due tomorrow at 6:40am` |
| B33 | — | `5.30pm` | `call kushan` | *(empty)* | `5.30pm` | `time` | `point` | *(empty)* | Mon 3 Aug 17:30 | **true** | `normal` | Default | `Due at 5:30pm` |
| B34 | — | `5 pm` | `call kushan` | *(empty)* | `5 pm` | `time` | `point` | *(empty)* | Mon 3 Aug 17:00 | **true** | `normal` | Default | `Due at 5pm` |
| B35 | — | `tmrw` | `call kushan` | *(empty)* | `tmrw` | `day` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 16:30 | false | `normal` | Default | `Due tomorrow` |
| B36 | — | `fri` | `call kushan` | *(empty)* | `fri` | `day` | `window` | Fri 7 Aug 09:00 | Fri 7 Aug 16:30 | false | `normal` | Default | `Due Friday` |
| B37 | — | `next friday` | `call kushan` | *(empty)* | `next friday` | `day` | `window` | Fri 14 Aug 09:00 | Fri 14 Aug 16:30 | false | `normal` | Default | `Due 14 Aug` |
| B38 | — | `tomorrow friday` | `call kushan` | *(empty)* | `tomorrow friday` | `day` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 16:30 | false | `normal` | Default | `Due tomorrow` |
| B39 | — | `friday tomorrow` | `call kushan` | *(empty)* | `friday tomorrow` | `day` | `window` | Fri 7 Aug 09:00 | Fri 7 Aug 16:30 | false | `normal` | Default | `Due Friday` |
| B40 | — | `by after friday` | `call kushan` | `after` | `friday` | `day` | `start` | Fri 7 Aug 09:00 | *(empty)* | false | `normal` | Default | `From Friday` |
| B41 | — | `after by friday` | `call kushan` | `by` | `friday` | `day` | `end` | *(empty)* | Fri 7 Aug 23:59:59 | false | `hard` | Default | `Due Friday` |
| B42 | — | `at 10AM` | `call kushan` | `at` | `10AM` | `time` | `point` | *(empty)* | Tue 4 Aug 10:00 | **true** | `normal` | Default | `Due tomorrow at 10am` |
| B43 | — | `1 aug at 5pm` | `call kushan` | `at` | `1 aug 5pm` | `time` | `point` | *(empty)* | Sat 1 Aug 17:00 | **true** | `normal` | Default | `Overdue since Saturday` |
| B44 | Mon 3 Aug 18:00 | `after 5pm` | `call kushan` | `after` | `5pm` | `time` | `start` | Mon 3 Aug 17:00 | *(empty)* | **true** | `normal` | Default | `From 5pm` |

**A marker leaves `title` with its date.** `by friday` resolves to an instant the card already shows, so `by` has nothing left to say and B5, B6, B7, B15, B16 and B17 all come out as `call kushan`. B19 keeps `after`, because `after audit` resolved nothing, the anchor is `none`, and `audit` is still there for the preposition to relate to. A strong marker leaves whether or not it had a date, because it carries no content of its own: E3 is `GST filing`. Settled in the contract.

**B15 and B22 settle `point`.** The anchor comes from the marker when there is one and from the expression when there is not, so a resolved time of day gives `point` whether or not `at` was typed. This reverses the earlier reading, where `at` was what produced `point`: B22 carries no marker, names one instant, and a word the user did not type cannot be what makes the anchor. `at` stays a marker so that it leaves `title` with its date, which is the only reason it is in a list at all. `this` in B4 stays inside the span: it changes no anchor, it picks which Friday.

**B22 settles a day against a time.** The time wins. The day supplies the date, the time supplies the instant, `date_precision` is `time` and the day window disappears. `date_phrase` keeps both words, because both were part of one expression.

**B25 settles the third arm of the band rule.** A band that has already ended rolls to the same band tomorrow: `morning` typed at 14:00 gives tomorrow's `[09:00, 12:00)` and a midpoint of 10:30. Resolving it in the past would make a task overdue the instant it was typed. Only bands roll. A named day in the past does not, which is B23 and B24.

**B1 is clipped.** Today's day window is `[09:00, 24:00)` and `now` is 10:40, so it clips to `[10:40, 24:00)` and the midpoint moves from 16:30 to 17:20. `earliest_start` records the clipped start.

**B19 is the one to argue about.** `after audit` has a start marker and no temporal expression, so `date_precision` is `none`, row 1 of the anchor order fires, and the anchor is `none`, not `start`. The start constraint is lost. `date_marker` still records `after`. This is a stated limit, not a bug, and it is the case a Part C blocker field would cover. Settled at version 4 and written into the contract.

**A start says when it can begin, and the card says so.** `From Friday`, `From 5pm`, `From 20 Aug`. `Due` would be a lie on a task with no due date, and silence was what these three said until version 27: a card with a title and nothing under it. The forms mirror `due_phrase` exactly so the two sentences cannot drift apart, and a time today says only the time, since `From today at 5pm` is longer and says no more.

**B44 is a start whose time has already gone, and it does not roll.** `after 5pm` typed at six means today: the person is saying when they can begin and they can already begin. A due date in the past is a task born late, which is why a bare `at 5pm` at six still means tomorrow; a start in the past is a task that has started. B42 and B44 are the same words an hour apart with the two anchors, which is what makes the exception readable.

**B7, B17 and B40 are in Default with no due date.** A start is a date, and a person who typed one is not filing an idea. Ideas is for a line carrying no date at all, which is B18, B19 and B20. These three carry no `deadline_band` either, so they rank below everything that has one, which is where a task you cannot start until Friday belongs rather than out of the list. They stated `Ideas` through version 25, when the list read `due_at` alone.

**B5 and B6 differ from B3 in two fields.** Plain `friday` means do it on Friday, midpoint 16:30. `by friday` means any time up to Friday, so no `earliest_start` and `due_at` at the window's last instant, which is 23:59:59 and not 23:59. The window is half-open and instants are stored to the second, so the last instant inside it is one second below the bound. That distinction is the whole reason `date_anchor` exists.

**B8 clips its start, as B1 does.** `morning` is `[09:00, 12:00)` and `now` is 10:40, so the window clips to `[10:40, 12:00)`, `earliest_start` records the clipped start and the midpoint is 11:20. Through version 8 this row clipped the midpoint and not the start, which is one rule behaving two ways on two rows.

**B23 and B24 are in the past.** A past window is not clipped, because clipping is what `now` does to today's window and `now` is outside these. `yesterday` resolves to 2 Aug 16:30 and lands overdue, which is a normal capture: a user typing a missed deadline is the commonest reason to type at all.

**B26 reaches the 31-day midpoint.** `next month` at a July `now` gives `[1 Aug 09:00, 1 Sep 00:00)`, thirty days and fifteen hours, midpoint 16 Aug 16:30. The window bounds table states that number and no case reached it before.

**B27 and B28 carry a second `now`.** Sunday 23:30. `today` clips to `[23:30, 24:00)` and the midpoint is 23:45; `tomorrow` is unaffected at 10 Aug 16:30. Every other case in this key shares one anchor, so an engine reading the wall clock instead of the handed-in `now` would pass all of them. These two are what catch it.

**A span wider than a day says the span.** B11, B12, B13 and B26 read `Due this weekend`, `Due next week` and `Due next month`. Each resolves to an instant so it can be ranked, and printing that instant would claim a precision the line never gave: `Due 16 Sep` for a task whose owner said `next month`. The record keeps the instant; the card keeps the words.

**B38 and B39 are two dates.** The first typed wins, and every date expression leaves `title`, loser included: a second one is the person correcting themselves, and leaving it behind puts a date on the card the record does not hold. Until version 23 the longest word won, so both rows took `tomorrow` and reversing the words changed nothing.

**B40 and B41 are two markers, and adjacency decides them, not order.** A weak, start or point marker counts only when the date starts right after it, so in `by after friday` it is `after` that touches the date and in `after by friday` it is `by`. Two markers can never both be adjacent, so the order rule has nothing left to decide for them. Both rows stated the opposite at version 23, when order was the rule and adjacency did not exist.

**B19's `after` is no longer a marker.** `audit` is not a date, so nothing sits after the word for it to relate. It stays in `title` where it always did, because the words around it still need it, and `date_marker` is empty rather than recording a relation to a date that is not there.

**B42 is a time that has gone.** `at 10AM` typed at 10:40 means tomorrow morning, as a band that has ended means tomorrow. Nobody types a time forty minutes past meaning forty minutes ago, and resolving it there makes a task overdue as it is typed.

**B43 is why that rule needs its guard.** The time stands beside a day the person named, so nothing rolls and the row is overdue. Only a bare time moves.

**B33 and B34 are shapes that were unread.** A minute separator can be a colon, a dot or nothing, and the meridiem can be its own word. Only `5pm` and `17:00` were read through version 21, so `5.30pm` and `5 pm` produced no date at all and the line silently became a dateless capture. A bare number with neither separator nor meridiem is still not a time, which is what keeps `file form 8` and `check pump 4` alone.

**B35 and B36 are shorthand.** `date_aliases` maps what a person types to the word it stands for, and the expansion happens before anything is looked up. The typed word is still what `date_phrase` reports and what leaves the title, so the record shows `tmrw` and the card shows `Due tomorrow`.

**B37 is `next`.** `next friday` is the Friday after the coming one, and it lands outside this week, which is why the card reads `Due 14 Aug` rather than `Due Friday`. `next` joins `this` and `on` as a word that picks which day the expression means and changes no anchor, so it leaves the title with the day it governs. Through version 21 it stayed behind, and the card read `call kushan next` about this Friday.

**B29 and B30 are `in`.** A length of time with `in` in front of it is an instant: 30 minutes from 10:40 is 11:10, two hours is 12:40. `in` sits inside the expression rather than in `marker_words`, because it changes no anchor and it is the whole of what makes a duration into a time. Without it, A27 shows the other reading: `call kushan 30 min` is a duration and is not read at all.

**A length of time answers in a length of time.** B29 and B30 read `Due in 30 mins` and `Due in 2 hours`, not `Due at 11:10am`. Someone who said *in half an hour* is not thinking in clock time, and the card should not make them convert. It holds while the answer stays a length: the same day and inside twelve hours. B32 is past that at twenty hours, and reads `Due tomorrow at 6:40am`, because by then the clock is the plainer thing to say.

**B31 is a contradiction.** A band and a clock time cannot both be right and 14:00 is not the morning, so the time wins and the band supplies no date. Both words stay in `date_phrase`, so both leave `title` and the card does not read `call kushan morning`.

---

## C. Lists and commas

| # | Input | `title` | `action_verb` | `est_duration_min` | `duration_source` | Note |
|---|---|---|---|---|---|---|
| C1 | `Payments to coolindia, sudhi, laptop` | `Payments to coolindia, sudhi, laptop` | `pay` | 30 | `summed` | Comma list after a single verb. 3 × 10. |
| C2 | `CA gstr1,3b,statement` | `CA gstr1,3b,statement` | `other` | 5 | `default` | Commas, no verb, so no sum |
| C3 | `Meet Priya, the new CFO, on Thursday` | `Meet Priya, the new CFO` | `meet` | 60 | `default` | One verb, but the commas are an appositive, not a list. `on Thursday` is the date and leaves whole. |
| C4 | `pay A, B` | `pay A, B` | `pay` | 20 | `summed` | Two items |
| C5 | `send bills and statement` | `send bills and statement` | `send` | 5 | `default` | `and`, not commas. No sum. |
| C6 | `pay coolindia invoice, sudhi` | `pay coolindia invoice, sudhi` | `pay` | 20 | `summed` | One comma, so two payments. The first chunk's word count is not read. |
| C8 | `pay sudhi, coolindia invoice` | `pay sudhi, coolindia invoice` | `pay` | 10 | `default` | The same two chunks the other way round. The chunk after the comma is two words, so no sum. |
| C7 | `pay a, b, c, d` | `pay a, b, c, d` | `pay` | 40 | `summed` | Four single-token items. 4 × 10. |
| C9 | `call kushan, tomorrow` | `call kushan` | `call` | 15 | `default` | One call, tomorrow. The date leaves before the commas are counted, and the comma leaves with it. |
| C10 | `pay a tomorrow, b` | `pay a, b` | `pay` | 20 | `summed` | Two payments and a date. The comma separated the items, not the date, and stays. |

**C3 is settled.** A comma list sums only when every item is a single token. `sudhi` is one token and `the new CFO` is three, so C1 sums and C3 does not. Written into the contract at version 4, and fitted rather than derived.

**C6 changed at version 15, with the rule it was written for.** Through version 14 the rule counted the words in every item, including the first, which meant something had to throw away `Payments` and `to` before `coolindia` could be a single-word item, and nothing said what. Counting commas instead removes the need: two commas are three payments, and the first chunk is one item whatever it holds. C6 sums to 20 under the new reading, where it stayed at 10 under the old.

**C10 is the comma a date was standing next to.** Through version 21 the span took `tomorrow,` with its comma, so the comma left the line with the date and `pay a, b` drew as `pay a b` and summed as one item. Trailing punctuation was never part of the expression: what the title drops is the words, and a comma beside them was separating something else.

**C9 is where the commas are counted.** `call kushan, tomorrow` read as two calls until version 18, because the comma counter ran on the typed line and `tomorrow` sat after a comma. It runs on `title` now, so the date is gone before anything is counted, and the comma that was separating the date from the task goes with it rather than being left at the end of the card.

**C3 states a `title` because of what it caught.** `on Thursday` is the date and `on` used to stay behind, so the card read `Meet Priya, the new CFO, on`. `on` belongs to the expression, the way `this` does in `this friday`. Every row in this section states a title now, since a comma rule that changes what is counted can change what is drawn.

**C7 and C8 separate the rule from its rivals.** *Sum only when there are three items or fewer* fits C1 to C6 and refuses C7, which the stated rule sums. *Sum only when no item carries a determiner* also fits C1 to C6, and sums C8, where the chunk after the comma is two words with no determiner in sight and the stated rule refuses. C8 is C6's two chunks in the other order, which is what makes the pair readable: the same words sum one way round and not the other, because only the chunks after a comma are counted.

---

## D. Duplicates

Each row is a second capture while the first is already open. `now` unchanged.

`existing_tasks` hands the open tasks in whole, so each row states the existing task's stored `normalised`. That is what the comparison actually runs over, and it is derived by the same rule as column 4 of section E.

| # | Existing | Existing `normalised` | New | `compare_key` | `numeric_variant` | trigram | word_match | similarity_max | Dialog |
|---|---|---|---|---|---|---|---|---|---|
| D1 | `Reply to bharti singhal` | `reply to bharti singhal` | `Reply to bhartii singhal` | `reply to bhartii singhal` | `false` | 0.94 | 0.75 | 0.94 | **fires** |
| D2 | `Call with Rushin night` | `call with rushin` | `Call with Rushen night` | `call with rushen` | `false` | 0.82 | 0.67 | 0.82 | **fires** |
| D3 | `Srilanka hotel booking` | `srilanka hotel booking` | `Sri lanka hotel booking` | `sri lanka hotel booking` | `false` | 0.89 | 0.57 | 0.89 | **fires** |
| D4 | `Call markan morning` | `call markan` | `Maybe Call markan morning` | `call markan` | `false` | 1.00 | 1.00 | 1.00 | **fires** |
| D5 | `check sensor` | `check sensor` | `check sensor` | `check sensor` | `false` | 1.00 | 1.00 | 1.00 | **fires** |
| D6 | `Srilanka hotel booking` | `srilanka hotel booking` | `Srilanka tickets` | `srilanka tickets` | `false` | 0.45 | 0.40 | 0.45 | no |
| D7 | `Social alpha application deadline` | `social alpha application` | `Social alphas call with snowman` | `social alphas call with snowman` | `false` | 0.42 | 0.25 | 0.42 | no |
| D8 | `call markan` | `call markan` | `call kushan` | `call kushan` | `false` | 0.50 | 0.50 | 0.50 | no |
| D9 | `file form 8` | `file form 8` | `file form 9` | `file form` | `true` | — | — | — | no, `numeric_variant` |
| D10 | `check pump #3` | `check pump 3` | `check pump #4` | `check pump` | `true` | — | — | — | no, `numeric_variant` |
| D11 | `raj` | `raj` | `roj` | `roj` | `false` | 0.25 | 0.00 | 0.25 | no, below `threshold`, and both keys under `min_chars` 6 |
| D12 | — | — | `check sensor` | `check sensor` | `false` | — | — | 0.00 | no, nothing open to compare against |
| D13 | `pay form 9` | `pay form 9` | `file form 8` | `file form` | `false` | 0.42 | 0.50 | 0.50 | no. The digits strip out and the words still differ, so `numeric_variant` is false |
| D14 | `call markan` / `call marken` | `call markan` / `call marken` | `call markam` | `call markam` | `false` | 0.83 | 0.50 | 0.83 | **fires**, against the higher of the two |

**Three scores were re-derived.** Nine rows carry a score. All nine were computed by hand before `normalised` was defined as stripping structured spans, and three were wrong for that reason. D2 loses `night` from both sides and falls from 0.87 to 0.82. D4 loses `morning` from both sides and the hedge from one, leaving two identical strings, which is 1.00 and not 0.86. D7 loses `deadline` from the first side only and rises from 0.36 to 0.42. The other six are unchanged and no dialog verdict moves.

**This section does not pin `threshold`.** The lowest score that fires is 0.82 and the highest that stays quiet is 0.50, so every value between them gives every verdict below. `threshold` moved from 0.8 to 0.6 at config `a.5` and not one row here changed. Pinning it needs a pair scoring in that gap whose right answer is known: `call markan` against `call marken` is 0.75, and whether one letter in a name should interrupt is the question, not the arithmetic.

**`compare_key` and `numeric_variant` are stated per row.** Both are working values and both are what the rule actually reads. Without them D9, D10 and D11 state only that no dialog appears, which any implementation that never shows a dialog satisfies for free.

**D11 states a score.** It was `—` through version 4, which read as not applicable when the score is in fact reached: 0.25, below `threshold`. Both `compare_key`s are also under `min_chars` 6, so two independent reasons hold, and the score is the one that fires first.

**D4 fires because `normalised` strips the hedge**, leaving two identical strings. Adding "maybe" to something already on the list is a re-think of the same task, so interrupting is right.

**Every score here was recomputed from the contract's definition and every one matched the hand figure.** The audit that prompted the recomputation used symmetric padding and reproduced none of them; the contract's own asymmetric padding, two leading spaces and one trailing, reproduces all nine to the digit. What was missing was the rounding rule, now stated in the contract: D6 is 0.4468, which truncates to 0.44 and rounds to 0.45.

**D12 is the fresh install.** Nothing is open, so there is nothing to compare against and no dialog can fire. Every other row in this section hands in an open task, so an engine that skipped the empty case would pass all of them.

**D13 separates the two halves of `numeric_variant`.** D9 and D10 have keys that are equal once digits are removed. Here they are not: `file form` against `pay form`. The rule needs the keys to match, not merely the digits to differ, so `numeric_variant` is false and the score is reached.

**D14 hands in two open tasks.** Both are candidates, and the higher score is the one the row states. Which task the dialog names, and whether it names one or all of them, is a screen question and is listed as open below.

**D9 and D10 never reach the score.** `compare_key` removes numeric tokens, the two keys become equal, and `numeric_variant` suppresses the dialog before similarity is computed.

---

## E. Titles, normalised, and the reconstruction rules

| # | Input | Chip | `title` | `normalised` | list | `chip_spans` | Handled by |
|---|---|---|---|---|---|---|---|
| E1 | `Call markan morning` | | `Call markan` | `call markan` | Default | `[]` | Gate 1: the row restates `spec/example.md` section 3 |
| E2 | `maybe call kushan next week` | | `call kushan` | `call kushan` | Default | `[]` | |
| E3 | `GST filing deadline` | | `GST filing` | `gst filing` | Ideas | `[]` | |
| E4 | `morning` | | `morning` | `morning` | Default | `[]` | |
| E5 | `USB integration call` | `This afternoon` | `USB integration call` | `usb integration call` | Default | `[{start: 21, end: 35}]` | |
| E6 | `Payments to coolindia, sudhi, laptop` | | `Payments to coolindia, sudhi, laptop` | `payments to coolindia sudhi laptop` | Ideas | `[]` | |
| E7 | `call kushan friday` | `This afternoon` | `call kushan` | `call kushan` | Default | `[{start: 19, end: 33}]` | |
| E8 | `call kushan friday This afternoon` | | `call kushan` | `call kushan` | Default | `[]` | |

**E1 is not a Gate 4 case.** The Stage 3 placeholder is a hand-copy of `spec/example.md` section 3, so E1 restates the values the placeholder returns and cannot disagree with them whatever the engine does. Gate 1 signed those values. The row stays because the reconstruction rules read better with the example beside them, and `Handled by` keeps it out of the run.

**E3 loses `deadline` from both fields.** A strong marker is metadata: it sets `date_firmness` and contributes no content, and with no date beside it there is nothing for the firmness to be about, so the task routes to Ideas. `GST filing` is the task. `title` and `normalised` now differ only in case.

**E4 is the fallback case.** Stripping the date span would leave nothing, so both fields hold the whole line.

**E5 is the chip case.** `date_phrase` is `This afternoon`, which never appeared in `raw_text`, so the subtraction removes nothing.

---

**E7 and E8 are the same words with and without the tap.** In E7 `This afternoon` was tapped after `friday` was typed, and the tapped date wins: due at 3pm today. In E8 nobody tapped anything and the same line reads Friday, by first-date-wins. The two rows differ in `chip_spans` and in nothing else, which is what makes the rule visible: without E8 the tapped case could be passing for the wrong reason.

A tap is nearly always the correction, and the screen clears the chip the moment the line is edited afterwards, so a chip span exists only when the tap was the last thing that happened. That pair is what "the later one wins" means to an engine that sees a finished line rather than the order of events. The clearing is the screen's, listed with the rest of Gate 6's obligations.

**E5 is the only row anywhere with a chip tapped, and it states where the words landed.** `chip_spans` is stored and read by nothing: take it away and every other value on the row is identical, which is the test that a date still arrives one way. It is on every row in this section rather than only on E5, so a rule that started writing ranges where nothing was tapped would fail somewhere.

## F. Failures and edges

`Handled by` names the part that answers the case. A row carrying one is not a `resolve()` case and the runner reports it rather than calling it.

| # | Input | `title` | `normalised` | `action_verb` | `est_duration_min` | `date_precision` | `date_anchor` | `due_at` | list | Rejects | Handled by | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | *(empty string)* | — | — | — | — | — | — | — | — | throws | | Below `limits.raw_text_min_chars`. Never registered, so no record and nothing on screen. |
| F2 | `   ` | — | — | — | — | — | — | — | — | throws | | Whitespace-only, and empty after trimming |
| F3 | 281 characters | — | — | — | — | — | — | — | — | | screen, at Gate 6 | The input refuses the 281st keystroke. The record is never rejected. |
| F4 | `....` | — | — | — | — | — | — | — | — | throws | | Changed at version 4. Four characters, no letter and no digit, so nothing registers. |
| F5 | `asdfgh` | `asdfgh` | `asdfgh` | `other` | 5 | `none` | `none` | *(empty)* | Ideas | | | Accepted. Routes to Ideas. |
| F6 | `CALL KUSHAN` | `CALL KUSHAN` | `call kushan` | `call` | 15 | `none` | `none` | *(empty)* | Ideas | | | Lexicon matching is case-insensitive; `title` keeps the casing typed |
| F7 | `call    kushan` | `call    kushan` | `call kushan` | `call` | 15 | `none` | `none` | *(empty)* | Ideas | | | `normalised` collapses runs of whitespace to one space |
| F8 | `call kushan!!!` | `call kushan!!!` | `call kushan` | `call` | 15 | `none` | `none` | *(empty)* | Ideas | | | Punctuation stripped |
| F9 | `friday` | `friday` | `friday` | `other` | 5 | `day` | `window` | Fri 7 Aug 16:30 | Default | | | A date with no task is still a task |
| F10 | `maybe submit the tender deadline` | `submit the tender` | `submit the tender` | `submit` | 30 | `none` | `none` | *(empty)* | Ideas | | | A hedge and a strong marker on one line. See below. |

**F7 and F8 are settled.** `normalised` collapses runs of whitespace to one space and trims; `title` and `raw_text` keep every character typed. Written into the contract at version 4.

**F4 changed at version 4.** A line with no letter and no digit is not a capture. Through version 3 it was accepted as a task titled `....`.

**F10 settles hedge against strong marker.** Both fire and `date_firmness` holds one value. `hard` wins: A23 already gives `deadline` with no date a `hard` firmness, and reading the same word two ways depending on whether a hedge sits beside it is a second rule. `date_hedge` keeps `maybe` and `date_marker` keeps `deadline`, so nothing is lost and Part B can still read the hedge. Both the hedge and the strong marker leave `title` and `normalised`, so F10 draws as `submit the tender`.

**F9 is worth arguing about.** A bare `friday` becomes a task called "friday" with a due date. The alternative is rejecting it, which contradicts D-1: typing the thought is the whole of the work, and the user typed something.

---

## G. Domains, drawn from the real backlog

These exercise no new rule. They exist so the lexicon is tested against language the example never used.

| # | Input | `action_verb` | Domain |
|---|---|---|---|
| G1 | `Srilanka hotel booking` | `book` | travel |
| G2 | `Number plate car` | `other` | personal |
| G3 | `Ghar kharch hisab` | `other` | family, Hindi |
| G4 | `salary slip for divyal` | `other` | finance |
| G5 | `jhanvi automobile invoice clarification` | `bill` | business. Corrected at version 4: `invoice` is in `verb_lexicon`. |
| G6 | `Website revamp` | `other` | software |
| G7 | `Make tasks compact on mainpage` | `make` | software |
| G8 | `"Add task" not visible when typing` | `other` | software, quotes in the input |
| G9 | `Ghodiya charger` | `other` | shopping |
| G10 | `Notes for cascade` | `other` | project |
| G11 | `Pankaj ne phone karvo` | `other` | family, Gujarati. `phone` is a context member and not a lexicon entry, so nothing matches. |
| G12 | `Bill bharvano baki chhe` | `bill` | finance, Gujarati. One English noun inside a Gujarati sentence is enough, because the lexicon reads one token at a time. |

**Eight of twelve are `other`.** That is the honest state of an 18-verb lexicon against real language, and it is the number to watch as the lexicon grows.

**G11 and G12 are Gujarati.** Both languages the app expects are represented now, Hindi by G3 and Gujarati by these two. They also show the whole of the parser's reach into either: a transliterated sentence matches only where an English noun happens to sit inside it, which is G12, and otherwise falls to `other`, which is G11.

---

## H. A verb and a date in one line

Every case above holds one or the other. Section A is 27 lines with no date, so all 27 route to Ideas; section B is one body, `call kushan`, with 31 dates around it. Nothing until here puts a real line and a real date together, which is what a person actually types, and nothing until here makes the Default list carry a task that also has a verb, a type, a context and a duration.

| # | Input | `verb_phrase` | `action_verb` | `commitment_type` | `context` | `est_duration_min` | `title` | `date_phrase` | `date_marker` | `date_precision` | `date_anchor` | `earliest_start` | `due_at` | `has_time` | `date_firmness` | list | `due_phrase` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|------|
| H1 | `pay coolindia tomorrow` | `pay` | `pay` | `deadline` | `bills` | 10 | `pay coolindia` | `tomorrow` | *(empty)* | `day` | `window` | Tue 4 Aug 09:00 | Tue 4 Aug 16:30 | false | `normal` | Default | `Due tomorrow` |
| H2 | `Srilanka hotel booking friday 5pm` | `booking` | `book` | `purchase` | `undetermined` | 20 | `Srilanka hotel booking` | `friday 5pm` | *(empty)* | `time` | `point` | *(empty)* | Fri 7 Aug 17:00 | **true** | `normal` | Default | `Due Friday at 5pm` |
| H3 | `file form 8 by friday` | `file` | `file` | `deadline` | `bills` | 30 | `file form 8` | `friday` | `by` | `day` | `end` | *(empty)* | Fri 7 Aug 23:59:59 | false | `hard` | Default | `Due Friday` |
| H4 | `Ghar kharch hisab in 30 mins` | *(empty)* | `other` | `action` | `undetermined` | 5 | `Ghar kharch hisab` | `in 30 mins` | *(empty)* | `time` | `point` | *(empty)* | Mon 3 Aug 11:10 | **true** | `normal` | Default | `Due in 30 mins` |
| H5 | `maybe meet the supplier next week` | `meet` | `meet` | `appointment` | `undetermined` | 60 | `meet the supplier` | `next week` | *(empty)* | `week` | `window` | Mon 10 Aug 09:00 | Thu 13 Aug 16:30 | false | **`soft`** | Default | `Due around next week` |
| H6 | `Social alpha application deadline friday` | `application` | `submit` | `deadline` | `bills` | 30 | `Social alpha application` | `friday` | `deadline` | `day` | `window` | Fri 7 Aug 09:00 | Fri 7 Aug 16:30 | false | `hard` | Default | `Due Friday` |

**These are the only cases where the two halves of the engine meet.** A verb rule that read the date words as verbs, or a date rule that ate the noun beside it, passes every case in sections A and B and fails here. H4 is the sharpest: the line is Hindi with an English time expression in it, so the lexicon matches nothing and the date matches everything.

**H3 keeps its number.** `file form 8` has a numeric token, and the date rule must not read `8` as a day. The verb is `file` from the first token, and `by friday` is the whole of the date.

**H6 is a strong marker with a date, which nothing else in the key has.** A23 has `deadline` and no date and routes to Ideas; here the same word sits beside `friday`, so the firmness is `hard` and the task is due. The marker leaves `title` either way, which is what separates a strong marker from the other three: `by` and `after` only leave when they found a date, and `deadline` leaves whether it found one or not.

**H6 was wrong at version 12.** It stated `Social alpha application deadline` for the title, keeping the marker, which contradicts A23 and E3 and the contract rule all three rest on. Found while writing the title rule, before any code agreed with it.

---

---

## I. The taps

Every case above hands in `null` for all four taps. That is why nothing caught four of the nine inputs being read zero times by any rule: the key exercised the contract through five of them. A tap outranks what the line implied, because it was made after reading what the line gave.

| # | Input | Tap | `commitment_type` | `type_source` | `significance` | `is_hard` | `type_chip` | `add_button` | `input_field` | `bound_task_chip` |
|---|---|---|---|---|---|---|---|---|---|---|
| I1 | `call kushan friday` | *(none)* | `action` | `derived` | 30 | false | `⟨action ▾⟩` | `Add` | `unbound` | *(empty)* |
| I2 | `call kushan friday` | type `deadline` | `deadline` | **`user`** | 30 | false | `⟨deadline ▾⟩` | `Add` | `unbound` | *(empty)* |
| I3 | `call kushan friday` | significance 70 | `action` | `derived` | **70** | false | `⟨action ▾⟩` | `Add` | `unbound` | *(empty)* |
| I4 | `call kushan friday` | significance 10 | `action` | `derived` | **10** | false | `⟨action ▾⟩` | `Add` | `unbound` | *(empty)* |
| I5 | `call kushan by friday` | *(none)* | `action` | `derived` | 30 | **true** | `⟨action ▾⟩` | `Add` | `unbound` | *(empty)* |
| I6 | `call kushan friday` | bound to `t1` | `action` | `derived` | 30 | false | `⟨action ▾⟩` | **`Edit`** | **`bound`** | `⟨ Reply to bharti singhal ✕ ⟩` |
| I7 | `call kushan friday` | type `deadline`, significance 70 | `deadline` | `user` | 70 | false | `⟨deadline ▾⟩` | `Add` | `unbound` | *(empty)* |

**A tap is recorded, not inferred.** I2 is the only demonstration anywhere that `type_source` can read `user`. Without it the field is a constant, and a later rule that stopped writing it would pass every case.

**30 is the untouched default, not 70.** I1 states it. The placeholder held 70 for eleven sessions because the line it was copied from had tapped High, and no case looked.

**I5 is `is_hard`.** The contract says the field reads `date_firmness`, and nothing wrote it until version 21, so a tier-1 ranking override was dead in a way no case could see. `by` makes the date hard, and `is_hard` follows it.

**I6 binds a task.** `bound_task_id` writes no record field at all: it changes four shown strings and nothing else, which is why the row states those and no `Task` field beyond the ones the line itself produced. What happens when a bound task is edited, and what a row action does to it, are parked and named in the closing section.

---

## Open, and blocking Gate 4

One area, parked with the question stated.

- **Row actions.** `row_action` names six things a person can do to a task that already exists: `done` `cancel` `archive` `pin` `edit` `undo`. `resolve()` builds a record from `typed_line`, and *mark that other task done* is not that shape. Either `resolve()` returns the bound task changed when `bound_task_id` is present, or a row action becomes a call of its own that never reads the box. Until that is settled the input stays read by nothing, and `task_state`, `closed_at`, `archived` and `pinned` stay at their capture values on every line.

The three cases parked at version 9 were settled at version 10 and their rules are in the contract: a typed duration is not read, a time beats a day in one line, and an ended band rolls to tomorrow. Every case in this key states a value again.

The four cases listed here through version 3 were settled at version 4 and their rules are in the contract, under "Rules the answer key forced". The three duplicate scores flagged at version 4 were re-derived at version 5 and every score in section D was recomputed from the contract's definition at version 9.

With two open tasks matching one capture, D14 states that the dialog fires against the higher score and does not state which task it names. That is screen text and belongs to Gate 6, so D14 runs rather than parking.

Search and bind are out of scope for this key. The same box does capture, search and edit, and every case here is a capture. Fuzzy matching for search reuses the duplicate rule and is written at Part C.

Nothing below this line is a case id. The runner reads this section as the parked list, so a case named here is skipped whatever its table says.
