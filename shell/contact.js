// Cascade Part A — the addresses he has sent to, with the names he gave them
// (session 161, his request: "emails already entered can be selected from drop
// down for future; better to have name and email for easier selection").
//
// Imports nothing, like every rules file here.
//
// ===========================================================================
// THE NAME STAYS ON HIS PHONE. HIS ANSWER, AND IT IS THE CHEAP ONE ON PURPOSE.
//
// Three ways a name could have worked:
//
//   his label, on his phone      Raj's app shows the address. No column, no
//                                migration, no directory. THIS ONE.
//   his own name, travelling     Raj sees `from Vishal`. One column, one
//                                migration, and a name every recipient can read.
//   both                         Two fields and two places to be wrong.
//
// A name here is HIS WORD FOR SOMEBODY, not that person's name for themselves.
// `Raj`, `Hazrat`, `the CA`. It is a label on a contact card, and labelling is
// a thing a person does privately. That it needs no database at all is the
// second reason and not the first.
//
// IT IS ALSO WHY THERE IS STILL NO DIRECTORY. The suggestion list is built out
// of HIS OWN offers — addresses he has written to, and addresses that have
// written to him — which are rows the policy already lets him read. Nothing
// here can be asked who else uses Cascade.

/** An address as the policies compare it. Written out: this file imports
 * nothing. */
export const normalise = (text) => String(text ?? "").trim().toLowerCase();

/** A name worth keeping: trimmed, and capped so a label stays a label. */
export function cleanName(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
}

/** A contact card. `email` is the key; the name may be empty. */
export function makeContact(email, name, now) {
  return { id: normalise(email), email: normalise(email), name: cleanName(name), used_at: now ?? null };
}

/**
 * Put a contact in, or correct the one already there.
 *
 * A BLANK NAME NEVER ERASES ONE. Sending to an address touches its card to
 * keep the ordering fresh, and the send box may have had no name in it at the
 * time; treating that as a rename would quietly lose the label the first time
 * he picked a contact and pressed send without retyping it.
 */
export function upsert(list, contact) {
  const at = normalise(contact?.email);
  if (!at) return [...(list ?? [])];
  const out = (list ?? []).filter((c) => normalise(c?.email) !== at);
  const was = (list ?? []).find((c) => normalise(c?.email) === at);
  out.push({
    id: at,
    email: at,
    name: cleanName(contact.name) || cleanName(was?.name),
    used_at: contact.used_at ?? was?.used_at ?? null,
  });
  return out;
}

/** Drop a card. The address can still be typed; this only forgets the name. */
export function forget(list, email) {
  const at = normalise(email);
  return (list ?? []).filter((c) => normalise(c?.email) !== at);
}

/** His word for an address, or nothing. */
export function nameFor(email, contacts) {
  const at = normalise(email);
  const c = (contacts ?? []).find((x) => normalise(x?.email) === at);
  return cleanName(c?.name);
}

/**
 * What a row, a strip or a dropdown shows for an address.
 *
 * `Raj` once he has named one, and the bare address until then. NOT
 * `Raj <raj@…>`: the row this appears on already competes for width with the
 * task title, and a name he chose himself is not a thing he needs the address
 * beside to recognise. The dropdown shows both, because choosing is the one
 * moment the address itself matters.
 */
export function labelFor(email, contacts) {
  return nameFor(email, contacts) || normalise(email);
}

/** Both, for the dropdown. */
export function pickerLabel(contact) {
  const name = cleanName(contact?.name);
  const at = normalise(contact?.email);
  return name ? `${name} — ${at}` : at;
}

/**
 * THE DROPDOWN'S LIST: every address he has a history with, plus every card he
 * has written a name on, most recently used first.
 *
 * Built from the offers rather than kept as a separate list of "people", so it
 * cannot drift out of step with who he has actually written to. A card he
 * named but never used still appears, because he named it on purpose.
 *
 * `used_at` is the newest offer either way, which is why a person he answered
 * yesterday sits above one he sent to last month.
 */
export function suggestions(offers, me, contacts) {
  const mine = normalise(me);
  const seen = new Map();
  const touch = (email, at) => {
    const key = normalise(email);
    if (!key || key === mine) return;
    const was = seen.get(key);
    if (!was || String(at ?? "") > String(was.used_at ?? "")) {
      seen.set(key, { email: key, used_at: at ?? was?.used_at ?? null });
    } else if (!was.used_at) {
      seen.set(key, { email: key, used_at: at ?? null });
    }
  };
  for (const o of offers ?? []) {
    if (!o) continue;
    const from = normalise(o.from_email), to = normalise(o.to_email);
    const at = o.updated_at || o.created_at || null;
    if (from === mine) touch(to, at);
    if (to === mine) touch(from, at);
  }
  for (const c of contacts ?? []) touch(c?.email, c?.used_at);
  return [...seen.values()]
    .map((s) => ({ email: s.email, name: nameFor(s.email, contacts), used_at: s.used_at }))
    .sort((a, b) => {
      const d = String(b.used_at ?? "").localeCompare(String(a.used_at ?? ""));
      return d !== 0 ? d : a.email.localeCompare(b.email);
    });
}
