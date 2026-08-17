// Cascade Part A — machine contract
// Companion to schema/contract.md and spec/example.md; see VERSIONS in spec.md.
// Enum members live in config, so config-resident enums are branded strings
// validated at runtime, not literal unions. Changing a member is a config
// change, never a code change.

/** ISO 8601, local time with offset: "2026-08-09T04:30:00+05:30" */
export type LocalTimestamp = string;

/** UUID v7. Time-ordered, so ascending id is creation order. */
export type Uuid = string;

/** "<letter>.<integer>", e.g. "a.1". Ordered by letter, then integer.
 *  A record is read against its own. No operation currently bumps the letter. */
export type ConfigVersion = string;

// --- Fixed enums: members are code, not config ---

export type TypeSource = "derived" | "user";

export type DatePrecision =
  | "time" | "band" | "day" | "span" | "week" | "month"
  | "open" | "none" | "undetermined";

export type DateFirmness = "hard" | "normal" | "soft";

export type DateAnchor = "none" | "end" | "start" | "point" | "window";

export type DurationSource = "default" | "selected" | "learned" | "summed";

export type TaskState = "ready" | "done" | "cancelled";

// --- Config-resident enums: validated at runtime against the record's config ---

/** A member of config.action_verbs, or "other". Never "undetermined". */
export type ActionVerb = string & { readonly __brand: "ActionVerb" };

/** A member of config.commitment_types. No "other" member exists. */
export type CommitmentType = string & { readonly __brand: "CommitmentType" };

/** A member of config.contexts, or "undetermined". */
export type Context = string & { readonly __brand: "Context" };

/** Set in the advanced panel, and only while the task carries a stated time.
 *  `repeat` is gone: every alarm now auto-snoozes on its own, and a task that
 *  should come back tomorrow has `recurrence` for that. */
export type AlarmType = "none" | "on";

/** Part A writes only "none". Part C widens this. */
export type BlockerReason = "none";

// --- Inputs: handed in, never computed ---

export type RowAction = "done" | "cancel" | "archive" | "pin" | "edit" | "undo";

/** Half-open character range in `typed_line`, `[start, end)`. */
export interface CharSpan {
  start: number;
  end: number;
}

export interface CaptureInput {
  typed_line: string;
  /**
   * Where in `typed_line` the words a chip typed still sit. The screen keeps
   * these and moves them as the line is edited; the engine reads none of them
   * and only records them, so a date still arrives one way.
   */
  chip_spans: CharSpan[];
  row_action: RowAction | null;
  /** UUID of the task being edited. Null means capturing a new one.
   *  The three bound-state signals are each a function of this. */
  bound_task_id: Uuid | null;
  type_chip_tap: CommitmentType | null;
  significance_tap: number | null;
  /** Minutes. Non-null makes `duration_source` "selected" and the verb default
   *  is not consulted. A comma list's sum loses to it too: the person read the
   *  number the engine gave them and replaced it. */
  duration_tap: number | null;
  /** Overrides the firmness the marker words implied. `is_hard` follows it, so
   *  this is the only way a tap-only capture reaches ranking tier 1. */
  firmness_tap: DateFirmness | null;
  /** Written to `notes` verbatim. It never enters `normalised`, so it reaches
   *  neither search nor duplicate detection: notes are read, not matched. */
  notes_text: string;
  /** Handed in on every call, never read from a system clock. */
  now: LocalTimestamp;
  new_id: Uuid;
  config: Config;
  /** Every open task, handed in whole. Duplicate detection compares the new
   *  line against each one's stored `normalised`. Empty on a first capture. */
  existing_tasks: Task[];
}

// --- Outputs, saved ---

// --- The record ---

export interface Task {
  // Identity and text
  id: Uuid;
  /** config.limits.raw_text_chars max, not whitespace-only. Never truncated. */
  raw_text: string;
  /** The ranges of `raw_text` a chip typed. Empty when nothing was tapped. */
  chip_spans: CharSpan[];
  /** raw_text minus the date span found in raw_text, empty when the date came
   *  from a chip. Full raw_text if the result would be empty. */
  title: string;
  /** raw_text minus every structured span, lowercased, punctuation stripped.
   *  Full normalised raw_text if that would be empty. */
  normalised: string;
  notes: string;

  // Classification
  /** The matched span verbatim. Empty when no token matched. */
  verb_phrase: string;
  action_verb: ActionVerb;
  commitment_type: CommitmentType;
  type_source: TypeSource;
  context: Context;
  /** Integer 0 to 100. Buttons emit 10, 30, 70. */
  significance: number;

  // Date
  date_phrase: string;
  /** Where the expression's words sit in `raw_text`, so a tapped chip can remove them. */
  date_spans: CharSpan[];
  date_hedge: string;
  date_marker: string;
  date_precision: DatePrecision;
  date_firmness: DateFirmness;
  date_anchor: DateAnchor;
  earliest_start: LocalTimestamp | null;
  due_at: LocalTimestamp | null;
  has_time: boolean;

  // Duration
  /** config.limits.duration_min to duration_max. */
  est_duration_min: number;
  duration_source: DurationSource;

  // Deferred: Part B
  /** `{every, unit}` while the task repeats, empty when it does not. */
  recurrence: { every: number; unit: "day" | "week" | "month" } | null;
  /** What the person asked for. The shell is what fires it. */
  alarm_type: AlarmType;
  /** Minutes before `due_at`. Empty when there is no alarm. */
  alarm_lead_min: number | null;
  /** When it will ring instead of `alarm_at`, after a snooze. Empty otherwise.
   *  The task holds this so a snooze survives a reinstall and reaches the other
   *  devices; the shell holds its own copy so it can re-ring with the WebView
   *  dead. Two homes, and this one is the truth. */
  alarm_snoozed_until: LocalTimestamp | null;
  /** When an alarm rang its whole chain out and nothing was pressed. The live
   *  escalation marker: cleared by a push, a Done, or an edit that moves the
   *  date. `reminder_fatigue` is the count that is never cleared. */
  alarm_unanswered_at: LocalTimestamp | null;
  /** How many alarms on this task have gone unanswered. History, never reset.
   *  Part B's `notification_history` will add to it and does not own it. */
  reminder_fatigue: number;

  // Deferred: Part C
  blocked: boolean;
  blocker_reason: BlockerReason;
  blocker_ref: Uuid | null;
  project_id: Uuid | null;

  // State and lifecycle
  task_state: TaskState;
  /** Independent of task_state. Archiving is not an outcome. */
  archived: boolean;
  pinned: boolean;
  config_version: ConfigVersion;
  created_at: LocalTimestamp;
  updated_at: LocalTimestamp;
  /** Non-null exactly when task_state is "done" or "cancelled". */
  closed_at: LocalTimestamp | null;
  /** How many times the task has been pushed. The only history the record keeps. */
  push_count: number;
  /** Where it was first due, before any push. Empty until the first one. */
  first_due_at: LocalTimestamp | null;
  /** The completion that produced this occurrence, so undoing it can remove this one. */
  spawned_from: string | null;
}

export type UndoAction = RowAction | "create";

export interface UndoEntry {
  action: UndoAction;
  task_id: Uuid;
  /** The complete Task before the action. Null when action is "create". */
  prior_state: Task | null;
  created_at: LocalTimestamp;
}

// --- Outputs, shown ---

export type GroupHeader = "ACTIVE" | "IDEAS" | "DONE";

/** Part A has two lists and no tabs. */
export type ListHeader = "Default" | "Ideas";

export interface CardView {
  /**
   * The task's own id. A row is a thing to press, and every press has to name
   * the task it lands on; without this the screen matched a card to a task by
   * its title, which two tasks are allowed to share.
   */
  card_id: string;
  card_title: string;
  card_reason: string;
  /** The same sentence for mobile: no trailing clause, and overdue reads "Overdue." */
  card_reason_short: string;
  /** "Today" · "Tomorrow" · "Upcoming" · "Ideas" · "Done". Which tab holds it. */
  card_band: string;
  push_options: PushOption[];
}

export interface AlarmView {
  /** When it fires: `due_at` less the lead. Derived, never stored. */
  alarm_at: LocalTimestamp;
  /** When it will actually ring: `alarm_snoozed_until` if that is still ahead,
   *  otherwise `alarm_at`. What the shell arms. */
  alarm_ring_at: LocalTimestamp;
  /** The derived instant the shell armed against, so a diff can tell a snoozed
   *  alarm from a stale one. Without it, opening the app mid-snooze cancels it. */
  alarm_armed_for: LocalTimestamp;
  alarm_title: string;
  /** The mobile sentence: no trailing clause, no minutes. */
  alarm_reason: string;
  /** "[Done]" "[Snooze 5m]" "[Snooze 10m]" "[Snooze 30m]" "[Snooze 60m]".
   *  Push is not here: moving a due date needs the app, so it needs an unlock. */
  alarm_actions: string[];
  /** Seconds of ringing before it snoozes itself. */
  alarm_ring_sec: number;
  /** Minutes it snoozes itself for, and how many times it may. */
  alarm_auto_snooze_min: number;
  alarm_auto_max: number;
}

export interface PushOption {
  /** "Tomorrow" · "Next week" · "+2 weeks" */
  push_label: string;
  push_to: LocalTimestamp;
}

export interface ResultRow {
  task_id: string;
  title: string;
  /** "<due_phrase abbreviated> · <action_verb> · <est_duration_min>m" */
  result_row: string;
}

/** One search group. `(none)` is appended to the header when it holds no rows. */
export interface ResultGroup {
  group_header: GroupHeader | string;
  rows: ResultRow[];
}

export interface ListView {
  list_header: ListHeader;
  sort_header: string;
  chip_row: string[];
  cards: CardView[];
  /** The Ideas list, sorted by duration. Both lists return; the screen toggles. */
  ideas: CardView[];
  /** The Done tab. Title only. */
  done: CardView[];
  results: ResultGroup[];
}

export type InputFieldState = "bound" | "unbound";

export interface CaptureView {
  /** "Edit" when bound_task_id is present, "Add" when null. */
  add_button: string;
  input_field: InputFieldState;
  /** significance_buttons labels, current one emphasised. */
  significance_row: string[];
  /** commitment_type with a change affordance. Null when there is no text. */
  type_chip: string | null;
  /** "⟨ <title> ✕ ⟩". Null when no task is bound for editing. */
  bound_task_chip: string | null;
  /** Labels for row_action done, cancel, archive. Empty when nothing is bound. */
  action_row: string[];
  /** '"<title>" [and <n> others] is at <time>.' Absent when nothing overlaps. */
  clash_dialog: string | null;
  /** '"<title>" [and <n> others] is also due <day>.' Two `hard` dates on one
   *  calendar day. A deadline occupies no slot, so `clash_dialog` cannot see
   *  one; this reads the day and never the time. */
  deadline_dialog: string | null;
  /** '"<title>" already exists, <band sentence>.' Null when no duplicate fires. */
  duplicate_dialog: string | null;
}

/** What resolve() returns: one saved record and the two shown views.
 *  Named in the contract under "What resolve() returns". */
export interface ResolveOutput {
  task: Task;
  working: WorkingValues;
  list: ListView;
  capture: CaptureView;
}

/** 'Added "<title>" · <date_phrase>'. Held for config.undo_ui_timeout_sec;
 *  the UndoEntry outlives it. */
export type undo_toast = string;

// --- Working values: computed in between, never persisted ---

export type DeadlineBand = "overdue" | "today" | "tomorrow" | "this_week" | "later" | "none";

export interface Window {
  start: ClockTime;
  end: ClockTime;
}

/** Half-open [start, end). Absolute instants, not clock times. */
export interface ResolvedWindow {
  start: LocalTimestamp;
  end: LocalTimestamp;
}

export interface WorkingValues {
  /** Lead clause of card_reason. Not a DeadlineBand member. */
  due_phrase: string;
  /** max(trigram, word_match) over two compare_keys. Trigrams are multisets. */
  similarity: Similarity;
  /** ranking.overrides then ranking.factors, in order. */
  rank_key: unknown[];
  /** due_phrase with leading "Due" lowercased, day names cut to three
   *  letters and keeping their capital. */
  due_phrase_short: string;
  /** The override or factor separating this task from the one below it.
   *  Null for the last row. card_reason's trailing clause names it. */
  decided_by: string | null;
  resolved_window: ResolvedWindow | null;
  /** {max(start, now), end}. Null when the window rolled instead. */
  clipped_window: ResolvedWindow | null;
  /** normalised with every purely numeric token removed. */
  compare_key: string;
  /** compare_keys equal but normalised differ: distinct items, no dialog. */
  numeric_variant: boolean;
  deadline_band: DeadlineBand;
  is_hard: boolean;
  /** 0 in Part A. From workflow_edges, a Part C structure. */
  workflow_position: number;
  /** True while `alarm_unanswered_at` is set: the third tier-1 override. */
  alarm_unanswered: boolean;
}

/** max(trigram, word_match) over two compare_keys, both Sørensen-Dice. 0 to 1. */
export type Similarity = number;

// --- Config ---
// Thirty-six objects. Vocabulary is the only part records depend on.

/** A vocabulary member. Never removed or repurposed, only deactivated. */
export interface VocabMember {
  id: string;
  active: boolean;
}

export type RankingMode = "lexicographic" | "weighted";

export interface RankingConfig {
  /** Absolute. No score beats these, under any mode. */
  overrides: string[];
  mode: RankingMode;
  factors: string[];
  /** Absent while mode is "lexicographic". */
  weights?: Record<string, number>;
}

export interface TrailingClause {
  /** Joins to what precedes it. ". " for a sentence, ", and " for a clause. */
  join: string;
  text: string;
}

export interface ReasonClauses {
  /** Finest granularity wins: time, then precision, then band. */
  lead: { time: string; precision: Record<string, string>; band: Record<string, string> };
  /** Keyed by decided_by. */
  trailing: Record<string, TrailingClause>;
}

export interface SignificanceButton {
  value: number;
  label: string;
}

/** Local time of day, "09:00". */
export type ClockTime = string;

export interface Config {
  version: ConfigVersion;

  // Vocabulary — records hold these members
  action_verbs: VocabMember[];
  contexts: VocabMember[];
  commitment_types: VocabMember[];

  // Lexicon — surface form to member. No record depends on these.
  verb_lexicon: Record<string, string>;
  date_lexicon: Record<string, DatePrecision>;
  /** Shorthand a person types, each mapping to a `date_lexicon` key. */
  /** Verb forms no spelling rule reaches, each mapping to a `verb_lexicon` key. */
  verb_irregulars: Record<string, string>;
  date_aliases: Record<string, string>;
  marker_words: { strong: string[]; weak: string[]; start: string[]; point: string[] };
  hedge_words: string[];

  // Behaviour
  verb_to_type: Record<string, string>;
  verb_to_context: Record<string, string>;
  duration_defaults: Record<string, number>;
  day_start_anchor: ClockTime;
  time_bands: Record<"morning" | "afternoon" | "evening" | "night", Window>;
  window_bounds: Record<"day" | "week" | "span" | "month", string>;
  deadline_bands: DeadlineBand[];
  type_suggestions: string[];
  type_order: string[];
  precision_order: DatePrecision[];
  firmness_order: DateFirmness[];
  ranking: RankingConfig;
  reason_clauses: ReasonClauses;
  chip_presets: string[];
  significance_buttons: SignificanceButton[];
  /** Label to minutes for the chips beside the duration box. Never stored. */
  duration_units: Record<string, number>;
  /** Minutes offered beside the box. Not a vocabulary; no record holds one. */
  duration_suggestions: number[];
  /** Minutes offered on the ringing alarm, one button each. */
  alarm_snooze_options: number[];
  limits: { raw_text_min_chars: number; raw_text_chars: number; duration_min: number; duration_max: number; notes_chars: number };
  alarm_types: AlarmType[];
  alarm_lead_by_type: Record<string, number>;
  alarm_defaults: { lead_min: number; max_lead_min: number; ring_sec: number; auto_snooze_min: number; auto_max: number };
  capacity_min_per_day: number;
  search: { fuzzy_threshold: number };
  duplicate: { threshold: number; min_chars: number };
  undo_ui_timeout_sec: number;
  learning: { min_samples: number };
}
