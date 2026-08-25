# Cascade Part A — accounts and sync, decided

Everything on this page is settled. Nothing here is a suggestion.
Positions, sizes, colours and spacing are not decided here.

**The account is the sync.** No pairing, no device list, no share code. Signing in on a second device is the whole of it.

---

## The gate

One screen, four states, two fields. Reached before the app, never beside it.

| State | Fields | Button | Where it goes |
|---|---|---|---|
| Sign in | email, password | `Sign in` | the app |
| New account | email, password | `Create` | a line saying to check the email |
| Reset | email | `Send the link` | a line saying a link is on its way |
| New password | password | `Save` | the app |

`Sign in` carries `New account` and `Forgot password`. The other three carry `Back to sign in`. `New account` also carries `Resend the link`.

**Email and password, not a magic link.** A magic link makes every sign-in wait on an email arriving. A password is instant on the tenth device as on the first.

**Confirmation is on.** An address typed wrong at sign-up is an account that can never be recovered, because the only way back in is a mail to that same address.

**The reset says the same words for every address.** `If <email> has an account, a link is on its way.` A message that distinguishes a known address from an unknown one turns the form into a way of asking who has an account here.

**A reset link opens the password screen, whatever the session says.** The URL is read at boot, before anything is drawn. A person who clicked "forgot my password" and lands on a sign-in form has been asked the one question they already said they cannot answer.

**Saving a new password signs you in.** The link's own session is the one spent doing it, so asking for the password just set would be asking twice.

**Every press says something.** Six characters or more, that is not an email address, that email and password do not match an account, check your email and confirm the address first, that link has expired or has already been used. Nothing spins silently.

**With no project configured the gate never draws.** The shell runs on localStorage exactly as it did before. That is a mode, not an error.

---

## What syncs

| Thing | Syncs | Why |
|---|---|---|
| Tasks | yes | the point |
| Settings | yes | `capacity_min_per_day`, `duplicate.threshold`, one row per account |
| Config | once per version | the `config_version` stamp has to point at something |
| ~~Undo~~ | — | removed from the app in session 132 and from the contract in 137. `cascade_undo` is left standing, unwritten |

**Undo was local, and then it was gone.** The reasoning that kept it off the wire is what eventually removed it: one entry restoring a whole record with a fresh `updated_at` is the wrong shape for a store that merges newest-wins, and a restored older stamp is silently refused by the trigger. The bin cancels, `Revive` brings a task back, and `Delete for good` is the one press that cannot be taken back.

---

## How it syncs

**Local first, always.** The list reads the cache and never waits on a network. A write lands locally before it is sent, so a lost connection changes nothing about what typing feels like. What a connection changes is when the other device finds out.

**The outbox holds actions.** A write that cannot be sent is queued in its own namespace and drained in order on reconnect. Nothing about syncing reached the `Task`: a record written from this device is byte-identical to one written from any other.

**Newest wins, and Postgres decides.** A trigger drops an update whose `updated_at` is older than the row's, so a queue drained an hour late cannot overwrite the edit made since. The rule is in the database rather than in a query, because a client is one bug away from forgetting the comparison.

**Absence is the tombstone.** A pull fetches every row and deletes anything the cache holds that the server does not, minus what is still queued here. There is no fourth table.

**Live, and never only live.** Realtime is the fast path. Reconnect, the tab being looked at again, and one minute each pull as well, because a dropped socket is silent.

**Signing out empties the cache.** One account's tasks are on this machine and the next person to sign in on it is not necessarily the same person.

**The store line says where, not just how many.** `12 stored · synced` · `12 stored · 3 waiting to send` · `12 stored · offline`.

---

## The files

| File | Holds |
|---|---|
| `shell/env.js` | the project URL, the anon key, the reset redirect |
| `shell/supabase.js` | one client, made once, shared by the store and the account |
| `shell/auth.js` | sign up, sign in, reset, set password, resend, sign out, on change |
| `shell/gate.js` | the four states above |
| `shell/boot.js` | gate or app, decided before either draws |
| `shell/store.sync.js` | cache, outbox, pull, realtime |
| `shell/store.select.js` | which of the three stores the app gets |

The app changed by three lines: the import, the store line, and a listener for a task arriving from elsewhere. (That app was `app.js`, the Stage 3 harness, deleted in session 137; `mvp.js` inherited the same three lines.)

---

## Setting up a project

1. New Supabase project. Run `schema.sql` in the SQL editor, whole file.
2. Authentication → Providers → Email: on, with **Confirm email** on.
3. Authentication → URL Configuration: **Site URL** and **Redirect URLs** both hold the address the shell is served from. A link that comes back to an address not on that list arrives with no session.
4. Paste the project URL and the anon key into `shell/env.js`.

The anon key is public by design. Every table has row-level security on and every policy compares `auth.uid()` to `owner`; the key gets you as far as the sign-in screen.

---

## Not in this

Social sign-in. Two-factor. Sharing a task with anyone. A device list. Changing an email address. Deleting an account. Anything that fires a notification, which is Part B.
