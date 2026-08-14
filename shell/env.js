// Cascade Part A — the Supabase project's own numbers.
//
// The one file in `shell/` that is different on every machine, so it is the one
// file with nothing in it but values. Fill the two strings and the shell signs
// in; leave them and the shell runs against localStorage exactly as before.
//
// The anon key is public by design. It is not a secret and it grants nothing on
// its own: every table has row-level security on and every policy compares
// `auth.uid()` to `owner`. The key gets you as far as the sign-in screen.

export const SUPABASE_URL = "https://dxqqioniqzxaikznqgyt.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_a4P3WO0gY98YNUyAXa9DvA_fKOoKJBb";

/**
 * Where the password-reset link comes back to. It must also be listed in the
 * Supabase dashboard under Authentication → URL Configuration → Redirect URLs,
 * or the link lands on the site and arrives with no session attached.
 */
export const RESET_REDIRECT = `${location.origin}${location.pathname}`;

/** True when both values are filled in. False is a real answer: run local. */
export const configured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
