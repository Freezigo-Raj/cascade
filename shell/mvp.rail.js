// Cascade Part A — the left rail, from the R2 web design.
//
// A nav with counts. Every item is one of three kinds and the kind is visible:
//
//   LIVE      it works, and its count is real
//   WIP       drawn, dimmed, and it says on press what is missing and which Part
//             owns it. Kept rather than deleted, because a nav that grows later
//             moves everything a person has learned the position of
//   QUIET     deliberately absent, not unbuilt. The design shows a day's load and
//             a per-task duration; both are collected and never shown, which is a
//             rule from session 89 rather than a gap
//
// The counts come from the same `listOnly()` pass the list uses, so the number
// beside `Today` and the rows under it cannot disagree.

const v = new URL(import.meta.url).search;
const { partAConfig } = await import(`./config.js${v}`);
const { listOnly } = await import(`./resolve.js${v}`);
const { nowLocal } = await import(`./mvp.clock.js${v}`);
const { el, button } = await import(`./mvp.paint.js${v}`);

/** Drawn, dimmed, and honest about it. One sentence each, one owner each. */
const WIP = {
  Week: "A week grid is in the design and not built. Part C.",
  "Day plan": "An hour-by-hour plan is in the design and not built. Part C.",
  Workflow: "One task activating the next. Decided in full and no column exists yet. Part C.",
  Activity: "A history of what happened. Nothing records it yet. Part B.",
  Projects: "Projects are decided and no column is written yet. Part C.",
};

/**
 * @param {HTMLElement} root
 * @param {object} on  { tab, slot, tasks, go(tab, slot), openAccount, say, email }
 */
export function mountRail(root, on) {
  let all = [];

  function group(label, items) {
    const wrap = el("div", "rail-group");
    wrap.appendChild(el("div", "rail-label", label));
    for (const item of items) wrap.appendChild(item);
    return wrap;
  }

  /** A live nav row: a name, a count, and a pressed state. */
  function live(name, count, pressed, go) {
    const b = el("button", "rail-item" + (pressed ? " on" : ""));
    b.type = "button";
    b.appendChild(el("span", "rail-name", name));
    b.appendChild(el("span", "rail-count", String(count)));
    b.addEventListener("click", go);
    return b;
  }

  /** A WIP nav row. Same shape, so the nav does not move when it becomes live. */
  function wip(name) {
    const b = el("button", "rail-item later");
    b.type = "button";
    b.appendChild(el("span", "rail-name", name));
    b.appendChild(el("span", "rail-count wip-tag", "WIP"));
    b.title = WIP[name] ?? "Not built yet.";
    b.addEventListener("click", () => on.say(WIP[name] ?? "Not built yet."));
    return b;
  }

  function draw() {
    root.innerHTML = "";
    const lists = listOnly(all, partAConfig, nowLocal());
    const inBand = (band) => lists.cards.filter((c) => c.card_band === band).length;

    const brand = el("div", "brand");
    brand.appendChild(el("span", "brand-mark", "C"));
    brand.appendChild(el("span", "brand-name", "Cascade"));
    root.appendChild(brand);

    const capture = el("button", "capture-btn", "+  Capture");
    capture.type = "button";
    capture.addEventListener("click", () => on.capture());
    root.appendChild(capture);

    root.appendChild(group("Tasks", [
      live("Today", inBand("Today"), on.tab() === "Tasks" && on.slot() === "Today", () => on.go("Tasks", "Today")),
      live("Tomorrow", inBand("Tomorrow"), on.tab() === "Tasks" && on.slot() === "Tomorrow", () => on.go("Tasks", "Tomorrow")),
      live("Upcoming", inBand("Upcoming"), on.tab() === "Tasks" && on.slot() === "Upcoming", () => on.go("Tasks", "Upcoming")),
    ]));

    root.appendChild(group("Time", [wip("Week"), wip("Day plan")]));

    root.appendChild(group("Shape", [
      wip("Workflow"),
      wip("Activity"),
      live("Ideas", lists.ideas.length, on.tab() === "Ideas", () => on.go("Ideas", null)),
      live("Done", lists.done.length, on.tab() === "Done", () => on.go("Done", null)),
    ]));

    root.appendChild(group("Projects", [wip("Projects")]));

    // The account, at the foot, where the design puts it. This one is live.
    const foot = el("button", "rail-foot");
    foot.type = "button";
    foot.appendChild(el("span", "avatar small", "\u2022\u2022"));
    const who = el("div", "rail-who");
    who.appendChild(el("div", "rail-who-name", "Account"));
    who.appendChild(el("div", "rail-who-mail", on.email() || "on this device"));
    foot.appendChild(who);
    foot.addEventListener("click", () => on.openAccount());
    root.appendChild(foot);
  }

  return {
    /** The list hands its tasks over rather than the rail reading the store twice. */
    setTasks(tasks) { all = tasks; draw(); },
    draw,
    unmount() {},
  };
}
