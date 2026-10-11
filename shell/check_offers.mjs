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
} from "./offer.js";

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

console.log(failed ? `\nCHECK OFFERS: ${failed} FAILED\n` : "\nCHECK OFFERS: PASS\n");
process.exit(failed ? 1 : 0);
