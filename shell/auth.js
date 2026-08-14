// Cascade Part A — the account.
//
// Everything about who is signed in lives here, so the rest of the shell asks
// one module and never talks to `db.auth` itself. Six calls and one listener.
//
// **Email and password, not a magic link.** A magic link makes every sign-in
// wait on an email arriving, and the whole of D-1 is that typing the thought is
// the work. A password is instant on the tenth device as on the first.
//
// **Confirmation is on.** An address typed wrong at sign-up is an account that
// can never be recovered, because the only way back in is a mail to that same
// address. Confirming first turns that from a locked account into a sign-up
// that did not finish.
//
// **A reset is two halves and they happen days apart.** `requestReset` sends
// the link. The click comes back to this page carrying a recovery session, and
// `setPassword` spends it. `recovering()` is how the screen knows which half it
// is in, because the two look identical apart from the URL.
//
// Errors come back as a string a person can read, never as a thrown object.
// Every one of these calls is something a person pressed a button to do, and a
// screen that says nothing after a press is worse than one that says the wrong
// thing.

// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { client } = await import(`./supabase.js${v}`);
const { RESET_REDIRECT } = await import(`./env.js${v}`);

/** Supabase's own wording, replaced where it names its internals. */
function readable(error) {
  if (!error) return null;
  const m = String(error.message || error);
  if (/Invalid login credentials/i.test(m)) return "That email and password do not match an account.";
  if (/Email not confirmed/i.test(m)) return "Check your email and confirm the address first.";
  if (/User already registered/i.test(m)) return "That email already has an account. Sign in instead.";
  if (/Password should be at least/i.test(m)) return "The password is too short. Six characters or more.";
  if (/rate limit|too many/i.test(m)) return "Too many tries. Wait a minute and go again.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "No connection to the server.";
  return m;
}

/** One shape for every call: `{ ok, error }`, and `user` where there is one. */
const ok = (extra = {}) => ({ ok: true, error: null, ...extra });
const no = (error) => ({ ok: false, error: readable(error) });

export const account = {
  /** True when `env.js` is filled in. False means the shell runs local. */
  available: () => Boolean(client()),

  /** The signed-in user, or null. Null is an answer, not a failure. */
  async current() {
    const db = client();
    if (!db) return null;
    const { data } = await db.auth.getUser();
    return data?.user ?? null;
  },

  async session() {
    const db = client();
    if (!db) return null;
    const { data } = await db.auth.getSession();
    return data?.session ?? null;
  },

  /**
   * A new account. Supabase sends the confirmation mail; the user is not signed
   * in until the link is clicked, so the screen says so rather than waiting for
   * a session that is not coming.
   */
  async signUp(email, password) {
    const db = client();
    const { data, error } = await db.auth.signUp({
      email: String(email || "").trim(),
      password,
      options: { emailRedirectTo: RESET_REDIRECT },
    });
    if (error) return no(error);
    return ok({ user: data.user, needsConfirmation: !data.session });
  },

  async signIn(email, password) {
    const db = client();
    const { data, error } = await db.auth.signInWithPassword({
      email: String(email || "").trim(),
      password,
    });
    if (error) return no(error);
    return ok({ user: data.user });
  },

  /**
   * Half one of a reset. This always reports success, whatever the mail server
   * did with it, because an error that distinguishes a known address from an
   * unknown one turns the form into a way of asking whether someone has an
   * account here.
   */
  async requestReset(email) {
    const db = client();
    const { error } = await db.auth.resetPasswordForEmail(String(email || "").trim(), {
      redirectTo: RESET_REDIRECT,
    });
    if (error && /rate limit|too many/i.test(String(error.message))) return no(error);
    return ok();
  },

  /**
   * Half two, and the same call is how a signed-in person changes a password
   * they still know. The recovery session is spent by using it, so a link works
   * once.
   */
  async setPassword(password) {
    const db = client();
    const { error } = await db.auth.updateUser({ password });
    if (error) return no(error);
    return ok();
  },

  /** For an address that never received the first one. */
  async resendConfirmation(email) {
    const db = client();
    const { error } = await db.auth.resend({
      type: "signup",
      email: String(email || "").trim(),
      options: { emailRedirectTo: RESET_REDIRECT },
    });
    if (error) return no(error);
    return ok();
  },

  async signOut() {
    const db = client();
    if (!db) return ok();
    const { error } = await db.auth.signOut();
    return error ? no(error) : ok();
  },

  /**
   * `fn(user)` on every change, including the one that happens when a recovery
   * link is read out of the URL a moment after boot. Returns the unsubscribe.
   */
  onChange(fn) {
    const db = client();
    if (!db) return () => {};
    const { data } = db.auth.onAuthStateChange((event, session) => fn(session?.user ?? null, event));
    return () => data?.subscription?.unsubscribe();
  },
};

/**
 * True when this page load is a click on a reset link. Supabase strips the
 * fragment once it has read it, so the flag is taken at boot and kept: reading
 * the URL later gives the wrong answer.
 *
 * Two link shapes are checked because the two flows differ. The implicit flow
 * puts `type=recovery` in the fragment; PKCE puts a `code` in the query and
 * announces itself through `onChange` with a `PASSWORD_RECOVERY` event instead.
 */
export function recoveryInUrl() {
  const frag = new URLSearchParams(location.hash.replace(/^#/, ""));
  return frag.get("type") === "recovery";
}

/** The error a link carries when it has already been used or has expired. */
export function linkError() {
  const frag = new URLSearchParams(location.hash.replace(/^#/, ""));
  const d = frag.get("error_description");
  if (!d) return null;
  return /expired|invalid/i.test(d) ? "That link has expired or has already been used." : d;
}
