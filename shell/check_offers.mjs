// Cascade — handing a task to another person, checked.
//
// THE TENTH CHECK. It reads `shell/offer.js`, which imports nothing but the
// engine, so every rule a handover follows is assertable here. What it cannot
// see is in its own header, the way `check_calendar.mjs` states its own limits:
// Postgres row-level security and the `cascade_offer_guard` trigger are
// written in `migrate_offers.sql` and are run by nothing in this project. They are
// the half of the rules that stops a WRONG CLIENT, and this file only proves
// the right client is right.
//
// Run: node shell/check_offers.mjs

import { partAConfig as config } from "./config.js";
import {
  STATES, normaliseEmail, looksLikeEmail, canSend, offeredOn, offerLabel,
  declinedOn, acceptedId, TRAVELS, payloadOf, makeOffer, asOffered, changesIn,
  readEdit, fromOffer, canAnswer, canWithdraw, waitingFor, givenAway,
  OFFER_COLUMNS, LOCAL_ONLY, offerRow, sendState, queued, canCancelSend,
  handedOver,
} from "./offer.js";
import {
  BLOCK_COLUMNS, blockRow, makeBlock, isBlocked, hasHistory, verdictFor,
  heldBack, blockedList, BLOCKED_REASON,
} from "./block.js";
import {
  makeContact, upsert, forget, nameFor, labelFor, pickerLabel, suggestions,
  cleanName,
} from "./contact.js";
import { readFileSync } from "node:fs";

let failed = 0;
const say = (ok, what) => {
  if (!ok) failed += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
};

const NOW = "2026-10-11T18:00:00+05:30";
const MINE = "11111111-1111-7111-8111-111111111111";
const THEIRS = "22222222-2222-7222-8222-222222222222";

const task = (over = {}) => ({
  id: "t-1",
  raw_text: "fix the chiller friday",
  title: "fix the chiller",
  normalised: "fix the chiller",
  verb_phrase: "fix", action_verb: "fix",
  commitment_type: "action", type_source: "verb", context: "anywhere",
  significance: 30, est_duration_min: 45, duration_source: "default",
  date_phrase: "friday", date_precision: "day", date_anchor: "point",
  date_firmness: "normal", has_time: false,
  due_at: "2026-10-16T09:00:00+05:30", earliest_start: "",
  task_state: "ready", archived: false, pinned: true,
  notes: "take the gauge", recurrence: null,
  alarm_type: "on", alarm_lead_min: 15,
  push_count: 4, first_due_at: "2026-10-01T09:00:00+05:30",
  reminder_fatigue: 3, alarm_unanswered_at: "2026-10-02T09:00:00+05:30",
  calendar_uid: "", calendar_detached: false, offer_id: "",
  created_at: NOW, updated_at: NOW, closed_at: "",
  ...over,
});

const offerOf = (t, to = "raj@freezigo.in") =>
  makeOffer(t, to, { id: "o-1", owner: MINE, fromEmail: "Vishal@Freezigo.IN", now: NOW });

console.log("\nADDRESSES — compared the way the policy compares them.");
{
  say(normaliseEmail("  Raj@Freezigo.IN ") === "raj@freezigo.in",
      "trimmed and lower-cased, because an address is not case sensitive and a text comparison is");
  say(looksLikeEmail("raj@freezigo.in"), "an address passes");
  say(!looksLikeEmail("raj"), "a name does not");
  say(!looksLikeEmail("raj@freezigo"), "and nor does one with no dot after the @");
  say(offerOf(task(), "RAJ@Freezigo.in").to_email === "raj@freezigo.in",
      "an offer stores the address normalised, so the policy can match it");
  say(offerOf(task()).from_email === "vishal@freezigo.in", "and the sender's the same way");
}

console.log("\nWHAT CAN BE SENT.");
{
  say(canSend(task(), []), "an open task can be handed over");
  say(!canSend(task({ task_state: "done", closed_at: NOW }), []),
      "a finished one cannot — nobody is being asked to do it");
  say(!canSend(task({ archived: true }), []), "nor an archived one");
  say(!canSend(task({ calendar_uid: "ical-9" }), []),
      "nor one that came from a calendar: the event is Google's and the next import would rewrite it under them");

  const out = offerOf(task());
  say(!canSend(task(), [out]),
      "nor one already out with somebody — two people answering one offer is a race with no right answer");
  say(canSend(task(), [{ ...out, state: "withdrawn" }]),
      "but withdrawing it makes the task sendable again");
  say(canSend(task(), [{ ...out, state: "declined" }]),
      "and so does a decline, which is the point of a decline");
  say(offerLabel(task(), [out]) === "Offered to raj@freezigo.in",
      "the row says who it is with");
  say(offerLabel(task(), []) === "", "and says nothing when it is nobody's but his");
  say(declinedOn("t-1", [{ ...out, state: "declined", decline_reason: "in mumbai" }])?.decline_reason === "in mumbai",
      "a refusal comes back with its reason attached");
}

console.log("\nWHAT TRAVELS — his answer: everything about the work, and nothing about him.");
{
  const p = payloadOf(task());
  for (const f of ["title", "due_at", "notes", "alarm_type", "alarm_lead_min", "recurrence", "pinned",
                   "significance", "est_duration_min", "commitment_type", "date_firmness"]) {
    say(f in p, `${f} travels`);
  }
  // THE FIELDS NOBODY WOULD THINK OF, which is exactly why the list is written
  // out rather than the record being spread.
  for (const f of ["push_count", "first_due_at", "reminder_fatigue", "alarm_unanswered_at",
                   "calendar_uid", "id", "created_at", "task_state"]) {
    say(!(f in p), `${f} does NOT travel — it is a thing that happened to the sender`);
  }
  say(TRAVELS.length === new Set(TRAVELS).size, "and the list names nothing twice");
}

console.log("\nTHE ACCEPTED TASK.");
{
  const o = offerOf(task());
  const t = fromOffer(o, { now: NOW, config });

  say(t.id === acceptedId("o-1"), "its id is derived from the offer, so accepting twice gives one task");
  say(acceptedId("o-1") === acceptedId("o-1"), "derivation is stable");
  say(acceptedId("o-1") !== acceptedId("o-2"), "and different offers give different ids");
  say(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(t.id),
      "and it is a uuid the column will accept");

  say(t.title === "fix the chiller" && t.due_at === "2026-10-16T09:00:00+05:30", "the work arrives whole");
  say(t.alarm_type === "on" && t.alarm_lead_min === 15, "with the alarm, his answer");
  say(t.notes === "take the gauge" && t.pinned === true, "the notes and the pin too");
  say(t.task_state === "ready" && t.closed_at === "", "open, whatever state the sender's copy was in");
  say(t.offer_id === "o-1", "it knows which offer it came from, so the row can say who asked");
  say(t.push_count === 0 && t.first_due_at === "" && t.reminder_fatigue === 0,
      "and carries none of the sender's history, because none of it happened to the recipient");
  say(t.calendar_uid === "", "nor any calendar link");
  say(t.config_version === config.version, "it is stamped with the config that read it");
  say(t.est_duration_min > 0, "and has a duration the table's check will accept");

  const thin = fromOffer({ id: "o-9", payload: { title: "do it" } }, { now: NOW, config });
  say(thin.est_duration_min > 0 && thin.commitment_type && thin.context && thin.date_precision,
      "a payload missing everything still produces a row Postgres will take — the fields are invented here rather than trusted");
}

console.log("\nTHE RECIPIENT'S CORRECTION — his answer 3.");
{
  const o = offerOf(task());
  const edited = readEdit("fix the chiller monday", o, { now: NOW, config, id: "e-1" });
  const after = { ...o, edited };

  say(asOffered(o).title === "fix the chiller", "before: what was sent");
  say(asOffered(after).due_at !== o.payload.due_at, "after: the date he corrected");
  const diff = changesIn(after);
  say(diff.some((c) => c.field === "due_at"), "and the change is listed for the sender to see");
  say(diff.every((c) => TRAVELS.includes(c.field)), "every change named is a field that travels");
  say(o.payload.due_at === "2026-10-16T09:00:00+05:30",
      "WHAT WAS SENT IS UNCHANGED — the correction sits beside it, so the sender sees both");

  // The same words back is not a change.
  const same = readEdit("fix the chiller friday", o, { now: NOW, config, id: "e-2" });
  say(changesIn({ ...o, edited: same }).every((c) => c.field !== "title"),
      "retyping the same title records no change");
}

console.log("\nWHO MAY ANSWER.");
{
  const o = offerOf(task());
  say(canAnswer(o, "raj@freezigo.in"), "the person it is addressed to");
  say(canAnswer(o, "RAJ@FREEZIGO.IN"), "whatever case they type it in");
  say(!canAnswer(o, "someone@else.com"), "and nobody else");
  say(!canAnswer({ ...o, state: "accepted" }, "raj@freezigo.in"), "an answered offer cannot be answered again");
  say(!canAnswer({ ...o, state: "declined" }, "raj@freezigo.in"), "in either direction");

  say(canWithdraw(o, MINE), "the sender may take it back while it is unanswered");
  say(!canWithdraw(o, THEIRS), "somebody else may not");
  say(!canWithdraw({ ...o, state: "accepted" }, MINE), "and not once it has been accepted");

  say(STATES.length === 4, "there are four states and no others");
}

console.log("\nTHE TWO LISTS.");
{
  const mine = offerOf(task());
  const other = { ...offerOf(task({ id: "t-2" })), id: "o-2", to_email: "divyal@freezigo.in" };
  const toMe = { ...offerOf(task({ id: "t-3" })), id: "o-3", from_owner: THEIRS, to_email: "vishal@freezigo.in" };

  const waiting = waitingFor([mine, other, toMe], "VISHAL@freezigo.in");
  say(waiting.length === 1 && waiting[0].id === "o-3", "Received holds only what is addressed to me and unanswered");
  say(waitingFor([{ ...toMe, state: "accepted" }], "vishal@freezigo.in").length === 0,
      "and empties as soon as it is answered, which is what makes the strip disappear");
  say(waitingFor([], "vishal@freezigo.in").length === 0, "nothing waiting is not a tab");

  const given = givenAway([mine, other, toMe], MINE);
  say(given.length === 2, "Given away holds what I sent");
  say(!given.some((o) => o.from_owner === THEIRS), "and nothing anybody sent me");
  say(givenAway([{ ...mine, state: "withdrawn" }], MINE).length === 0,
      "a withdrawn offer is not a record of anything, so it is not in the list");
  say(givenAway([{ ...mine, state: "accepted", done_at: NOW, done_state: "done" }], MINE)[0].done_at === NOW,
      "and an accepted one carries whether the work is finished — his answer 1");
}

// =================================================== session 161, the columns
//
// EVERY FIELD HAS A COLUMN, BOTH WAYS, and this is the assertion that would
// have caught session 152 a session early. The offer row was built by
// spreading the record until session 161; the first local-only field arrived
// in the same session. A spread would have sent `pending`, PostgREST would
// have refused a column that does not exist, and the offers queue would have
// stopped at the first failure and stayed stopped.
//
// Read out of the MIGRATIONS, because they are what actually ran.
{
  const columnsIn = (sql, table) => {
    const body = sql.slice(sql.indexOf(`create table if not exists ${table} (`));
    const inner = body.slice(body.indexOf("(") + 1, body.indexOf("\n);"));
    const names = new Set();
    for (const raw of inner.split("\n")) {
      const line = raw.replace(/--.*$/, "").trim();
      const m = /^([a-z_][a-z0-9_]*)\s+(uuid|text|jsonb|boolean|timestamptz)\b/.exec(line);
      if (m) names.add(m[1]);
    }
    return names;
  };

  const offerSql = readFileSync(new URL("../migrate_offers.sql", import.meta.url), "utf8");
  const cols = columnsIn(offerSql, "cascade_offer");
  say(cols.size > 10, `migrate_offers.sql was read and names ${cols.size} columns`);
  const extra = OFFER_COLUMNS.filter((c) => !cols.has(c));
  say(extra.length === 0,
      `OFFER_COLUMNS names no column cascade_offer lacks${extra.length ? " — " + extra.join(", ") : ""}`);
  // The offsets are written beside their instants by the bridge and are not in
  // the record, so they are the one legal absence from the record's own list.
  const missing = [...cols].filter((c) => !OFFER_COLUMNS.includes(c));
  say(missing.length === 0,
      `and leaves none out, or that field would be dropped on its way to the server${missing.length ? " — " + missing.join(", ") : ""}`);

  const blockSql = readFileSync(new URL("../migrate_blocks.sql", import.meta.url), "utf8");
  const bcols = columnsIn(blockSql, "cascade_block");
  const bExtra = BLOCK_COLUMNS.filter((c) => !bcols.has(c));
  const bMissing = [...bcols].filter((c) => !BLOCK_COLUMNS.includes(c));
  say(bExtra.length === 0 && bMissing.length === 0,
      `BLOCK_COLUMNS and cascade_block agree, both ways (${bcols.size} columns)`);

  // AND THE ROW THE SERVER IS ACTUALLY SHOWN. A record carrying `pending` must
  // not be able to send it, and reverting the row builder to a spread fails
  // here by name.
  const sent = makeOffer(task(), "raj@example.com", {
    id: "o-1", owner: MINE, fromEmail: "me@example.com", now: NOW, pending: true,
  });
  const row = offerRow(sent);
  const stray = Object.keys(row).filter((k) => !OFFER_COLUMNS.includes(k));
  say(stray.length === 0,
      `the row offerRow builds has nothing Postgres would refuse${stray.length ? " — " + stray.join(", ") : ""}`);
  for (const f of LOCAL_ONLY) say(!(f in row), `\`${f}\` is local-only and is not sent`);
  say(offerRow({ id: "x", pending: true, nonsense: 1 }).nonsense === undefined,
      "and a field no column exists for is dropped rather than queued to fail");
}

// ============================================== session 161, a queued hand-off
//
// His instruction: "signal can't work, it can send later when connection
// arrives — no change in task till then unless cancelled."
{
  const t = task();
  const q = makeOffer(t, "raj@example.com", {
    id: "o-q", owner: MINE, fromEmail: "me@example.com", now: NOW, pending: true,
  });
  const live = makeOffer(t, "raj@example.com", {
    id: "o-l", owner: MINE, fromEmail: "me@example.com", now: NOW,
  });

  say(sendState(t, [q]) === "queued", "a hand-off made with no signal reads as queued");
  say(sendState(t, [live]) === "offered", "and one that landed reads as offered");
  say(sendState(t, []) === "none", "and a task nobody has been given reads as neither");

  // THE TWO LABELS, which is the whole of what the distinction buys: a queued
  // hand-off has told nobody anything, and saying `Offered` there is the
  // invisible failure session 159 refused queueing over.
  say(offerLabel(t, [q]) === "Sending to raj@example.com", "the row says Sending while it waits");
  say(offerLabel(t, [live]) === "Offered to raj@example.com", "and Offered once it has gone");
  say(offerLabel(t, [live], [{ email: "raj@example.com", name: "Raj" }]) === "Offered to Raj",
      "and it wears his own word for the address when he has given one");

  // CANCEL versus WITHDRAW. Nobody was told, so there is nothing to take back.
  say(canCancelSend(q) === true, "a queued hand-off can simply be called off");
  say(canCancelSend(live) === false, "one that has gone cannot");
  say(canWithdraw(q, MINE) === false, "and is not offered a Withdraw, which has no row to update");
  say(canWithdraw(live, MINE) === true, "where one that has gone is");

  // THE TASK IS UNTOUCHED, which is the half of his instruction that answers
  // the objection session 159 raised.
  say(canSend(t, [q]) === false, "the task cannot be handed to a second person while one is queued");
  say(givenAway([q], MINE).length === 0, "and nothing is in Given away until somebody has been told");
  say(givenAway([live], MINE).length === 1, "where a sent one is");

  // ORDER. Two made in a tunnel go out in the order he made them, because the
  // second may have been a correction of the first.
  const first = { ...q, id: "a", created_at: "2026-10-11T10:00:00+05:30" };
  const second = { ...q, id: "b", created_at: "2026-10-11T11:00:00+05:30" };
  say(queued([second, first]).map((o) => o.id).join(",") === "a,b",
      "the queue drains oldest first, whatever order the cache holds them in");
}

// ============================================ session 161, blocking an address
//
// His answer: declined for people he know, silent for strangers.
{
  const me = "me@example.com";
  const known = { id: "k", state: "offered", from_email: "raj@example.com", to_email: me };
  const old = { id: "old", state: "declined", from_email: me, to_email: "raj@example.com" };
  const stranger = { id: "s", state: "offered", from_email: "nobody@spam.example", to_email: me };
  const blocks = [makeBlock("raj@example.com", MINE, NOW), makeBlock("nobody@spam.example", MINE, NOW)];

  say(isBlocked("RAJ@Example.com ", blocks) === true, "a blocked address matches whatever its case and spacing");
  say(isBlocked("other@example.com", blocks) === false, "and an address nobody blocked does not");

  say(hasHistory("raj@example.com", [known, old], me, "k") === true,
      "one earlier offer in either direction is enough to count as known");
  say(hasHistory("nobody@spam.example", [stranger], me, "s") === false,
      "and the offer being judged is never its own history — without that every stranger reads as known");

  const state = { blocks, offers: [known, old, stranger], me };
  say(verdictFor(known, state) === "decline", "a blocked colleague gets a decline, and knows");
  say(verdictFor(stranger, state) === "silent", "a blocked stranger gets nothing, and learns nothing");
  say(verdictFor({ ...known, from_email: "clear@example.com" }, state) === "allow",
      "and an address nobody blocked arrives as normal");
  say(verdictFor({ ...stranger, to_email: "someone.else@example.com" }, state) === "allow",
      "an offer addressed to somebody else is not this person's to judge");

  say(heldBack([known, stranger], state).map((o) => o.id).join(",") === "s",
      "only the silent ones are held back, so the strip's count and its rows agree");
  say(BLOCKED_REASON.length > 20 && /declined/i.test(BLOCKED_REASON),
      "an auto-decline says who did it, because a bare decline reads as a person's answer");
  say(blockedList(blocks).length === 2, "and the account screen can list every blocked address");

  const brow = blockRow({ ...makeBlock("x@y.zz", MINE, NOW), nonsense: 1 });
  say(brow.nonsense === undefined && brow.email === "x@y.zz",
      "a block row carries its columns and nothing else");
}

// ============================================= session 161, names and the list
{
  const me = "me@example.com";
  let cards = [];
  cards = upsert(cards, makeContact("RAJ@example.com ", "  Raj  ", NOW));
  say(cards[0].email === "raj@example.com" && cards[0].name === "Raj",
      "a card normalises its address and trims its name");

  // A BLANK NAME NEVER ERASES ONE. `touch` on every send calls this with
  // nothing typed, and treating that as a rename would lose the label the
  // first time he picked a contact and pressed send.
  cards = upsert(cards, makeContact("raj@example.com", "", "2026-10-12T09:00:00+05:30"));
  say(nameFor("raj@example.com", cards) === "Raj", "and sending again does not wipe the name");
  cards = upsert(cards, makeContact("raj@example.com", "Raj Patel", NOW));
  say(nameFor("raj@example.com", cards) === "Raj Patel", "while typing a new one does replace it");

  say(labelFor("raj@example.com", cards) === "Raj Patel", "a row shows the name alone");
  say(labelFor("who@example.com", cards) === "who@example.com", "and the address when there is no name");
  say(pickerLabel({ email: "raj@example.com", name: "Raj" }) === "Raj — raj@example.com",
      "the dropdown shows both, because choosing is the one moment the address matters");
  say(cleanName("a".repeat(80)).length === 40, "a name is capped, so a label stays a label");
  say(forget(cards, "raj@example.com").length === 0, "and a name can be forgotten");

  // THE LIST IS HIS OWN HISTORY. No directory anywhere in this feature.
  const offers = [
    { id: "1", from_email: me, to_email: "old@example.com", created_at: "2026-09-01T09:00:00+05:30", updated_at: "2026-09-01T09:00:00+05:30" },
    { id: "2", from_email: "recent@example.com", to_email: me, created_at: "2026-10-10T09:00:00+05:30", updated_at: "2026-10-10T09:00:00+05:30" },
    { id: "3", from_email: "other@example.com", to_email: "notme@example.com", created_at: "2026-10-11T09:00:00+05:30", updated_at: "2026-10-11T09:00:00+05:30" },
  ];
  const list = suggestions(offers, me, cards);
  const got = list.map((s) => s.email);
  say(got.includes("old@example.com") && got.includes("recent@example.com"),
      "the dropdown offers everybody he has written to and everybody who wrote to him");
  say(!got.includes("notme@example.com") && !got.includes("other@example.com"),
      "and nobody from an offer that was not his — there is still no directory");
  say(!got.includes(me), "his own address is never in the list");
  // MOST RECENTLY USED FIRST, and the first assertion here claimed
  // `recent@example.com` led. It does not: `raj@example.com` was touched at
  // NOW two blocks above, which is later than every offer in this fixture, so
  // the card he just used leads. That is the behaviour wanted — the ordering
  // counts a NAMED card's own `used_at` as a use — and the claim was wrong
  // rather than the code. Asserted on the two history-only addresses, where
  // the comparison is the one the sentence is about.
  say(got.indexOf("recent@example.com") < got.indexOf("old@example.com"),
      "most recently used first");
  say(got[0] === "raj@example.com",
      "and a card touched by a send just now leads the list, ahead of older offers");
  say(suggestions([], me, [{ email: "named@example.com", name: "New", used_at: null }])[0].email === "named@example.com",
      "a card he named but has never used still appears, because he named it on purpose");
}

// ======================================= session 162, the task actually leaves
//
// His report: "the task doesn't vanish when the other account accepts."
//
// IT NEVER DID. Session 159's own table said `accept -> task deleted` and
// nothing deleted it. The recipient cannot — `cascade_task` is one owner and
// four policies, which is the decision the whole feature rests on — so the
// sender's device is the only one that can, and nothing on it was watching.
//
// THE ASSERTIONS THAT MATTER HERE ARE THE NEGATIVE ONES. This function deletes
// a task. Firing it on a declined or a withdrawn offer would destroy the work
// the feature exists to protect, and the state test is the only thing
// standing between those two cases.
{
  const t = task();
  const here = [t];
  const base = {
    id: "o", from_owner: MINE, from_email: "me@example.com",
    to_email: "raj@example.com", task_id: t.id, created_at: NOW, updated_at: NOW,
  };

  const taken = handedOver([{ ...base, state: "accepted" }], MINE, here);
  say(taken.length === 1 && taken[0].taskId === t.id,
      "a task somebody has accepted is named for removal");
  say(taken[0].to === "raj@example.com", "and it says who took it, for the line the screen shows");

  // EVERY OTHER STATE LEAVES IT ALONE. A declined or withdrawn offer means the
  // work came BACK.
  for (const state of ["offered", "declined", "withdrawn"]) {
    say(handedOver([{ ...base, state }], MINE, here).length === 0,
        `a ${state} offer never removes the task — the work came back`);
  }

  say(handedOver([{ ...base, state: "accepted", from_owner: THEIRS }], MINE, here).length === 0,
      "somebody else's offer never removes anything of his");
  say(handedOver([{ ...base, state: "accepted", pending: true }], MINE, here).length === 0,
      "and an offer still waiting for a signal cannot have been accepted by anybody");
  say(handedOver([{ ...base, state: "accepted" }], MINE, []).length === 0,
      "a task already gone is not named twice, so running the sweep again does nothing");
  say(handedOver([{ ...base, state: "accepted", task_id: "other" }], MINE, here).length === 0,
      "and an offer pointing at a task that is not here is left alone");

  // THE RECIPIENT'S SIDE OF THE SAME ROW. He accepted it, so his own copy must
  // not be swept away by the offer he answered.
  say(handedOver([{ ...base, state: "accepted" }], THEIRS, here).length === 0,
      "the recipient's device never removes anything from this — only the sender's does");
}

console.log(failed ? `\nCHECK OFFERS: ${failed} FAILED\n` : "\nCHECK OFFERS: PASS\n");
process.exit(failed ? 1 : 0);
