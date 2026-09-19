# Cascade Part A — accounts and sync, decided

Everything on this page is settled. Nothing here is a suggestion.
Positions, sizes, colours and spacing are not decided here.

**The account is the sync.** No pairing, no device list, no share code. Signing in on a second device is the whole of it.

---


## Offline, and why it used to be broken

**Being signed in is LOCAL knowledge. The network is for syncing, never for remembering who you are** (session 141, his report: "alarms do not ring when the mobile is not connected to the internet").

A Supabase access token lasts an hour. `getSession()` on an expired one tries to REFRESH it, which is a network call, and offline it retries with a backoff and takes **twenty-six seconds** to answer `null`. Measured, not guessed. Three places on the boot path waited on that, one behind another:

| Where | What it awaited | What it was for |
|---|---|---|
| foot of `mvp.js` | `account.session()` | deciding whether to show the list or the sign-in page |
| `store.select.js` at module load | `account.session()`, then `sync.start()` → `owner()` → `getUser()` | choosing the store, and the first pull |
| `start()` | `account.current()` → `getUser()` | one email address on the account screen |

So an offline launch showed a blank screen for half a minute and then the **sign-in page**. `start()` never ran, and `initAlarms()` is the last thing in it, so **nothing armed a single alarm**.

**The Android half was never at fault.** `BootReceiver` re-arms every stored alarm after a reboot with no network at all. It was never being told what to arm.

What it does now:

- `account.sessionSoon()` waits two seconds for the server and otherwise trusts what this app wrote down last time. It skips the wait entirely when `navigator.onLine` is already false, and asks once per load rather than once per caller.
- `cascade:signed-in` is this app's own flag, in its own namespace, written whenever Supabase answers and cleared on sign-out. For an install that has never seen it, `wasSignedIn()` scans the KEY NAMES in storage once for a persisted Supabase token and backfills. Names only, never contents.
- The fallback returns a MARKER, not a session. It carries no token, so everything that talks to Supabase still refuses until a real session arrives, which it does silently the moment there is signal.
- `sync.start()` is no longer awaited. It bought nothing — `all()` reads the cache and never the network, which is the whole design — and it cost the entire app waiting on `getUser()`, on a module every screen imports.
- The email comes from `account.knownEmail()`, held in memory from whenever the session was last read. An address printed on one screen is not worth a millisecond of the list not being there.
- The sync pill starts from `navigator.onLine` instead of `true`, and an `offline` event sets it. It is the one line in this app that reports the store's own state, and it was reporting a guess.

Measured, offline, expired token: **blank for 26s then the sign-in page → the task list in 2.7s, with the alarm armed.**

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
