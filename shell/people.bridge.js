// Cascade Part A — the people he hands work to: their names, and the addresses
// he will not take work from (session 161).
//
// `contact.js` and `block.js` hold every rule and import nothing; this file
// holds the calls and decides nothing. The seam session 127 cut for the alarm.
//
// ===========================================================================
// TWO LISTS, TWO PLACES, AND THE SPLIT IS THE POINT OF THIS FILE.
//
//   names    `makeStore("contact")` — this phone, and nowhere else
//   blocks   `cascade_block` — the account, so it follows him
//
// A nickname is a convenience and losing it costs a retype. A block is a
// boundary, and one that is absent on a second phone is not a boundary. They
// are different kinds of fact and they are stored differently on purpose,
// which is worth stating here because a reader who assumed both were local
// would put the next boundary in the wrong place.

const v = new URL(import.meta.url).search;
const { client } = await import(`./supabase.js${v}`);
const { account } = await import(`./auth.js${v}`);
const { makeStore } = await import(`./store.js${v}`);
const C = await import(`./contact.js${v}`);
const B = await import(`./block.js${v}`);

const names = makeStore("contact");
const blocked = makeStore("block");

const nowIso = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  const p = (n) => String(Math.abs(n)).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000);
  return local.toISOString().slice(0, 19) + sign + p(Math.trunc(off / 60)) + ":" + p(off % 60);
};

async function ownerId() {
  const who = await account.current().catch(() => null);
  return who?.id ?? null;
}

const announce = () => window.dispatchEvent(new CustomEvent("cascade:people-changed"));

// ------------------------------------------------------------------- names

/** Every card on this phone. */
export async function contacts() {
  return await names.all();
}

/**
 * Name an address, or correct the name on one.
 *
 * `upsert` is in `contact.js` and is the rule; this writes what it returns.
 * A BLANK NAME NEVER ERASES ONE, which is that function's decision and is
 * relied on here: `touch` below calls this on every send, often with nothing
 * typed in the name box.
 */
export async function nameContact(email, name, when) {
  const at = C.normalise(email);
  if (!at) return { ok: false, why: "No address." };
  const was = await names.all();
  const next = C.upsert(was, C.makeContact(at, name, when ?? nowIso()));
  const card = next.find((c) => c.email === at);
  const existed = was.some((c) => C.normalise(c?.email) === at);
  if (existed) await names.update(at, card);
  else await names.add(card);
  announce();
  return { ok: true, contact: card };
}

/** Keep the ordering fresh without touching the name. Called on every send. */
export async function touch(email) {
  return await nameContact(email, "", nowIso());
}

/** Forget the name. The address can still be typed; only the label goes. */
export async function forgetContact(email) {
  const at = C.normalise(email);
  if (!(await names.all()).some((c) => C.normalise(c?.email) === at)) return { ok: true };
  await names.remove(at);
  announce();
  return { ok: true };
}

// ------------------------------------------------------------------ blocks

/** Every address blocked, as this device last saw the list. */
export async function blocks() {
  return await blocked.all();
}

/**
 * Pull the list.
 *
 * ABSENCE IS THE TOMBSTONE, as it is for the task pull and the offer pull: an
 * address the server no longer returns was unblocked on another device, so it
 * leaves the cache. The alternative is a block that cannot be undone except on
 * the phone that made it.
 */
export async function refreshBlocks() {
  const sb = client();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const { data, error } = await sb.from("cascade_block").select("*");
  if (error) return { ok: false, why: error.message || String(error) };
  const seen = new Set();
  for (const row of data ?? []) {
    const rec = { ...row, id: B.normalise(row.email) };
    seen.add(rec.id);
    const here = await blocked.all();
    if (here.some((b) => b.id === rec.id)) await blocked.update(rec.id, rec);
    else await blocked.add(rec);
  }
  for (const b of await blocked.all()) if (!seen.has(b.id)) await blocked.remove(b.id);
  announce();
  return { ok: true, count: seen.size };
}

/**
 * Block an address.
 *
 * THE SERVER FIRST, THE CACHE SECOND, which is the order every contended write
 * in this project uses: the row is the truth and the local copy follows it.
 * A block written locally and refused by the server would be a boundary the
 * person believed in and the database had never heard of.
 *
 * Blocking twice is not an error. `(owner, email)` is the primary key, so the
 * second insert is a conflict, and a conflict here means the thing he asked
 * for is already true.
 */
export async function blockEmail(email) {
  const sb = client();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const at = B.normalise(email);
  if (!at) return { ok: false, why: "No address." };
  const owner = await ownerId();
  if (!owner) return { ok: false, why: "Not signed in." };
  if (at === B.normalise(account.knownEmail() || "")) {
    return { ok: false, why: "That is your own address." };
  }
  const rec = B.makeBlock(at, owner, nowIso());
  const { error } = await sb.from("cascade_block").upsert(B.blockRow(rec), {
    onConflict: "owner,email",
  });
  if (error) return { ok: false, why: error.message || String(error) };
  const here = await blocked.all();
  const cached = { ...rec, id: at };
  if (here.some((b) => b.id === at)) await blocked.update(at, cached);
  else await blocked.add(cached);
  announce();
  return { ok: true, block: cached };
}

/** Unblock. A delete, because there is nothing about a block to change. */
export async function unblock(email) {
  const sb = client();
  if (!sb) return { ok: false, why: "No Supabase project is configured." };
  const at = B.normalise(email);
  const owner = await ownerId();
  if (!owner) return { ok: false, why: "Not signed in." };
  const { error } = await sb.from("cascade_block").delete().eq("owner", owner).eq("email", at);
  if (error) return { ok: false, why: error.message || String(error) };
  if ((await blocked.all()).some((b) => b.id === at)) await blocked.remove(at);
  announce();
  return { ok: true };
}

/**
 * The dropdown's list, assembled: addresses out of his own offers, names off
 * this phone, blocked ones marked.
 *
 * MARKED RATHER THAN REMOVED. He may well want to send TO somebody he will not
 * take work FROM — a block is about what arrives, and nothing about it says he
 * has stopped delegating to them. Hiding the address would make one switch
 * mean two things.
 */
export async function pickList(offers, me) {
  const cards = await contacts();
  const stop = await blocks();
  return C.suggestions(offers, me, cards)
    .map((s) => ({ ...s, blocked: B.isBlocked(s.email, stop) }));
}
