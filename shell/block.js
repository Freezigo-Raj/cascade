// Cascade Part A — refusing tasks from an address (session 161, his request:
// "allow user to select if they want to report spam email so they don't
// receive tasks from them").
//
// Imports nothing, like every rules file here, so a check can read it.
//
// ===========================================================================
// HIS ANSWER: DECLINED FOR PEOPLE I KNOW, SILENT FOR STRANGERS.
//
// Two different things, and the difference is the whole of this file.
//
//   a colleague who used the wrong address  -> gets a decline, and knows
//   a stranger sending work nobody asked for -> gets nothing, and learns nothing
//
// An auto-decline is kinder and it is also a RECEIPT: it tells whoever sent it
// that the address is real and somebody is behind it. That is exactly what a
// person sending unwanted work wants to find out, and exactly what somebody
// who mistyped a colleague's address needs to be told. So the verdict depends
// on whether there is a history, and nothing else.
//
// WHAT "KNOW" MEANS, stated once: any OTHER offer between the two of them, in
// either direction, in any state. One is enough. A name typed into the contact
// list is NOT an exchange — a name is something he wrote on his own phone, and
// a stranger does not become known because the address was once typed.
//
// AND IT IS DECIDED ON THE EMAIL CLAIM, which is the one place this file
// trusts something it should not be able to. `from_email` is written by the
// sender; `from_owner` is the authority the policy checks, and there is no
// directory to turn an owner id into an address with. So a sender who forged
// `from_email` to look like somebody known would earn themselves a DECLINE
// instead of silence. That is the whole exposure: the worst a forgery buys is
// a worse outcome for the forger. Not worth a directory.
//
// ===========================================================================
// WHY THE LIST IS ON THE SERVER WHEN THE CONTACT NAMES ARE NOT.
//
// A nickname is a convenience and lives on the phone (`contact.js`). A block is
// a BOUNDARY. One that evaporates when storage is cleared, or that is absent
// on a second phone, is not a boundary — it is a setting that happens to have
// worked once. `cascade_block` is one row per blocked address per owner, and
// nobody but its owner can read it.

/** An address as the policies compare it: trimmed and lower-cased. Written out
 * rather than imported, for the same reason `repeat.js` writes out its own
 * open test: this file imports nothing. */
export const normalise = (text) => String(text ?? "").trim().toLowerCase();

/**
 * THE COLUMNS OF `cascade_block`, and the row builder is held to them.
 *
 * Session 152's defect, and session 161 found the same mistake waiting in the
 * offer table: a row built by spreading a record sends whatever the record
 * happens to carry, PostgREST refuses a column that does not exist, and the
 * queue stops at the first failure to keep its order. So no row in this
 * project is built by a spread any more. `check_offers.mjs` reads the
 * migration and holds this list to it, both ways.
 */
export const BLOCK_COLUMNS = ["owner", "email", "created_at", "created_at_offset"];

/** A record into a row, from the column list and not from the record. */
export function blockRow(block) {
  const row = {};
  for (const k of BLOCK_COLUMNS) if (k in block) row[k] = block[k];
  return row;
}

/** A new block. `owner` is the authority; the policy checks it. */
export function makeBlock(email, owner, now) {
  return {
    owner,
    email: normalise(email),
    created_at: now,
    created_at_offset: now ? String(now).slice(-6) : null,
  };
}

/** Whether this address is on the list. */
export function isBlocked(email, blocks) {
  const at = normalise(email);
  if (!at) return false;
  return (blocks ?? []).some((b) => normalise(b?.email) === at);
}

/**
 * Whether these two have ever exchanged a task before.
 *
 * `not` is the offer being judged, excluded by id: without it every offer is
 * its own history and every stranger reads as known.
 */
export function hasHistory(email, offers, me, not) {
  const them = normalise(email), mine = normalise(me);
  if (!them || !mine) return false;
  return (offers ?? []).some((o) => {
    if (!o || (not && o.id === not)) return false;
    const from = normalise(o.from_email), to = normalise(o.to_email);
    return (from === them && to === mine) || (from === mine && to === them);
  });
}

/**
 * WHAT TO DO WITH AN ARRIVING OFFER. The one function the screens ask.
 *
 *   allow    show it in the Received strip, as normal
 *   decline  answer it automatically, with a reason, and do not show it
 *   silent   never show it, never answer it, and leave it in the Blocked list
 *
 * `silent` leaves the row sitting at `offered` on the sender's side for ever,
 * which is the point and is also why it is kept somewhere he can look: a block
 * applied in anger to the wrong address must be findable, or the work is gone
 * with no trace of where.
 */
export function verdictFor(offer, state) {
  if (!offer) return "allow";
  const { blocks, offers, me } = state ?? {};
  if (normalise(offer.to_email) !== normalise(me)) return "allow";
  if (!isBlocked(offer.from_email, blocks)) return "allow";
  return hasHistory(offer.from_email, offers, me, offer.id) ? "decline" : "silent";
}

/** The reason an auto-decline carries. One sentence, and it says who did it,
 * because a decline with no reason reads as a person's answer and this is not
 * one. */
export const BLOCKED_REASON = "Blocked by the recipient, so this was declined automatically.";

/** Offers held back by a block, for the Blocked list to draw. Newest first. */
export function heldBack(offers, state) {
  return (offers ?? [])
    .filter((o) => o.state === "offered" && verdictFor(o, state) === "silent")
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

/** Every address blocked, newest first, for the account screen's list. */
export function blockedList(blocks) {
  return (blocks ?? [])
    .filter((b) => b && b.email)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}
