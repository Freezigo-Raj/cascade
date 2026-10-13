// Cascade Part A — handing a task to another person.
//
// PURE, like `calendar.js` and `calendar.import.js` beside it. Every rule a
// handover follows is here; `offer.bridge.js` talks to Supabase and decides
// nothing. `check_offers.mjs` reads this file and the bridge reads it too, so
// there is one statement of the rules rather than one per caller.
//
// HIS FOUR ANSWERS, session 159, and each is a rule below:
//
//   1. THE SENDER KEEPS A RECORD. Accepting takes the task off his list, and
//      the offer becomes the row in `Given away` that says whether it is done.
//      He delegated it; he did not stop caring about it.
//   2. EVERYTHING TRAVELS. Title, date, alarm, repeat, notes, type, firmness,
//      duration, significance and the pin. What arrives is the task he had.
//   3. THE RECIPIENT MAY EDIT BEFORE ACCEPTING, and the sender sees what
//      changed. `fix the chiller friday` becomes `fix the chiller monday` with
//      Monday visible as the recipient's correction rather than silently.
//   4. A DECLINE CARRIES A REASON back.
//
// THE TASK NEVER MOVES, which is what makes the rest small. `cascade_task` is
// one owner, four policies, an outbox and a newest-wins trigger, all of which
// assume that. The offer is a separate row both people can see; on accept the
// recipient's app writes a task of its OWN and the sender's is deleted. Nothing
// about the single-owner store changes.

const v = new URL(import.meta.url).search;
const { resolve } = await import(`./resolve.js${v}`);

/** The four states an offer can be in. Nothing else is legal. */
export const STATES = ["offered", "accepted", "declined", "withdrawn"];

/**
 * THE COLUMNS OF `cascade_offer`, AND THE ROW IS BUILT FROM THIS LIST.
 *
 * It was built by spreading the record — `{...offer}` — until session 161,
 * which is session 152's defect sitting in a second table waiting for its
 * first local-only field. That field arrived in the same session: `pending`,
 * below. A spread would have sent it, PostgREST would have refused a column
 * that does not exist, and the queue would have stopped at the first failure
 * to keep its order, exactly as the task outbox did for hours.
 *
 * No row in this project is built by a spread now. `check_offers.mjs` reads
 * `migrate_offers.sql` and holds this list to it BOTH WAYS: a name here that
 * the table has not got, and a column there this list leaves out.
 */
export const OFFER_COLUMNS = [
  "id",
  "from_owner", "from_email",
  "to_email", "to_owner",
  "task_id", "accepted_task_id",
  "payload", "edited",
  "state", "decline_reason",
  "done_at", "done_at_offset", "done_state",
  "created_at", "created_at_offset",
  "updated_at", "updated_at_offset",
];

/**
 * FIELDS THAT LIVE ONLY ON THE PHONE. One, and it is the reason the list above
 * exists.
 *
 * `pending` means: this offer was made while there was no connection and has
 * not reached the server yet. The server has no column for it and must not be
 * told about it. Stated as a list so the next one is added here rather than
 * discovered in a stuck queue.
 */
export const LOCAL_ONLY = ["pending"];

/** A record into a row, from the column list and never from the record. */
export function offerRow(offer) {
  const row = {};
  for (const k of OFFER_COLUMNS) if (k in (offer ?? {})) row[k] = offer[k];
  return row;
}

/** An open task, written out, as `calendar.js` and `repeat.js` each do. */
const isOpen = (t) => Boolean(t) && t.task_state === "ready" && !t.archived;

/** An address, as the policy compares it: trimmed and lower-cased. */
export function normaliseEmail(text) {
  return String(text ?? "").trim().toLowerCase();
}

/**
 * Whether a string is an address worth sending to.
 *
 * DELIBERATELY SHALLOW. The real test is whether somebody reads it, and no
 * regular expression knows that. This rejects what is obviously not an address
 * so a typo is caught at the keyboard rather than becoming an offer nobody
 * will ever see, and nothing more.
 */
export function looksLikeEmail(text) {
  const at = normaliseEmail(text);
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(at);
}

/**
 * Whether this task can be handed over at all.
 *
 * NOT A CLOSED ONE: finished work is not a thing to ask somebody to do.
 * NOT ONE ALREADY OFFERED: two people answering the same offer is a race with
 * no right answer, so the sender withdraws before re-sending.
 * NOT ONE THAT CAME FROM A CALENDAR: the event is Google's, this app does not
 * own the thing it points at, and handing over a task that will be rewritten
 * by the next import is handing over something that changes under them.
 */
export function canSend(task, offers) {
  if (!isOpen(task)) return false;
  if (task.calendar_uid) return false;
  // ALREADY OUT WITH SOMEBODY. Asked of the OFFERS and not of a flag on the
  // task, deliberately: a flag would be a second record of the same fact, and
  // the two would disagree the first time an offer was withdrawn on another
  // device. The offer table is the only place a handover is recorded.
  return !offeredOn(task.id, offers);
}

/** The live offer on this task, if there is one. */
export function offeredOn(taskId, offers) {
  return (offers ?? []).find((o) => o.task_id === taskId && o.state === "offered") ?? null;
}

/**
 * WHERE A HAND-OFF HAS GOT TO: nothing, waiting for a signal, or out with
 * somebody (session 161, his instruction: "signal can't work, it can send
 * later when connection arrives — no change in task till then unless
 * cancelled").
 *
 * The distinction the row has to draw is NOT sent versus answered. It is SENT
 * versus NOT YET SENT, because those two offer the person opposite actions and
 * mean opposite things about the work:
 *
 *   queued    nobody has been told anything. Cancel costs nothing and the task
 *             is untouched and still his to do.
 *   offered   another person is looking at it. Taking it back is a Withdraw,
 *             which is a message, and it can lose a race against their accept.
 *
 * A queued offer carries `state: "offered"` because that is what it will mean
 * the moment it lands, and `pending: true` because it has not. One field, and
 * the row's two labels come off it.
 */
export function sendState(task, offers) {
  const out = offeredOn(task?.id, offers);
  if (!out) return "none";
  return out.pending ? "queued" : "offered";
}

/** Who the sender is waiting on, for the row to say so. */
export function offerLabel(task, offers, contacts) {
  const out = offeredOn(task?.id, offers);
  if (!out) return "";
  // `labelFor` lives in `contact.js` and this file imports nothing, so the
  // caller hands the name in. An absent list falls back to the address, which
  // is what a device that has never been given a name shows anyway.
  const who = nameOf(out.to_email, contacts);
  return out.pending ? `Sending to ${who}` : `Offered to ${who}`;
}

/** His word for an address if the caller handed one over, else the address. */
function nameOf(email, contacts) {
  const at = String(email ?? "").trim().toLowerCase();
  const c = (contacts ?? []).find((x) => String(x?.email ?? "").trim().toLowerCase() === at);
  const name = String(c?.name ?? "").trim();
  return name || at;
}

/**
 * Offers waiting for a signal, OLDEST FIRST, which is the order they are sent
 * in. Two hand-offs made in a tunnel land in the order he made them, because
 * the second may have been a correction of the first.
 */
export function queued(offers) {
  return (offers ?? [])
    .filter((o) => o && o.pending && o.state === "offered")
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
}

/**
 * Whether the send can simply be called off.
 *
 * A QUEUED OFFER IS NOT WITHDRAWN, IT IS DELETED. Nobody was told, so there is
 * nothing to take back and nothing to record: a `withdrawn` row would be a
 * history of a thing that never happened, and it would sit in the sender's own
 * table for ever saying he changed his mind about something nobody saw.
 */
export function canCancelSend(offer) {
  return Boolean(offer) && offer.state === "offered" && Boolean(offer.pending);
}

/**
 * An offer that came back refused, so the row can say why.
 *
 * The task stayed on his list, which is his answer: a decline is not a thing
 * that happens to the work, it is a thing that happens to the asking.
 */
export function declinedOn(taskId, offers) {
  return (offers ?? [])
    .filter((o) => o.task_id === taskId && o.state === "declined")
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0] ?? null;
}

/**
 * The id an accepted offer's task gets.
 *
 * DERIVED FROM THE OFFER, never invented, for the three reasons `successorId`
 * and `importedId` were: accepting twice gives one task rather than two, two
 * devices accepting at once compute the same id so newest-wins collapses them
 * instead of keeping both, and a recipient who clears his storage and syncs
 * again gets the same row back.
 */
export function acceptedId(offerId) {
  const seed = `offer:${offerId}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 1), 2654435761) >>> 0;
  }
  const hex = (n) => n.toString(16).padStart(8, "0");
  const a = hex(h1), b = hex(h2);
  const c = hex((h1 ^ 0x9e3779b9) >>> 0), d = hex((h2 ^ 0x7f4a7c15) >>> 0);
  return `${a}-${b.slice(0, 4)}-7${b.slice(5, 8)}-8${c.slice(1, 4)}-${c.slice(4)}${d}`;
}

/**
 * WHAT TRAVELS, his answer 2: everything about the work.
 *
 * Stated as a list rather than as a copy of the whole record, because the
 * fields that must NOT travel are the ones nobody would think of: the sender's
 * id, his push history, how many times HIS alarm went unanswered, and which
 * calendar event HIS copy came from. A spread would have carried every one.
 */
export const TRAVELS = [
  "title", "normalised", "raw_text",
  "verb_phrase", "action_verb",
  "commitment_type", "type_source", "context",
  "significance", "est_duration_min", "duration_source",
  "date_phrase", "date_precision", "date_anchor", "date_firmness",
  "has_time", "due_at", "earliest_start",
  "notes", "recurrence",
  "alarm_type", "alarm_lead_min",
  "pinned",
];

/** The task as it goes on the wire. */
export function payloadOf(task) {
  const out = {};
  for (const f of TRAVELS) out[f] = task[f] ?? null;
  return out;
}

/**
 * A new offer, ready to be written.
 *
 * `from_email` is carried so the recipient reads a person rather than a uuid.
 * It is the sender's own claim about himself, which the database cannot check
 * — `from_owner` is the authority and is checked by the insert policy — so it
 * is shown as a label and never trusted as an identity.
 */
export function makeOffer(task, toEmail, opts) {
  return {
    id: opts.id,
    from_owner: opts.owner,
    from_email: normaliseEmail(opts.fromEmail),
    to_email: normaliseEmail(toEmail),
    to_owner: null,
    task_id: task.id,
    accepted_task_id: null,
    payload: payloadOf(task),
    edited: null,
    state: "offered",
    // WHAT IT WILL MEAN WHEN IT LANDS, AND WHETHER IT HAS. `state` is already
    // `offered` on a queued one, because that is what the row says the moment
    // it reaches the server and the server is the only thing that reads it.
    // `pending` is the local half and never leaves the phone.
    pending: Boolean(opts.pending),
    decline_reason: null,
    done_at: null,
    done_state: null,
    created_at: opts.now,
    updated_at: opts.now,
  };
}

/**
 * What the recipient is looking at: what was sent, with his corrections over
 * the top.
 *
 * HIS ANSWER 3. `edited` holds only the fields he changed, so `payload` stays
 * the record of what was actually sent and the sender can be shown both.
 */
export function asOffered(offer) {
  return { ...(offer?.payload ?? {}), ...(offer?.edited ?? {}) };
}

/**
 * WHAT THE RECIPIENT CHANGED, as a list a sender can read.
 *
 * Compared field by field against what was sent rather than against the whole
 * object, because `{...a} !== {...b}` is true for two identical records and
 * would report a change on every offer.
 */
export function changesIn(offer) {
  const was = offer?.payload ?? {};
  const now = offer?.edited ?? {};
  const out = [];
  for (const f of Object.keys(now)) {
    if (!TRAVELS.includes(f)) continue;
    if (now[f] === was[f]) continue;
    out.push({ field: f, from: was[f], to: now[f] });
  }
  return out;
}

/**
 * The recipient's correction, read the way a typed line is read.
 *
 * IT GOES THROUGH `resolve()` AND NOTHING ELSE. A date typed by the recipient
 * has to be read by the same rules that read a date typed by anybody, or this
 * app would have two date readers and they would disagree on the first Friday
 * that fell at the end of a month. The one difference is the ANCHOR: the
 * sender's date is what `relative to now` means here, not the recipient's
 * clock, so `friday` means the Friday after the task was sent.
 */
export function readEdit(line, offer, opts) {
  const out = resolve({
    typed_line: line,
    chip_spans: [], type_chip_tap: null, significance_tap: null,
    duration_tap: null, firmness_tap: null, notes_text: "",
    bound_task_id: null, row_action: null,
    now: opts.now,
    new_id: opts.id ?? "00000000-0000-7000-8000-000000000000",
    config: opts.config,
    existing_tasks: [],
  }).task;

  const was = asOffered(offer);
  const edited = {};
  for (const f of ["title", "normalised", "raw_text", "verb_phrase", "action_verb",
                   "date_phrase", "date_precision", "date_anchor", "date_firmness",
                   "has_time", "due_at", "earliest_start"]) {
    if (out[f] !== was[f]) edited[f] = out[f];
  }
  return Object.keys(edited).length ? { ...(offer.edited ?? {}), ...edited } : (offer.edited ?? null);
}

/**
 * THE TASK THE RECIPIENT GETS.
 *
 * Built from the offer, not copied from a record: a Task has required fields a
 * payload does not carry, and inventing them here rather than trusting what
 * arrived is what stops a malformed offer becoming a malformed row. The
 * sender's history is deliberately absent — `push_count`, `first_due_at`,
 * `reminder_fatigue` and `alarm_unanswered_at` are things that happened to
 * HIM — and so is `calendar_uid`, because `canSend` already refused a task
 * that had one.
 */
export function fromOffer(offer, opts) {
  const said = asOffered(offer);
  const id = acceptedId(offer.id);
  return {
    id,
    raw_text: said.raw_text ?? said.title ?? "",
    chip_spans: [],
    config_version: opts.config.version,
    title: said.title ?? "(untitled)",
    normalised: said.normalised ?? "",
    verb_phrase: said.verb_phrase ?? "",
    action_verb: said.action_verb ?? "",
    commitment_type: said.commitment_type ?? "action",
    type_source: said.type_source ?? "verb",
    context: said.context ?? "anywhere",
    significance: Number(said.significance ?? 30),
    est_duration_min: Number(said.est_duration_min) > 0 ? Number(said.est_duration_min) : 15,
    duration_source: said.duration_source ?? "default",
    date_phrase: said.date_phrase ?? "",
    date_spans: [],
    date_hedge: "",
    date_marker: "",
    date_precision: said.date_precision ?? "none",
    date_anchor: said.date_anchor ?? "none",
    date_firmness: said.date_firmness ?? "normal",
    has_time: Boolean(said.has_time),
    due_at: said.due_at ?? "",
    earliest_start: said.earliest_start ?? "",
    task_state: "ready",
    archived: false,
    pinned: Boolean(said.pinned),
    notes: said.notes ?? "",
    recurrence: said.recurrence ?? null,
    alarm_type: said.alarm_type ?? "none",
    alarm_lead_min: said.alarm_lead_min ?? null,
    alarm_snoozed_until: "",
    alarm_unanswered_at: "",
    reminder_fatigue: 0,
    blocked: false,
    blocker_reason: "",
    blocker_ref: "",
    project_id: null,
    push_count: 0,
    first_due_at: "",
    spawned_from: null,
    calendar_uid: "",
    calendar_detached: false,
    // WHERE IT CAME FROM. The row says `from vishal@…` because of this, and
    // closing it tells the offer the work is done.
    offer_id: String(offer.id),
    created_at: opts.now,
    updated_at: opts.now,
    closed_at: "",
  };
}

/**
 * Whether a move is legal, as the database's trigger also says.
 *
 * STATED TWICE ON PURPOSE, and that is not duplication of the kind this project
 * avoids: the app says it so a person is never shown a button that will fail,
 * and the database says it so a client that gets it wrong cannot write the row
 * anyway. The comment in `migrate_offers.sql` is the other half of this one.
 */
export function canAnswer(offer, who) {
  if (!offer || offer.state !== "offered") return false;
  return normaliseEmail(offer.to_email) === normaliseEmail(who);
}

export function canWithdraw(offer, ownerId) {
  if (!offer || offer.state !== "offered" || offer.from_owner !== ownerId) return false;
  // A QUEUED ONE IS CANCELLED, NOT WITHDRAWN (session 161). Offering a Withdraw
  // on an offer that has never left the phone would send a message about a
  // message nobody received, and the database has no row to update.
  return !offer.pending;
}

/**
 * Every offer still waiting on this person, newest first.
 *
 * The strip at the foot of the list is drawn when this is not empty and is not
 * drawn when it is, which is the whole of its rule: a tab for a thing that
 * never happens is 44px of a screen that has a 70% floor to meet.
 */
export function waitingFor(offers, who) {
  const me = normaliseEmail(who);
  return (offers ?? [])
    .filter((o) => o.state === "offered" && normaliseEmail(o.to_email) === me)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

/**
 * TASKS THAT HAVE BEEN TAKEN BY SOMEBODY ELSE AND ARE STILL ON THIS LIST
 * (session 162, his report: "the task doesn't vanish when the other account
 * accepts").
 *
 * IT NEVER DID, AND THAT WAS A HOLE RATHER THAN A SLIP. Session 159's own
 * table said `accept -> task deleted`, and nothing deleted it. The recipient
 * CANNOT: `cascade_task` is locked to one owner by four policies, which is the
 * decision the whole feature rests on. So the only device that can remove the
 * sender's row is the sender's, and the only thing it can act on is the offer
 * coming back marked `accepted`.
 *
 * ASKED OF THE OFFERS AND THE STORE TOGETHER, so it is a fact and not a
 * guess: an offer that says accepted, whose task is still here, under an owner
 * who is this person. Anything else is somebody else's row or already gone.
 *
 * THE DELETE IS SAFE TO REPEAT AND SAFE TO LOSE. Running twice finds nothing
 * the second time; failing leaves the task on the list and the offer still
 * saying accepted, so the next pull tries again. The one thing it must never
 * do is fire on a state that is not `accepted` — a declined or withdrawn offer
 * means the work came back, and deleting then would destroy the task this
 * feature exists to protect.
 */
export function handedOver(offers, ownerId, tasks) {
  const here = new Set((tasks ?? []).map((t) => t?.id).filter(Boolean));
  const out = [];
  for (const o of offers ?? []) {
    if (!o || o.state !== "accepted") continue;
    if (o.from_owner !== ownerId) continue;
    if (o.pending) continue;
    if (!here.has(o.task_id)) continue;
    out.push({ taskId: o.task_id, offerId: o.id, to: o.to_email });
  }
  return out;
}

/** Everything this person has handed over and not had back. His answer 1. */
export function givenAway(offers, ownerId) {
  return (offers ?? [])
    // NOT THE QUEUED ONES (session 161). Nothing has been given away until
    // somebody has been told, and a list that counted a hand-off still sitting
    // in a tunnel would say he had delegated work that nobody has seen.
    .filter((o) => o.from_owner === ownerId && o.state !== "withdrawn" && !o.pending)
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}
