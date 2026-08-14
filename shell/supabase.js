// Cascade Part A — one client, made once.
//
// Two modules need Supabase: the store and the account. Two clients would mean
// two copies of the session, and the second one finds out about a sign-out when
// something fails rather than when it happens. So the client is made here, once,
// and both import it.
//
// `persistSession` is what makes a refresh keep you signed in, and
// `autoRefreshToken` is what stops an access token expiring under a tab left
// open overnight. Both are on by default in supabase-js; they are written out
// because this app is a tab left open overnight.

import { createClient } from "@supabase/supabase-js";
// The query `app.js` and `boot.js` append is carried on to whatever this file
// imports. Without it the browser resolves `./x.js` to the address it already
// has cached and serves yesterday's copy from a page that is otherwise fresh,
// which reads as a fix that did not work rather than as a file that was never
// fetched. `index.html` says the same thing about `boot.js`.
const v = new URL(import.meta.url).search;
const { SUPABASE_URL, SUPABASE_ANON_KEY, configured } = await import(`./env.js${v}`);

let made = null;

/**
 * The client, or null when `env.js` is empty. Null is the signal the rest of
 * the shell reads to stay local, so nothing has to ask twice whether Supabase
 * is set up.
 */
export function client() {
  if (!configured()) return null;
  if (!made) {
    made = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The reset and confirmation links come back with their session in the
        // URL fragment. Reading it here is what turns the click into a session.
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return made;
}
