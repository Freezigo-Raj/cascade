// Cascade Part A — the offer table, talked to.
//
// `offer.js` holds every rule and imports nothing; this file holds the calls
// and decides nothing. The same seam session 127 cut for the alarm's write
// path and session 148 cut for the calendar: a path a check cannot reach is a
// path that stays green while it is broken.
//
// ===========================================================================
// AN OFFER IS NOT LOCAL-FIRST, AND THAT IS DELIBERATE.
//
// Everything else in this app writes to the cache first and syncs later,
// because a task is a thought and a thought does not need a network. An offer
// is a MESSAGE TO ANOTHER PERSON. Queueing one silently would mean he presses
// `Give to Raj`, sees it leave his list, and finds out tomorrow that Raj never
// got it — the failure being invisible for a day is exactly what makes it bad.
//
// So sending needs a connection and says so at the moment of pressing. The
// task's own change rides the ordinary outbox like every other write.
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

/** A record into a row, and back, the way `store.row.js` does it for tasks. */
function toRow(offer) {
  const row = { ...offer };
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
async function ownerId() {
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
  return { ok: true, count: (data ?? []).length };
}

/**
 * Hand a task to somebody.
 *
 * The task is NOT touched here. It stays exactly as it was, on his list, and
 * the row simply learns it is out with someone — which it learns by reading
 * the offers, not by carrying a flag of its own.
 */
export async function send(task, toEmail) {
  const sb = db();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  if (!O.looksLikeEmail(toEmail)) return { ok: false, why: "That does not look like an email address." };
  const mine = myEmail();
  if (O.normaliseEmail(toEmail) === mine) return { ok: false, why: "That is your own address." };
  if (!O.canSend(task, await known())) return { ok: false, why: "This task cannot be handed over." };

  const owner = await ownerId();
  if (!owner) return { ok: false, why: "Not signed in, so there is nobody to send it from." };

  const offer = O.makeOffer(task, toEmail, {
    id: crypto.randomUUID(), owner, fromEmail: mine, now: nowIso(),
  });
  const { error } = await sb.from("cascade_offer").insert(toRow(offer));
  if (error) return { ok: false, why: error.message || String(error) };

  await cache.add(offer);
  window.dispatchEvent(new CustomEvent("cascade:offers-changed"));
  return { ok: true, offer };
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
  refresh().catch(() => {});
  window.addEventListener("cascade:tasks-written", async () => {
    // A task that came from an offer and has just been closed owes its sender
    // an answer. Cheap: the filter is on a field that is empty on every task
    // nobody handed over.
    try {
      for (const t of await tasks.all()) if (t.offer_id) await reportDone(t);
    } catch { /* a report that cannot be sent is retried on the next write. */ }
  });
}
