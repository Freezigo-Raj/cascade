// Cascade Part A — the gate.
//
// One screen with four states, because they are the same two fields in
// different arrangements and four screens would be four places to change a
// label. `Sign in`, `Sign up`, `Forgot`, and `New password`.
//
// The state is not a guess. Arriving on a reset link puts the screen in
// `New password` before anything is drawn, because a person who clicked
// "forgot my password" and lands on a sign-in form has been asked the one
// question they already said they cannot answer.
//
// What the screen says after a press is the whole of its job. Every call in
// `auth.js` returns `{ ok, error }` and every one of them ends here as a line
// of text under the button. Nothing spins silently.

// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { account, recoveryInUrl, linkError } = await import(`./auth.js${v}`);

const STATES = {
  signin:   { title: "Sign in",      action: "Sign in",       fields: ["email", "password"] },
  signup:   { title: "New account",  action: "Create",        fields: ["email", "password"] },
  forgot:   { title: "Reset",        action: "Send the link", fields: ["email"] },
  password: { title: "New password", action: "Save",          fields: ["password"] },
};

const CSS = `
#gate { max-width: 340px; margin: 60px auto; font: 14px ui-monospace, Menlo, Consolas, monospace; }
#gate h1 { font-size: 15px; font-weight: 600; margin: 0 0 18px; }
#gate input { font: inherit; width: 100%; box-sizing: border-box; padding: 7px 8px;
              border: 1px solid #bbb; margin-bottom: 8px; }
#gate button.go { font: inherit; width: 100%; padding: 8px; border: 1px solid #333;
                  background: #333; color: #fff; cursor: pointer; }
#gate button.go[disabled] { opacity: .5; cursor: default; }
#gate .alt { margin-top: 14px; font-size: 12px; }
#gate .alt button { font: inherit; background: none; border: 0; padding: 0; color: #333;
                    text-decoration: underline; cursor: pointer; }
#gate .alt span { color: #999; }
#gate .say { margin-top: 12px; font-size: 12px; min-height: 16px; white-space: pre-wrap; }
#gate .say.bad { color: #c02626; }
`;

/**
 * Draws into `el` and calls `onIn()` once there is a session. Returns nothing:
 * the screen removes itself, and the caller carries on where it left off.
 */
export function mountGate(el, onIn) {
  if (!document.getElementById("gate-css")) {
    const s = document.createElement("style");
    s.id = "gate-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Taken at boot. Supabase clears the fragment once it has read it, so asking
  // the URL later gives the wrong answer.
  const arrivedOnReset = recoveryInUrl();
  const arrivedBroken = linkError();

  let state = arrivedOnReset ? "password" : "signin";
  let busy = false;
  let say = arrivedBroken ? { text: arrivedBroken, bad: true } : { text: "", bad: false };
  let email = "";

  // A PKCE reset link announces itself through the auth listener rather than
  // through the fragment, and it can arrive a moment after the first draw.
  const stop = account.onChange((_user, event) => {
    if (event === "PASSWORD_RECOVERY") {
      state = "password";
      say = { text: "", bad: false };
      draw();
    }
  });

  function tell(text, bad = false) {
    say = { text, bad };
    draw();
  }

  function go(next) {
    state = next;
    say = { text: "", bad: false };
    draw();
  }

  async function submit() {
    if (busy) return;
    const e = el.querySelector("#gate-email")?.value ?? email;
    const p = el.querySelector("#gate-password")?.value ?? "";
    email = e;

    if (STATES[state].fields.includes("email") && !e.includes("@")) return tell("That is not an email address.", true);
    if (STATES[state].fields.includes("password") && p.length < 6) return tell("Six characters or more.", true);

    busy = true;
    draw();
    try {
      if (state === "signin") {
        const r = await account.signIn(e, p);
        if (!r.ok) return tell(r.error, true);
        return done();
      }
      if (state === "signup") {
        const r = await account.signUp(e, p);
        if (!r.ok) return tell(r.error, true);
        // Confirmation is on, so there is no session yet and saying "welcome"
        // would be a lie about where the account is.
        if (r.needsConfirmation) return tell(`Sent to ${e}.\nClick the link to finish, then sign in.`);
        return done();
      }
      if (state === "forgot") {
        const r = await account.requestReset(e);
        if (!r.ok) return tell(r.error, true);
        // The same words whether or not the address has an account, so the
        // form is not a way of asking who has one.
        return tell(`If ${e} has an account, a link is on its way.`);
      }
      if (state === "password") {
        const r = await account.setPassword(p);
        if (!r.ok) return tell(r.error, true);
        // The link's session is the one now signed in, so this goes straight
        // through rather than asking for the password just set.
        return done();
      }
    } catch (err) {
      tell(String(err?.message ?? err), true);
    } finally {
      busy = false;
      if (el.isConnected) draw();
    }
  }

  function done() {
    stop();
    // The fragment still names a recovery on some flows; leaving it there means
    // the next refresh reopens the reset screen for a password already changed.
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    el.remove();
    onIn();
  }

  function draw() {
    if (!el.isConnected) return;
    const s = STATES[state];
    el.innerHTML = "";

    const h = document.createElement("h1");
    h.textContent = s.title;
    el.appendChild(h);

    if (s.fields.includes("email")) {
      const i = document.createElement("input");
      i.id = "gate-email";
      i.type = "email";
      i.placeholder = "email";
      i.autocomplete = "username";
      i.value = email;
      el.appendChild(i);
    }
    if (s.fields.includes("password")) {
      const i = document.createElement("input");
      i.id = "gate-password";
      i.type = "password";
      i.placeholder = state === "password" ? "new password" : "password";
      i.autocomplete = state === "signin" ? "current-password" : "new-password";
      el.appendChild(i);
    }

    const b = document.createElement("button");
    b.className = "go";
    b.textContent = busy ? "…" : s.action;
    b.disabled = busy;
    b.addEventListener("click", submit);
    el.appendChild(b);

    const alt = document.createElement("div");
    alt.className = "alt";
    const link = (text, to) => {
      const x = document.createElement("button");
      x.textContent = text;
      x.addEventListener("click", () => go(to));
      return x;
    };
    const gap = () => {
      const g = document.createElement("span");
      g.textContent = "  ·  ";
      return g;
    };
    if (state === "signin") {
      alt.append(link("New account", "signup"), gap(), link("Forgot password", "forgot"));
    } else {
      alt.append(link("Back to sign in", "signin"));
      if (state === "signup") {
        alt.append(gap());
        const r = document.createElement("button");
        r.textContent = "Resend the link";
        r.addEventListener("click", async () => {
          const e = el.querySelector("#gate-email")?.value ?? email;
          const out = await account.resendConfirmation(e);
          tell(out.ok ? `Sent again to ${e}.` : out.error, !out.ok);
        });
        alt.append(r);
      }
    }
    el.appendChild(alt);

    const line = document.createElement("div");
    line.className = "say" + (say.bad ? " bad" : "");
    line.textContent = say.text;
    el.appendChild(line);

    // Return submits, because a form with two fields and one button should not
    // need the mouse.
    el.querySelectorAll("input").forEach((i) =>
      i.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submit(); }));

    (el.querySelector("#gate-email:not([value])") ?? el.querySelector("input"))?.focus();
  }

  draw();
}
