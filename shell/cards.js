// Cascade Part A — the Default list's cards.
//
// Until this file existed, `resolve()` returned four cards written into the
// code by hand: the same four for every line typed, copied out of the example
// so the shell had something to draw. Nothing in the answer key names `cards`,
// `rank_key`, `decided_by`, `group_header` or `result_row`, so no gate ever
// asked whether they were real.
//
// The cards are built from `existing_tasks` and not from the line being typed.
// A line becomes a card when it is added, which is what the example draws: the
// list is unchanged while he types and holds the new task a second later.

/**
 * Three tiers, and a tier is reached only when the one above it ties.
 *
 * Tier 1 is absolute: no score beats a pin or a hard deadline, under this mode
 * or any later one. Tier 2 is the mode, `lexicographic` today, which means the
 * factors run in order and the first that separates two tasks decides. Tier 3
 * is the nine factors.
 *
 * Every ordering the comparison needs is read out of config. The direction
 * table lived in the example and nowhere a program could reach, which is what
 * kept this a description for eighty sessions.
 */
function termsFor(task, config) {
  const rank = (list, value) => {
    const i = list.indexOf(value);
    // A value the list does not hold sorts last rather than first. Unknown is
    // not urgent, and -1 would have made it the most urgent thing on the list.
    return i === -1 ? list.length : i;
  };
  const band = (t) => rank(config.deadline_bands, t.deadline_band ?? "none");
  return {
    // Tier 1. True before false, so the boolean is negated into a sort key.
    pinned: task.pinned ? 0 : 1,
    is_hard: task.date_firmness === "hard" ? 0 : 1,
    // Third override. An alarm that rang its whole chain out and was never
    // answered means the one mechanism built to interrupt a person has already
    // failed on this task. It sits below `is_hard` so a soft task cannot jump a
    // hard one on the strength of a missed alarm.
    alarm_unanswered: task.alarm_unanswered_at ? 0 : 1,
    // Tier 3, in the order config states.
    deadline_band: band(task),
    significance: -(task.significance ?? 0),
    date_firmness: rank(config.firmness_order, task.date_firmness),
    date_precision: rank(config.precision_order, task.date_precision),
    commitment_type: rank(config.type_order, task.commitment_type),
    est_duration_min: task.est_duration_min ?? 0,
    // `workflow_position` is zero for every task Part A produces, and is here
    // so the comparison is the nine the contract names rather than the eight
    // that happen to move, and so Part C fills a slot rather than adds one.
    workflow_position: task.workflow_position ?? 0,
    // `reminder_fatigue` moves now: an unanswered alarm increments it. It is a
    // weak signal here on purpose, because tier 1 has already lifted the task
    // whose marker is still live; this factor is what is left of the history
    // once that marker is cleared.
    reminder_fatigue: -(task.reminder_fatigue ?? 0),
    // Last touch, not creation, and descending: editing a task means you are
    // thinking about it. Compared as an instant so two offsets order correctly.
    updated_at: -Date.parse(task.updated_at ?? task.created_at ?? 0),
  };
}

/**
 * `deadline_band` is a working value rather than a stored field, so a task read
 * back out of the store does not carry one. It is recomputed here from
 * `due_at`, which is stored, so the order does not silently degrade to "none
 * for everything" the first time the page is refreshed.
 */
export function rankKeyFor(task, config, bandOf) {
  const t = termsFor({ ...task, deadline_band: bandOf(task) }, config);
  const order = [...config.ranking.overrides, ...config.ranking.factors];
  return order.map((name) => [name, t[name]]);
}

/** The first term that separates two tasks: the sort, and the sentence. */
function firstDifference(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i][1] !== b[i][1]) return { name: a[i][0], sign: a[i][1] < b[i][1] ? -1 : 1 };
  }
  return { name: "", sign: 0 };
}

/**
 * The Ideas list: open, dateless, sorted by duration with the shortest first.
 * A dateless task used to be created and then made invisible, because the
 * screen drew Default and nothing else. Ten of the twelve real-backlog lines in
 * the answer key carry no date.
 *
 * It is sorted rather than ranked. Every ranking factor above `est_duration_min`
 * reads a date, so on this list the first six would tie on every row and the
 * order would come out of the tie-break. Duration is the only term that says
 * anything here, which is why the header offers it as a choice.
 */
export function readIdeas(existing) {
  if (!Array.isArray(existing)) return [];
  return existing
    .filter((t) => t && t.task_state === "ready" && !t.archived)
    .filter((t) => !t.due_at && !t.earliest_start)
    .filter((t) => typeof t.title === "string" && t.title !== "" && "est_duration_min" in t)
    .sort((a, b) => a.est_duration_min - b.est_duration_min ||
                    String(a.created_at).localeCompare(String(b.created_at)))
    // Still sorted by duration, and nothing on the row shows it: a list ordered
    // by a number the reader cannot see. Kept at his call, recorded in spec.md.
    .map((t) => ({ card_id: t.id, card_title: t.title, card_reason: "", card_reason_short: "", card_band: "Ideas" }));
}

/**
 * A task is on the Default list when it carries a resolved date and is still
 * open. Done, cancelled and archived tasks leave the list entirely: `DONE` is a
 * group in the search results and the main list has no section for it.
 */
function onDefaultList(t) {
  if (!t || typeof t !== "object") return false;
  // `ready` is the open state. The set is `ready` `done` `cancelled`, from the
  // contract; "open" is not a member and reading it as one hid every card.
  if (t.task_state && t.task_state !== "ready") return false;
  if (t.archived) return false;
  return Boolean(t.due_at || t.earliest_start);
}

/**
 * A row carries how far off it is, so the screen can put it under Today,
 * Tomorrow or Upcoming without asking the engine which tab it is drawing.
 * Overdue sits in Today: a task three days late is a thing to deal with now,
 * and a fourth place for it means the tab opened first is not the real day.
 */
function tabOf(band) {
  if (band === "overdue" || band === "today") return "Today";
  if (band === "tomorrow") return "Tomorrow";
  return "Upcoming";
}

/**
 * The Done tab. Title and nothing else: `Overdue since Friday` on a finished
 * task is a sentence about a deadline that no longer applies, and no other
 * sentence was wanted. Most recently finished first, which is the row being
 * looked for when one was tapped by mistake.
 */
export function readDone(existing) {
  if (!Array.isArray(existing)) return [];
  return existing
    .filter((t) => t && (t.task_state === "done" || t.task_state === "cancelled"))
    .filter((t) => typeof t.title === "string" && t.title !== "")
    .sort((a, b) => String(b.closed_at ?? "").localeCompare(String(a.closed_at ?? "")))
    .map((t) => ({ card_id: t.id, card_title: t.title, card_reason: "", card_reason_short: "", card_band: "Done" }));
}

/**
 * @param {Array} existing     every stored task, handed in whole
 * @param {object} config     the config in force
 * @param {function} phraseFor  (task) => the card's lead clause
 * @param {function} bandOf     (task) => its `deadline_band`
 * @returns {{cards: Array, ranked: Array}}
 */
export function readCards(existing, config, phraseFor, bandOf, pushFor) {
  if (!Array.isArray(existing)) return { cards: [], ranked: [] };
  const ranked = existing
    .filter(onDefaultList)
    // A partial task cannot draw a card. The answer key hands in two fields per
    // open task rather than a whole record, so without this the key's cases
    // would build cards out of nothing the moment this file was wired in.
    .filter((t) => typeof t.title === "string" && t.title !== "" && "est_duration_min" in t)
    .map((t) => ({ task: t, key: rankKeyFor(t, config, bandOf) }))
    .sort((x, y) => firstDifference(x.key, y.key).sign);

  const clauses = config.reason_clauses.trailing;
  const label = (v) => (config.significance_buttons.find((b) => b.value === v) || {}).label ?? "";

  const cards = ranked.map((r, i) => {
    // `decided_by` is a property of a position, not of a task: it names what
    // separates this row from the row below, or for the last row, the row
    // above. A list of one has nothing to compare against and says nothing.
    const other = ranked[i + 1] ?? ranked[i - 1];
    const decided_by = other ? firstDifference(r.key, other.key).name : "";
    const lead = phraseFor(r.task);
    // Mobile says less. It drops every trailing clause and collapses an overdue
    // lead to one word: `Overdue since Wednesday` names a day that no longer
    // helps, and `Due Wednesday` on a task four days late would be a lie. The
    // hedge stays, because `around` changes what the date means rather than
    // decorating it.
    const short = bandOf(r.task) === "overdue" ? "Overdue" : lead;
    let reason = lead ? lead : "";
    const clause = clauses[decided_by];
    // Only a term that both separated the row and has a sentence written for
    // it speaks. The other seven decide the order silently, which is the
    // honest outcome: "you marked it Normal" explains nothing.
    if (clause && speaks(decided_by, r.task)) {
      const text = clause.text.replace("<significance_label>", label(r.task.significance));
      reason = reason ? reason + clause.join + text : text;
    }
    return {
      card_id: r.task.id,
      card_title: r.task.title,
      card_reason: reason ? `${reason}.` : "",
      card_reason_short: short ? `${short}.` : "",
      card_band: tabOf(bandOf(r.task)),
      rank_key: r.key,
      decided_by,
      // The push targets for this row, so the list can move a task without
      // opening it. Offered on every dated task, hard deadlines and pins
      // included: the app does not decide what he is allowed to move.
      push_options: pushFor ? pushFor(r.task) : [],
    };
  });
  return { cards, ranked };
}

/** A trailing clause is a claim about the task, so it must be true of it. */
function speaks(name, task) {
  if (name === "pinned") return Boolean(task.pinned);
  if (name === "is_hard") return task.date_firmness === "hard";
  if (name === "alarm_unanswered") return Boolean(task.alarm_unanswered_at);
  if (name === "significance") return task.significance !== 30;
  return false;
}
