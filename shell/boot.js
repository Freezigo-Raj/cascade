// Cascade Part A — boot.
//
// `index.html` loads this rather than `app.js`, and it decides which of the two
// things happens first: the gate, or the app. Everything below it is unchanged.
//
// Three ways in, and the order matters.
//
// 1. No project in `env.js` — run local, as every session before this one did.
//    A missing project is a shell running on localStorage, not an error.
// 2. A reset link in the URL — the gate, whatever the session says. A person
//    who clicked "forgot my password" gets the password screen even if the tab
//    still holds a valid session from last week.
// 3. Otherwise — a session runs the app, no session draws the gate.
//
// `app.js` is imported only once one of those has settled, because the store it
// picks depends on there being an account, and picking twice would mean two
// caches disagreeing about the same tasks.

const v = new URL(import.meta.url).search;
const { configured } = await import(`./env.js${v}`);
const { account, recoveryInUrl } = await import(`./auth.js${v}`);
const { mountGate } = await import(`./gate.js${v}`);

const app = document.getElementById("app");
const gateEl = document.getElementById("gate");
const bar = document.getElementById("accountbar");

function show() {
  app.style.display = "";
  gateEl.style.display = "none";
}
function hide() {
  app.style.display = "none";
  gateEl.style.display = "";
}

let started = false;

/** Once. A second import would build a second store over the same cache. */
async function startApp(user) {
  if (started) return;
  started = true;
  show();
  if (bar && user) {
    bar.textContent = user.email + "  ";
    const out = document.createElement("button");
    out.textContent = "Sign out";
    out.addEventListener("click", async () => {
      // The cache holds one account's tasks and the next person to sign in on
      // this machine is not necessarily the same person.
      const { sync } = await import(`./store.select.js${v}`);
      if (sync) await sync.forget();
      await account.signOut();
      location.reload();
    });
    bar.appendChild(out);
  }
  await import(`./app.js${v}`);
}

if (!configured()) {
  await startApp(null);
} else if (recoveryInUrl()) {
  hide();
  mountGate(gateEl, () => account.current().then(startApp));
} else {
  const session = await account.session();
  if (session) {
    await startApp(session.user);
  } else {
    hide();
    mountGate(gateEl, () => account.current().then(startApp));
  }
}
