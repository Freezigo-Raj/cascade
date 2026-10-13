// Cascade Part A — the offer table, talked to.
//
// `offer.js` holds every rule and imports nothing; this file holds the calls
// and decides nothing. The same seam session 127 cut for the alarm's write
// path and session 148 cut for the calendar: a path a check cannot reach is a
// path that stays green while it is broken.
//
// ===========================================================================
// AN OFFER IS LOCAL-FIRST AFTER ALL, AND THE REASON MY FIRST ANSWER WAS WRONG
// IS WORTH KEEPING (session 161).
//
// Session 159 made sending need a connection, on this reasoning: an offer is a
// message to another person, so queueing one would mean he presses `Give to
// Raj`, watches it leave his list, and finds out tomorrow that Raj never got
// it — a failure invisible for a day.
//
// His instruction: "signal can't work, it can send later when connection
// arrives — no change in task till then unless cancelled."
//
// THE SECOND HALF OF THAT SENTENCE IS WHAT ANSWERS THE OBJECTION. The failure
// was only invisible because I had the task leaving his list at the press. If
// the task does not move until the offer has actually landed, there is nothing
// to be misled about: the row says `Sending to Raj`, the work is still his,
// and Cancel costs nothing. The thing I was protecting against was a
// consequence of my own ordering, not of queueing.
//
// So a queued offer is written to the cache with `pending: true`, the task is
// untouched, and `drain()` sends it when there is a signal. `pending` is the
// one field the server has no column for, which is why `offer.js` now builds
// the row from a column list rather than by spreading the record.
//
// ORDERING, which is the one thing that must not be got wrong: THE OFFER IS
// WRITTEN BEFORE THE TASK CHANGES, every time. The offer row is the contended
// thing — two devices, two people, a withdraw racing an accept — so whatever
// the database says about it is the truth, and the local change is made only
// after the database has agreed. Written the other way round, a refused offer
// would leave a task that had already been given away.

const v = new URL(import.meta.url).search;
const { client } = await import(`./supabase.js${v}`);
const { account } = await import(`./auth.js${v}`);
const { partAConfig } = await import(`./config.js${v}`);
const { tasks } = await import(`./store.select.js${v}`);
const { makeStore } = await import(`./store.js${v}`);
const O = await import(`./offer.js${v}`);
const B = await import(`./block.js${v}`);
const people = await import(`./people.bridge.js${v}`);

/** The last answer from the server, so the strip can draw with no signal. */
const cache = makeStore("offer");

const nowIso = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000);
  return local.toISOString().slice(0, 19) + sign + p(Math.trunc(off / 60)) + ":" + p(off % 60);
};

const offsetOf = (iso) => (iso ? String(iso).slice(-6) : null);
const INSTANTS = ["created_at", "updated_at", "done_at"];

/**
 * A record into a row, and back, the way `store.row.js` does it for tasks.
 *
 * IT WAS A SPREAD UNTIL SESSION 161, and that was session 152's defect sitting
 * in a second table waiting for its first local-only field. `O.offerRow` keeps
 * only the names `OFFER_COLUMNS` holds, so `pending` cannot reach PostgREST,
 * be refused, and stop the queue behind it.
 */
function toRow(offer) {
  const row = O.offerRow(offer);
  for (const f of INSTANTS) {
    row[f] = offer[f] || null;
    row[`${f}_offset`] = offsetOf(offer[f]);
  }
  return row;
}
function fromRow(row) {
  const out = { ...row };
  for (const f of INSTANTS) {
    const at = row[f], off = row[`${f}_offset`];
    delete out[`${f}_offset`];
    out[f] = at && off ? shift(at, off) : "";
  }
  return out;
}
/** Postgres hands back UTC; the offset says what local reading produced it. */
function shift(iso, offset) {
  const sign = offset[0] === "-" ? -1 : 1;
  const mins = sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
  const local = new Date(Date.parse(iso) + mins * 60000);
  const p = (n) => String(n).padStart(2, "0");
  return `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
         `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}${offset}`;
}

function db() {
  return client();
}

/**
 * This account's id, which is what `from_owner` is checked against.
 *
 * `account.current()` is a network call and that is acceptable HERE and
 * nowhere near the boot path: every caller of this is already a press that
 * needs the server, so a question the server answers costs nothing extra.
 */
/**
 * THIS ACCOUNT'S ID, WITH NO NETWORK (session 162, his first report).
 *
 * It was `account.current()`, which is `getUser()` and is a network call, so
 * an offline press was refused with "Not signed in, so there is nobody to send
 * it from" while the account screen said the opposite. The account screen was
 * right.
 *
 * `knownId()` reads what this app wrote down when a real session last arrived.
 * `current()` is kept as a fallback for the one case the local answer cannot
 * cover — a first sign-in on a device that has never stored anything — and is
 * only reached when the local answer is empty, so it never costs an offline
 * press a single millisecond.
 */
async function ownerId() {
  const local = account.knownId();
  if (local) return local;
  const who = await account.current().catch(() => null);
  return who?.id ?? null;
}

/** This account's address, which is what every offer is matched against. */
export function myEmail() {
  return O.normaliseEmail(account.knownEmail() || "");
}

/** Offers this device last saw. Reads the cache and never the network. */
export async function known() {
  return await cache.all();
}

/**
 * Fetch every offer this account may see, and remember it.
 *
 * NO FILTER IS WRITTEN HERE. The select policy already answers only what is
 * his or addressed to him, and a `where` clause repeating that would be a
 * second statement of the rule that could drift from the first. Absence is the
 * tombstone, the same as the task pull: what the server no longer returns is
 * dropped from the cache.
 */
export async function refresh() {
  const sb = db();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const { data, error } = await sb.from("cascade_offer").select("*");
  if (error) return { ok: false, why: error.message || String(error) };

  const seen = new Set();
  for (const row of data ?? []) {
    const rec = fromRow(row);
    seen.add(rec.id);
    const had = (await cache.all()).find((o) => o.id === rec.id);
    if (had) await cache.update(rec.id, rec);
    else await cache.add(rec);
  }
  for (const o of await cache.all()) if (!seen.has(o.id)) await cache.remove(o.id);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  // AND THE HALF OF THE HANDOVER THAT WAS NEVER WRITTEN (session 162).
  const gone = await collect();
  return { ok: true, count: (data ?? []).length, gone: gone.length };
}

/**
 * THE TASK LEAVES THIS LIST WHEN SOMEBODY ELSE HAS TAKEN IT.
 *
 * His report: "the task doesn't vanish when the other account accepts." It
 * never did. Session 159's table said `accept -> task deleted` and no code
 * deleted it, because the only device that CAN is this one — `cascade_task` is
 * locked to one owner, which is the decision the whole feature rests on — and
 * nothing on this device was watching for the answer coming back.
 *
 * SO IT HAPPENS ON THE PULL, where the answer arrives, and not at a press. The
 * accept is somebody else's press on another phone; there is no moment here to
 * hang it on but the one where the offer is read.
 *
 * `handedOver` decides which, and it refuses every state but `accepted`: a
 * declined or withdrawn offer means the work came BACK, and deleting then
 * would destroy the task this feature exists to protect.
 */
export async function collect() {
  const owner = await ownerId();
  if (!owner) return [];
  const taken = O.handedOver(await known(), owner, await tasks.all());
  const done = [];
  for (const t of taken) {
    try {
      await tasks.remove(t.taskId);
      done.push(t);
    } catch (e) {
      // LEFT ON THE LIST RATHER THAN HALF-REMOVED. The offer still says
      // accepted, so the next pull tries again; a task that failed to delete
      // is a task still owed, which is the safe side of this to be wrong on.
      console.warn("offers: handed-over task not removed —", e?.message ?? e);
    }
  }
  if (done.length) {
    window.dispatchEvent(new CustomEvent("cascade:store-changed", { detail: "handed-over" }));
    window.dispatchEvent(new CustomEvent("cascade:handed-over", { detail: done }));
  }
  return done;
}

/**
 * Hand a task to somebody.
 *
 * The task is NOT touched here. It stays exactly as it was, on his list, and
 * the row simply learns it is out with someone — which it learns by reading
 * the offers, not by carrying a flag of its own.
 */
export async function send(task, toEmail, name) {
  if (!O.looksLikeEmail(toEmail)) return { ok: false, why: "That does not look like an email address." };
  const mine = myEmail();
  if (O.normaliseEmail(toEmail) === mine) return { ok: false, why: "That is your own address." };
  if (!O.canSend(task, await known())) return { ok: false, why: "This task cannot be handed over." };

  // THE OWNER IS THE ONE THING THAT CANNOT BE DEFERRED. `from_owner` is what
  // the insert policy checks, and a queued offer carrying the wrong one would
  // be refused days later with nothing on screen at the time. `account.current()`
  // answers from the stored session when there is no signal, so this costs
  // nothing offline — and if it cannot answer at all, the send is refused now
  // rather than queued to fail.
  const owner = await ownerId();
  if (!owner) return { ok: false, why: "Not signed in, so there is nobody to send it from." };

  // A FRESH UUID AND NOT A DERIVED ID, which is the opposite of what repeats,
  // calendar imports and accepts all do, so the difference is worth stating.
  // Those four derive an id because several INDEPENDENT things can produce the
  // same row and must agree on it. An offer has one producer: this press. The
  // id is minted once and stored, so a drain that retries after a lost reply
  // sends the same id and the primary key refuses the duplicate. Deriving from
  // `task_id` and the address instead would have made re-sending a task to the
  // same person after a decline collide with the declined row.
  const offer = O.makeOffer(task, toEmail, {
    id: crypto.randomUUID(), owner, fromEmail: mine, now: nowIso(), pending: true,
  });

  // THE CACHE FIRST, ALWAYS, AND THE TASK NEVER. The row shows `Sending to …`
  // off `pending`, and the work stays his until the offer has actually landed.
  await cache.add(offer);
  await people.touch(toEmail);
  if (name) await people.nameContact(toEmail, name);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));

  // And then try, once, now. A press with a signal behind it should not wait
  // for a drain the person cannot see.
  const out = await push(offer);
  return out.ok
    ? { ok: true, offer: out.offer, queued: false }
    : { ok: true, offer, queued: true, why: out.why };
}

/**
 * Put one queued offer on the server and clear its `pending` mark.
 *
 * Separated from `send` because the drain calls it too, and because the thing
 * that must be identical in both paths is what the server is told.
 */
async function push(offer) {
  const sb = db();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const { error } = await sb.from("cascade_offer").insert(toRow(offer));
  // ALREADY THERE IS SUCCESS. A reply lost on the way back leaves a row written
  // and an offer still marked pending, and the retry hits the primary key. The
  // thing he asked for is true, so the mark comes off.
  if (error && !/duplicate key|already exists|23505/i.test(error.message || "")) {
    return { ok: false, why: error.message || String(error) };
  }
  const landed = { ...offer, pending: false };
  await cache.update(offer.id, landed);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  return { ok: true, offer: landed };
}

/**
 * Send everything waiting, OLDEST FIRST, AND STOP AT THE FIRST FAILURE.
 *
 * The order is his: two hand-offs made in a tunnel land in the order he made
 * them, because the second may have been a correction of the first. Stopping
 * at the first failure is the task outbox's rule and it is here for the same
 * reason — carrying on past a refusal would deliver the second before the
 * first, which is the one thing ordering exists to prevent.
 *
 * SESSION 152 IS THE OTHER HALF OF THAT RULE: a queue that stops must not be
 * able to stop for ever on a row no retry can fix. The offers queue is its own
 * queue and no task write passes through it, so a jam here delays hand-offs and
 * nothing else. That is the whole reason it is separate.
 */
export async function drain() {
  const waiting = O.queued(await known());
  let sent = 0;
  for (const offer of waiting) {
    const out = await push(offer);
    if (!out.ok) return { ok: false, sent, waiting: waiting.length - sent, why: out.why };
    sent++;
  }
  return { ok: true, sent, waiting: 0 };
}

/**
 * Call off a send that has not gone yet. Deleted, not withdrawn.
 *
 * Nobody was told, so there is nothing to take back and nothing to record. A
 * `withdrawn` row would be a history of a thing that never happened.
 */
export async function cancelSend(offer) {
  if (!O.canCancelSend(offer)) {
    return { ok: false, why: "That offer has already gone out. Withdraw it instead." };
  }
  await cache.remove(offer.id);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  return { ok: true };
}

/** Take it back, while it is still unanswered. */
export async function withdraw(offer) {
  const sb = db();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const owner = await ownerId();
  if (!O.canWithdraw(offer, owner)) return { ok: false, why: "That offer has already been answered." };
  return await settle(offer, { state: "withdrawn" });
}

/**
 * Accept it.
 *
 * THE OFFER FIRST, THE TASK SECOND. If the sender withdrew it a moment ago the
 * database refuses this and no task is written; the other order would leave him
 * holding work nobody gave him.
 */
export async function accept(offer, edited) {
  const owner = await ownerId();
  if (!owner) return { ok: false, why: "Not signed in." };
  if (!O.canAnswer(offer, myEmail())) return { ok: false, why: "That offer is not yours to answer." };

  const task = O.fromOffer({ ...offer, edited: edited ?? offer.edited }, {
    now: nowIso(), config: partAConfig,
  });
  const done = await settle(offer, {
    state: "accepted",
    to_owner: owner,
    accepted_task_id: task.id,
    edited: edited ?? offer.edited ?? null,
  });
  if (!done.ok) return done;

  await tasks.add(task);
  window.dispatchEvent(new CustomEvent("cascade:tasks-written"));
  window.dispatchEvent(new CustomEvent("cascade:store-changed"));
  return { ok: true, task };
}

/** Refuse it, with a reason. His answer 4. */
export async function decline(offer, reason) {
  if (!O.canAnswer(offer, myEmail())) return { ok: false, why: "That offer is not yours to answer." };
  return await settle(offer, { state: "declined", decline_reason: String(reason ?? "").trim() || null });
}

/**
 * TELL THE OFFER THE WORK IS FINISHED, so the sender's `Given away` list can
 * say so. His answer 1: he delegated it, he did not stop caring about it.
 *
 * He cannot see the recipient's task — it is a row under somebody else's owner
 * — so this is the only channel there is, and it carries a date and a word and
 * nothing else about the task.
 */
export async function reportDone(task) {
  if (!task?.offer_id) return { ok: true };
  const mine = (await known()).find((o) => o.id === task.offer_id);
  if (!mine || mine.state !== "accepted") return { ok: true };
  const closed = task.task_state === "done" || task.task_state === "cancelled";
  if (closed && mine.done_at) return { ok: true };
  if (!closed && !mine.done_at) return { ok: true };
  return await settle(mine, {
    done_at: closed ? (task.closed_at || nowIso()) : null,
    done_state: closed ? task.task_state : null,
  });
}

/** One update, written the same way every time. */
async function settle(offer, change) {
  const sb = db();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const next = { ...offer, ...change, updated_at: nowIso() };
  const { error } = await sb
    .from("cascade_offer")
    .update(toRow(next))
    .eq("id", offer.id);
  // THE DATABASE'S ANSWER IS THE ANSWER. `cascade_offer_guard` refuses an
  // illegal move, and its message names the move rather than saying no — that
  // message is shown as it came, because one rewritten in friendlier words
  // cannot be looked up. Session 147 set that rule and it holds here.
  if (error) return { ok: false, why: error.message || String(error) };
  await cache.update(offer.id, next);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  return { ok: true, offer: next };
}

/**
 * Read the offers once per open, and once after any local write.
 *
 * NOT AWAITED BY THE BOOT PATH. Session 141: three awaits there turned an
 * offline launch into twenty-six seconds of blank screen and then the sign-in
 * page, with no alarm armed. Nothing here is worth one frame of the list.
 */
export function initOffers() {
  const sweep = () => {
    refresh()
      .then(() => applyBlocks())
      .catch(() => {});
    drain().catch(() => {});
  };
  sweep();
  people.refreshBlocks().catch(() => {});

  // THE SAME THREE TRIGGERS THE TASK PULL HAS, AND FOR THE SAME REASON
  // (session 162, his report: "task doesn't appear in another account when
  // sent if the app isn't restarted — same for withdraw").
  //
  // It had `online` and `cascade:signed-in` and nothing else, which meant the
  // offers were read ONCE PER LAUNCH. An offer arriving while the app sat open
  // was invisible until it was closed and reopened, and so was a withdraw —
  // the sender taking it back left it sitting in the recipient's strip, which
  // is worse than the arrival being late because it is an offer that can still
  // be accepted after it was cancelled.
  //
  // `store.sync.js` has pulled on these three since it was written: a signal
  // returning, the tab being looked at again, and a minute passing. Offers are
  // the same kind of row and were given one of the three. The number is stated
  // here rather than shared, because a config member for it would be a version
  // bump for a value neither file reads from the other.
  window.addEventListener("online", sweep);
  window.addEventListener("cascade:signed-in", sweep);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sweep();
  });
  setInterval(sweep, 60_000);

  window.addEventListener("cascade:tasks-written", async () => {
    // A task that came from an offer and has just been closed owes its sender
    // an answer. Cheap: the filter is on a field that is empty on every task
    // nobody handed over.
    try {
      for (const t of await tasks.all()) if (t.offer_id) await reportDone(t);
    } catch { /* a report that cannot be sent is retried on the next write. */ }
    // AND A TASK HE FINISHED HIMSELF WHILE IT WAS OUT WITH SOMEBODY comes back.
    try {
      await autoWithdraw();
    } catch { /* retried on the next write, like the report above. */ }
  });
}

/**
 * HE DID IT HIMSELF WHILE IT WAS OUT WITH SOMEBODY, SO IT COMES BACK (session
 * 161, his answer: pull it back automatically).
 *
 * WHY IT LIVES HERE AND NOT AT THE PRESS. Four different things close a task —
 * the list's Done, the lock screen's DONE, the lock screen's CANCEL and
 * `catchup.js` — and session 143 is the session that paid for putting a rule at
 * each of them instead of once behind all of them. This listens to the event
 * every one of them fires, so there is one statement of the rule and no closer
 * has to remember it.
 *
 * A QUEUED OFFER IS DROPPED RATHER THAN WITHDRAWN. Nobody was told, and he has
 * now done the work, so sending it afterwards would be sending somebody a
 * finished task.
 *
 * AND THE RACE, which will happen once: the recipient accepts a moment before
 * the withdraw arrives. `cascade_offer_guard` refuses it, because they hold a
 * copy and that cannot be un-given. THE ACCEPT STANDS. The alternative is
 * reporting a withdraw that did not happen and leaving two people holding the
 * same work with nobody told. `offers-changed` carries the sentence the screen
 * shows, because a refusal nobody can read is the thing session 147 ruled out.
 */
export async function autoWithdraw() {
  const mine = await known();
  const owner = await ownerId();
  const all = await tasks.all();
  const closed = new Set(
    all.filter((t) => t && (t.task_state === "done" || t.task_state === "cancelled"))
       .map((t) => t.id)
  );
  const out = [];
  for (const offer of mine) {
    if (offer.state !== "offered" || !closed.has(offer.task_id)) continue;
    if (offer.pending) { await cancelSend(offer); out.push({ id: offer.id, how: "cancelled" }); continue; }
    if (!O.canWithdraw(offer, owner)) continue;
    const done = await settle(offer, { state: "withdrawn" });
    if (done.ok) { out.push({ id: offer.id, how: "withdrawn" }); continue; }
    // Refused. Re-read rather than guess why: the only answer that matters is
    // whether they accepted, and the server is the only thing that knows.
    await refresh().catch(() => {});
    const now = (await known()).find((o) => o.id === offer.id);
    if (now && now.state === "accepted") {
      out.push({ id: offer.id, how: "beaten", to: now.to_email });
    }
  }
  if (out.length) {
    window.dispatchEvent(new CustomEvent("cascade:offers-changed", { detail: out }));
  }
  return out;
}

/**
 * ANSWER THE OFFERS A BLOCK SAYS TO ANSWER, and leave the rest alone.
 *
 * His answer: declined for people he knows, silent for strangers. `block.js`
 * decides which; this does what it says, and only the `decline` verdict is an
 * action at all. `silent` is the absence of one — the row stays at `offered` on
 * the sender's side for ever, which is the point of it, and it sits in the
 * Blocked list where he can find it if he blocked the wrong address.
 */
export async function applyBlocks() {
  const me = myEmail();
  const state = { blocks: await people.blocks(), offers: await known(), me };
  const did = [];
  for (const offer of state.offers) {
    if (offer.state !== "offered" || offer.pending) continue;
    if (B.verdictFor(offer, state) !== "decline") continue;
    const out = await settle(offer, { state: "declined", decline_reason: B.BLOCKED_REASON });
    if (out.ok) did.push(offer.id);
  }
  if (did.length) window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  return did;
}

/**
 * What the Received strip should actually show: offers waiting on him, minus
 * the ones a block is swallowing.
 *
 * ASKED HERE RATHER THAN IN THE SCREEN, so the strip cannot draw a row the
 * block list says is not there. `waitingFor` is the rule about who an offer is
 * addressed to; this is the rule about whether he wants it.
 */
export async function inbox() {
  const me = myEmail();
  const offers = await known();
  const state = { blocks: await people.blocks(), offers, me };
  return O.waitingFor(offers, me).filter((o) => B.verdictFor(o, state) === "allow");
}
