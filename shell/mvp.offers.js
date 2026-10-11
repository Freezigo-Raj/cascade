// Cascade Part A — the four surfaces a hand-off needs (session 161).
//
// Session 159 shipped the rules and the table and stopped there, on his own
// standing rule from session 137: a screen is the one layer no check can
// reach, and session 133 is what building three of them blind at the end of a
// long session cost. The rules have had a session of running since. These are
// the screens.
//
//   sendSheet     who to give it to, with the addresses he has used before
//   receivedStrip at the foot of the list, drawn only when something is waiting
//   mountOffer    one offer: what was sent, what he can change, accept or refuse
//   mountGiven    what he has handed over, and whether it is finished
//
// ONE FILE, BECAUSE THEY ARE ONE FEATURE and each is small. The alternative was
// four files that only ever import each other.
//
// NOTHING HERE DECIDES ANYTHING. Every question — may this be sent, who is
// waiting, what did they change, is this blocked — is asked of `offer.js`,
// `block.js`, `contact.js` or the bridge. A screen that computed any of it
// would be a second statement of a rule, and the one that drifts is always the
// copy nothing checks.

const v = new URL(import.meta.url).search;
const { el, button } = await import(`./mvp.paint.js${v}`);
const O = await import(`./offer.js${v}`);
const C = await import(`./contact.js${v}`);
const bridge = await import(`./offer.bridge.js${v}`);
const people = await import(`./people.bridge.js${v}`);

/** `20 Aug, 3pm` from a stored instant, read as the wall clock it is. */
function when(iso) {
  if (!iso) return "";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(String(iso).slice(0, 19));
  const h = ((d.getHours() + 11) % 12) + 1;
  const m = d.getMinutes() ? ":" + String(d.getMinutes()).padStart(2, "0") : "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h}${m}${d.getHours() < 12 ? "am" : "pm"}`;
}

/** The fields a person reads, in the order they matter. */
const SHOWN = [
  ["title", "Task"],
  ["date_phrase", "When"],
  ["due_at", "Date"],
  ["est_duration_min", "Takes"],
  ["commitment_type", "Kind"],
  ["notes", "Notes"],
];

function readable(field, value) {
  if (value === null || value === undefined || value === "") return "";
  if (field === "due_at") return when(value);
  if (field === "est_duration_min") return `${value} min`;
  return String(value);
}

// ------------------------------------------------------------------ sending

/**
 * WHO TO GIVE IT TO.
 *
 * A dialog and not a screen: it asks one thing, and a screen that asks one
 * thing is a screen a person has to find their way back from.
 *
 * THE LIST IS HIS OWN HISTORY (his request: "emails already entered can be
 * selected from drop down for future"). Built by `contact.suggestions` out of
 * the offers he can already read, so there is still no directory anywhere in
 * this feature and nothing here can be asked who else uses Cascade.
 *
 * A BLOCKED ADDRESS IS MARKED AND NOT REMOVED. A block is about what arrives;
 * nothing about it says he has stopped delegating to them, and hiding the
 * address would make one switch mean two things.
 *
 * @returns {Promise<{to:string,name:string}|null>} null on cancel
 */
export async function sendSheet(task, offers, me) {
  const list = await people.pickList(offers, me);

  return new Promise((settle) => {
    const veil = el("div", "veil");
    veil.dataset.dialog = "1";
    const box = el("div", "dialog send-sheet");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    box.appendChild(el("div", "dialog-said", `Give "${task.title}" to:`));

    const picked = el("input", "send-to");
    picked.type = "email";
    picked.placeholder = "name@example.com";
    picked.setAttribute("aria-label", "Their email address");

    const nameBox = el("input", "send-name");
    nameBox.type = "text";
    nameBox.maxLength = 40;
    nameBox.placeholder = "what you call them (optional)";
    nameBox.setAttribute("aria-label", "Your name for them");

    // THE PICKER IS CHIPS AND NOT A `<select>`. A select on Android opens a
    // system sheet over the dialog, which is a second modal over a modal, and
    // its options cannot carry the `blocked` mark. These are the same chips the
    // rest of screen 2 uses, so they are already thumb-sized and already
    // scroll.
    if (list.length) {
      const strip = el("div", "taps send-known");
      for (const s of list.slice(0, 12)) {
        const b = button("chip" + (s.blocked ? " chip-blocked" : ""), C.pickerLabel(s), () => {
          picked.value = s.email;
          nameBox.value = s.name || "";
          picked.dispatchEvent(new Event("input"));
        });
        if (s.blocked) b.title = "You do not take tasks from this address. Sending to it still works.";
        strip.appendChild(b);
      }
      box.appendChild(el("div", "label", "Sent to before"));
      box.appendChild(strip);
    }

    box.appendChild(picked);
    box.appendChild(nameBox);

    const why = el("div", "send-why");
    box.appendChild(why);

    const acts = el("div", "dialog-acts");
    const close = (answer) => {
      veil.remove();
      document.removeEventListener("keydown", onKey);
      settle(answer);
    };
    const onKey = (e) => { if (e.key === "Escape") close(null); };

    // Cancel first in the source and last on the row, so pressing the nearest
    // thing lands on the one that changes nothing. The dialog helper's rule.
    const cancel = button("act", "Cancel", () => close(null));
    cancel.dataset.cancel = "1";
    const go = button("act go", "Give it", () => {
      const to = O.normaliseEmail(picked.value);
      if (!O.looksLikeEmail(to)) { why.textContent = "That does not look like an email address."; return; }
      if (to === O.normaliseEmail(me)) { why.textContent = "That is your own address."; return; }
      close({ to, name: C.cleanName(nameBox.value) });
    });
    // The button is live from the start and says why on press rather than
    // sitting disabled: a dead control reads as a broken app, which is the
    // lesson session 142 paid for.
    picked.addEventListener("input", () => { why.textContent = ""; });

    acts.append(cancel, go);
    box.appendChild(acts);
    veil.appendChild(box);
    veil.addEventListener("click", (e) => { if (e.target === veil) close(null); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(veil);
    picked.focus();
  });
}

// ----------------------------------------------------------------- received

/**
 * THE STRIP AT THE FOOT OF THE LIST, drawn when something is waiting and NOT
 * DRAWN WHEN NOTHING IS.
 *
 * His words in session 159: "the received tasks tab is shown at bottom of app
 * in main page when such tasks exist." That conditional is the whole rule and
 * it is not politeness — session 139 put a 70% floor under the task rows, and
 * a permanent 44px strip for a thing that happens twice a month is 44px taken
 * off the list every other day.
 *
 * WHAT IT COUNTS IS `bridge.inbox()` AND NOT `waitingFor`. A block that
 * swallows an offer must also stop the strip announcing it, or the badge says
 * 1 and opening it shows nothing.
 */
export function receivedStrip(root, on) {
  let count = 0;

  async function draw() {
    const waiting = await bridge.inbox();
    count = waiting.length;
    root.innerHTML = "";
    root.style.display = count ? "" : "none";
    if (!count) return;

    const b = button("received", "", () => on.open());
    b.appendChild(el("span", "received-dot", String(count)));
    b.appendChild(el("span", "received-text",
      count === 1 ? "1 task sent to you" : `${count} tasks sent to you`));
    b.appendChild(el("span", "received-who",
      waiting.map((o) => on.labelFor(o.from_email)).slice(0, 2).join(", ")
      + (count > 2 ? ` +${count - 2}` : "")));
    root.appendChild(b);
  }

  draw();
  // Both events, because two different things change this: a pull from the
  // server, and a local accept or decline that has not been pulled back yet.
  const again = () => { draw().catch(() => {}); };
  window.addEventListener("cascade:offers-changed", again);
  window.addEventListener("cascade:people-changed", again);
  return {
    draw,
    count: () => count,
    unmount() {
      window.removeEventListener("cascade:offers-changed", again);
      window.removeEventListener("cascade:people-changed", again);
    },
  };
}

/**
 * EVERYTHING WAITING ON HIM, as rows.
 *
 * A screen between the strip and the answer, because answering is a decision
 * per task and a strip that opened straight into the first one would make the
 * second arrival harder to reach than the first.
 *
 * IT READS `bridge.inbox()`, which is `waitingFor` with the blocked ones taken
 * out. The strip counts the same call, so the number on it and the rows here
 * cannot disagree.
 */
export function mountReceived(root, on) {
  async function draw() {
    const waiting = await bridge.inbox();
    root.innerHTML = "";

    const head = el("div", "d-head");
    head.appendChild(el("div", "d-kind", "Sent to you"));
    head.appendChild(button("x", "\u2715", () => on.close()));
    root.appendChild(head);

    if (!waiting.length) {
      root.appendChild(el("div", "d-empty", "Nothing is waiting for you."));
      return;
    }

    for (const o of waiting) {
      const sent = O.asOffered(o);
      const r = button("given-row received-row", "", () => on.open(o));
      r.appendChild(el("div", "given-title", sent.title || "(no title)"));
      r.appendChild(el("div", "given-who",
        `from ${on.labelFor(o.from_email)} \u00b7 ${when(o.created_at)}`));
      if (sent.due_at) r.appendChild(el("div", "given-edit", `due ${when(sent.due_at)}`));
      root.appendChild(r);
    }
  }

  draw();
  const again = () => { draw().catch(() => {}); };
  window.addEventListener("cascade:offers-changed", again);
  window.addEventListener("cascade:people-changed", again);
  return {
    draw,
    unmount() {
      window.removeEventListener("cascade:offers-changed", again);
      window.removeEventListener("cascade:people-changed", again);
    },
  };
}

/**
 * ONE OFFER: what was sent, with the title editable, and two answers.
 *
 * THE CORRECTION GOES THROUGH `resolve()` AND NOTHING ELSE, which is his
 * answer 3 from session 159 and is stated in `offer.js`'s `readEdit`. So the
 * box here is a LINE, the same line screen 2 takes, not a set of date fields:
 * a date he types has to be read by the rules that read a date anybody types,
 * or this app would have two date readers that disagree on the first Friday at
 * the end of a month.
 *
 * WHAT WAS SENT IS SHOWN BESIDE WHAT HE CHANGED, never instead of it. The
 * sender is entitled to see both, and so is he.
 */
export function mountOffer(root, on) {
  let offer = on.offer();
  let line = "";
  let busy = false;

  function say(text) { on.say(text); }

  /**
   * HIS CORRECTION, READ BY THE ENGINE, ANCHORED ON THE SENDER'S CLOCK.
   *
   * `offer.created_at` and not the current time, which is the rule session 159
   * set: `friday` means the Friday after the task was SENT, because that is
   * the week the sender was talking about. One function, used by the preview
   * and by the accept, so the two cannot read the same line differently.
   */
  const edit = () => (line.trim()
    ? O.readEdit(line, offer, { config: on.config, now: offer.created_at })
    : null);

  async function answer(how, reason) {
    if (busy) return;
    busy = true;
    try {
      const out = how === "accept"
        ? await bridge.accept(offer, edit())
        : await bridge.decline(offer, reason);
      if (!out.ok) { say(out.why); return; }
      say(how === "accept" ? "Added to your list." : "Sent back, with your reason.");
      on.close();
    } finally {
      busy = false;
    }
  }

  function draw() {
    offer = on.offer();
    root.innerHTML = "";
    if (!offer) {
      root.appendChild(el("div", "d-empty", "That offer is no longer waiting."));
      return;
    }

    const head = el("div", "d-head");
    head.appendChild(el("div", "d-kind", `from ${on.labelFor(offer.from_email)}`));
    head.appendChild(button("x", "✕", () => on.close()));
    root.appendChild(head);

    const sent = O.asOffered(offer);
    root.appendChild(el("div", "d-title", sent.title || "(no title)"));
    root.appendChild(el("div", "d-said", `Sent ${when(offer.created_at)}`));

    const facts = el("div", "d-facts");
    for (const [field, label] of SHOWN) {
      if (field === "title") continue;
      const text = readable(field, sent[field]);
      if (!text) continue;
      const f = el("div", "d-fact");
      f.appendChild(el("span", "f-label", label));
      f.appendChild(el("span", "f-value", text));
      facts.appendChild(f);
    }
    root.appendChild(facts);

    // THE CORRECTION. One line, read by the engine, anchored on the SENDER's
    // clock so `friday` means the Friday after it was sent.
    root.appendChild(el("div", "label", "Change it before you take it"));
    const box = el("input", "offer-line");
    box.type = "text";
    box.placeholder = sent.raw_text || sent.title || "";
    box.setAttribute("aria-label", "Your version of this task");
    box.addEventListener("input", () => { line = box.value; preview(); });
    root.appendChild(box);
    const seen = el("div", "offer-preview");
    root.appendChild(seen);

    function preview() {
      seen.textContent = "";
      if (!line.trim()) return;
      const changes = O.changesIn({ ...offer, edited: edit() });
      if (!changes.length) { seen.textContent = "Nothing different yet."; return; }
      for (const c of changes) {
        const row = el("div", "offer-change");
        row.appendChild(el("span", "f-label", c.field));
        row.appendChild(el("span", "f-was", readable(c.field, c.from) || "(empty)"));
        row.appendChild(el("span", "f-now", readable(c.field, c.to) || "(empty)"));
        seen.appendChild(row);
      }
    }

    const acts = el("div", "offer-acts");
    acts.appendChild(button("act go", "Take it", () => { answer("accept"); }));
    acts.appendChild(button("act", "Send it back", async () => {
      const reason = await reasonSheet();
      if (reason === null) return;
      answer("decline", reason);
    }));
    // BLOCKING IS HERE AND NOT ONLY IN THE ACCOUNT SCREEN, because this is the
    // moment a person wants it: the unwanted task is on the screen in front of
    // them. It refuses THIS offer too, so one press ends the thing being
    // looked at as well as the next one.
    acts.appendChild(button("act danger", "Never from this address", async () => {
      const out = await people.blockEmail(offer.from_email);
      if (!out.ok) { say(out.why); return; }
      await bridge.applyBlocks();
      say(`${on.labelFor(offer.from_email)} can no longer send you tasks.`);
      on.close();
    }));
    root.appendChild(acts);
  }

  draw();
  const again = () => draw();
  window.addEventListener("cascade:offers-changed", again);
  return {
    draw,
    unmount() { window.removeEventListener("cascade:offers-changed", again); },
  };
}

/**
 * A DECLINE CARRIES A REASON, his answer 4 from session 159.
 *
 * Offered as four words and a box. The four cover what a decline nearly always
 * is, and the box is there because the fifth reason is the one worth reading.
 * Empty is allowed: forcing a sentence out of somebody who just wants to say
 * no produces `no` and teaches them the field is pointless.
 */
function reasonSheet() {
  const QUICK = ["Not mine to do", "No time this week", "Need more detail", "Wrong person"];
  return new Promise((settle) => {
    const veil = el("div", "veil");
    veil.dataset.dialog = "1";
    const box = el("div", "dialog");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.appendChild(el("div", "dialog-said", "Why are you sending it back?"));

    const text = el("input", "send-to");
    text.type = "text";
    text.maxLength = 140;
    text.placeholder = "optional";
    text.setAttribute("aria-label", "Your reason");

    const strip = el("div", "taps");
    for (const q of QUICK) strip.appendChild(button("chip", q, () => { text.value = q; }));
    box.append(strip, text);

    const acts = el("div", "dialog-acts");
    const close = (answer) => { veil.remove(); document.removeEventListener("keydown", onKey); settle(answer); };
    const onKey = (e) => { if (e.key === "Escape") close(null); };
    const cancel = button("act", "Cancel", () => close(null));
    cancel.dataset.cancel = "1";
    acts.append(cancel, button("act go", "Send back", () => close(text.value.trim())));
    box.appendChild(acts);
    veil.appendChild(box);
    veil.addEventListener("click", (e) => { if (e.target === veil) close(null); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(veil);
    text.focus();
  });
}

/**
 * WHAT HE HAS GIVEN AWAY, AND WHETHER IT IS DONE. His answer 1 from session
 * 159: he delegated it, he did not stop caring about it.
 *
 * HE CANNOT SEE THEIR TASK and does not need to. `done_at` on the offer is the
 * only channel there is, and it carries a date and a word. That is what this
 * list reads and the whole of what it can say.
 *
 * QUEUED ONES ARE NOT HERE. Nothing is given away until somebody has been
 * told, and `O.givenAway` is where that is decided.
 */
export function mountGiven(root, on) {
  async function draw() {
    const offers = await bridge.known();
    const owner = on.owner();
    const mine = O.givenAway(offers, owner);
    root.innerHTML = "";

    const head = el("div", "d-head");
    head.appendChild(el("div", "d-kind", "Given away"));
    head.appendChild(button("x", "✕", () => on.close()));
    root.appendChild(head);

    const sending = O.queued(offers);
    if (sending.length) {
      root.appendChild(el("div", "label", "Waiting for a signal"));
      for (const o of sending) {
        const r = el("div", "given-row given-queued");
        r.appendChild(el("div", "given-title", (o.payload?.title) || "(no title)"));
        r.appendChild(el("div", "given-who", `to ${on.labelFor(o.to_email)} — not sent yet`));
        r.appendChild(button("act", "Cancel", async () => {
          const out = await bridge.cancelSend(o);
          if (!out.ok) on.say(out.why);
          else { on.say("Called off. The task is still yours."); draw(); }
        }));
        root.appendChild(r);
      }
    }

    if (!mine.length) {
      root.appendChild(el("div", "d-empty",
        sending.length ? "Nothing has reached anybody yet."
          : "You have not given anybody a task yet."));
      return;
    }

    root.appendChild(el("div", "label", "Out with somebody"));
    for (const o of mine) {
      const r = el("div", "given-row");
      r.appendChild(el("div", "given-title", (o.payload?.title) || "(no title)"));
      // WHAT IT SAYS IS EXACTLY WHAT THE OFFER KNOWS, and no more. A row that
      // guessed at progress would be inventing the one thing he asked to be
      // told truthfully.
      const state = o.state === "accepted"
        ? (o.done_at
            ? `${on.labelFor(o.to_email)} finished it ${when(o.done_at)}`
            : `${on.labelFor(o.to_email)} has it`)
        : o.state === "declined"
          ? `${on.labelFor(o.to_email)} sent it back${o.decline_reason ? ` — ${o.decline_reason}` : ""}`
          : `waiting on ${on.labelFor(o.to_email)}`;
      r.appendChild(el("div", "given-who", state));
      const changed = O.changesIn(o);
      if (changed.length) {
        r.appendChild(el("div", "given-edit",
          `changed: ${changed.map((c) => c.field).join(", ")}`));
      }
      if (O.canWithdraw(o, owner)) {
        r.appendChild(button("act", "Withdraw", async () => {
          const out = await bridge.withdraw(o);
          if (!out.ok) on.say(out.why);
          else { on.say("Taken back. It is yours again."); draw(); }
        }));
      }
      root.appendChild(r);
    }
  }

  draw();
  const again = () => { draw().catch(() => {}); };
  window.addEventListener("cascade:offers-changed", again);
  return {
    draw,
    unmount() { window.removeEventListener("cascade:offers-changed", again); },
  };
}
