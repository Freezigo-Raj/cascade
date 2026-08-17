// Cascade Part A — the Stage 3 placeholder, frozen.
//
// Kept so the Stage 4 condition stays demonstrable. Every key edit after Stage 5
// opened would otherwise be argued from an old run: `node gate4.mjs --placeholder`
// runs the current key against this file and the Stage 4 reading, and every case
// must still fail. Nothing imports it but the runner. It is never edited again.
//
// Correct name, correct inputs, correct return shape. It ignores the input
// entirely and returns a fixed hand-written answer copied from section 1 of
// spec/example.md. There is no logic here and there must not be until Stage 5.
//
// Break this file deliberately (return null, drop a field) and app.js must
// show a loud error naming this function, not a blank screen.

/**
 * The record below is the §3 table of spec/example.md, copied by hand, field
 * for field. It is returned for every input, which is what makes Stage 4's
 * answer key fail across the board. `task` is the saved output, `list` and
 * `capture` are the shown outputs; the contract's three groups, one per key.
 *
 * @param {import("./types.js").CaptureInput} input  ignored at Stage 3
 * @returns {{ task: Task, working: WorkingValues, list: ListView, capture: CaptureView }}
 */
export function resolve(input) {
  console.log("[resolve] called with typed_line=%o — input ignored at Stage 3", input.typed_line);

  return {
    task: {
      id: "019876e2-0000-7000-8000-00000000abcd",
      raw_text: "Call markan morning",
      title: "Call markan",
      normalised: "call markan",
      notes: "",
      verb_phrase: "Call",
      action_verb: "call",
      commitment_type: "action",
      type_source: "derived",
      context: "phone",
      significance: 70,
      date_phrase: "morning",
      date_hedge: "",
      date_marker: "",
      date_precision: "band",
      date_firmness: "normal",
      date_anchor: "window",
      earliest_start: "2026-08-03T09:00:00+05:30",
      due_at: "2026-08-03T11:20:00+05:30",
      has_time: false,
      est_duration_min: 15,
      duration_source: "default",
      recurrence: null,
      alarm_type: "none",
      alarm_lead_min: null,
      alarm_snoozed_until: null,
      alarm_unanswered_at: null,
      reminder_fatigue: 0,
      blocked: false,
      blocker_reason: "none",
      blocker_ref: null,
      project_id: null,
      task_state: "ready",
      archived: false,
      pinned: false,
      config_version: "a.13",
      created_at: "2026-08-03T10:40:00+05:30",
      updated_at: "2026-08-03T10:40:00+05:30",
      closed_at: null,
    },
    working: {
      due_phrase: "Due this morning",
      due_phrase_short: "due this morning",
      deadline_band: "today",
      is_hard: false,
      workflow_position: 0,
      reminder_fatigue: 0,
      resolved_window: { start: "2026-08-03T09:00:00+05:30", end: "2026-08-03T12:00:00+05:30" },
      clipped_window: { start: "2026-08-03T10:40:00+05:30", end: "2026-08-03T12:00:00+05:30" },
      compare_key: "call markan",
      similarity: 0,
      numeric_variant: false,
      rank_key: [],
      decided_by: "deadline_band",
    },
    list: {
      list_header: "Default",
      group_header: "ACTIVE",
      sort_header: "",
      chip_row: ["This afternoon", "Tonight", "Tomorrow AM", "Weekend", "Pick date", "Park"],
      cards: [
        {
          card_title: "Social alpha application",
          card_reason: "Due today. You called this a deadline.",
          card_badge: "submit · 30m",
        },
        {
          card_title: "file form 8",
          card_reason: "Overdue since Friday.",
          card_badge: "file · 30m",
        },
        {
          card_title: "Reply to bharti singhal",
          card_reason: "Due this morning.",
          card_badge: "reply ·  5m",
        },
        {
          card_title: "check sensor",
          card_reason: "Due today.",
          card_badge: "check ·  15m",
        },
      ],
      result_row: [],
    },
    capture: {
      add_button: "Add",
      input_field: "unbound",
      significance_row: ["Low", "Normal", "High"],
      type_chip: null,
      bound_task_chip: null,
      action_row: [],
      duplicate_dialog: null,
    },
  };
}
