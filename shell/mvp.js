// Cascade Part A — the app screen, booted.
//
// The same three ways in as `boot.js`: no project runs local, a reset link opens
// the gate whatever the session says, and otherwise a session runs the app. What
// differs is what gets mounted afterwards, which is screen 1 rather than the
// Stage 3 harness.

const v = new URL(import.meta.url).search;
const { configured } = await import(`./env.js${v}`);
const { account, recoveryInUrl } = await import(`./auth.js${v}`);
const { mountGate } = await import(`./gate.js${v}`);

const screen = document.getElementById("screen");
const gateEl = document.getElementById("gate");

let started = false;

// Two screens and one place that decides which is mounted. Neither screen
// imports the other: the list is handed a way of opening the edit screen and
// the edit screen a way back, so a third screen later is a third case here
// rather than an edit to both.
async function showList() {
  const { mountList } = await import(`./mvp.list.js${v}`);
  screen.innerHTML = "";
  screen.dataset.screen = "list";
  mountList(screen, { openEdit: showEdit, openAccount: showAccount });
}

async function showEdit(taskId) {
  const { mountEdit } = await import(`./mvp.edit.js${v}`);
  screen.innerHTML = "";
  screen.dataset.screen = "edit";
  mountEdit(screen, { taskId, onBack: () => showList() });
}

// The third case, and the reason this file was written with a third case in
// mind: sign-out had no control anywhere in the app until now.
async function showAccount() {
  const { mountAccount } = await import(`./mvp.account.js${v}`);
  screen.innerHTML = "";
  screen.dataset.screen = "account";
  mountAccount(screen, { onBack: () => showList(), onSignedOut: () => { started = false; gate(); } });
}

async function start() {
  if (started) return;
  started = true;
  gateEl.style.display = "none";
  screen.style.display = "";
  await showList();
}

function gate() {
  screen.style.display = "none";
  gateEl.style.display = "";
  mountGate(gateEl, start);
}

if (!configured()) await start();
else if (recoveryInUrl()) gate();
else if (await account.session()) await start();
else gate();
