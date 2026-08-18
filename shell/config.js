// Cascade Part A — config. The version is the `version` field below and
// VERSIONS in spec.md; it is not repeated in this comment.
// Every value here is one that an origin in spec/example.md points at.
// Nothing is invented to look complete: a surface form the example does not
// show is absent, and absence resolves to `other`, which costs nothing.
// Vocabulary members are never removed or repurposed, only deactivated.
const active = (id) => ({ id, active: true });
export const partAConfig = {
    version: "a.18",
    // --- Vocabulary: records hold these members ---
    // Drawn only from what the example exercises. Thin on purpose:
    // a missing member falls to `other`, which is free. An extra member is permanent.
    // a.2 adds eleven, drawn from the 61-line backlog. Additions are permanent:
    // a member is deactivated, never removed.
    action_verbs: [
        "call", "check", "pay", "submit", "message", "make", "meet",
        "send", "reply", "talk", "give", "file", "renew", "finalize",
        "confirm", "book", "bill", "hire",
    ].map(active),
    contexts: ["phone", "bills"].map(active),
    commitment_types: [
        "appointment", "deadline", "action", "habit", "maintenance", "purchase",
        "decision", "research", "waiting", "project", "information", "goal",
        "wish", "idea",
    ].map(active),
    // --- Lexicon: surface form to member. No record depends on these. ---
    // Surface forms only. Every member of action_verbs must be reachable from
    // here or it is dead. `tickets` and `investment` are deliberately absent:
    // they are the example's only `other` cases and adding them would erase the
    // only evidence that a lexicon gap resolves correctly.
    verb_lexicon: {
        call: "call", calls: "call", ring: "call",
        check: "check", checking: "check", verify: "check", inspect: "check",
        pay: "pay", payment: "pay", payments: "pay",
        submit: "submit", submission: "submit", application: "submit",
        file: "file", filing: "file", form: "file", itr: "file", gstr: "file",
        message: "message", msg: "message", text: "message",
        reply: "reply", replying: "reply", respond: "reply",
        send: "send", sending: "send", forward: "send",
        talk: "talk", discuss: "talk",
        give: "give", handover: "give",
        make: "make", making: "make", build: "make", software: "make",
        meet: "meet", meeting: "meet", vc: "meet",
        renew: "renew", renewal: "renew",
        finalize: "finalize", finalise: "finalize",
        confirm: "confirm", confirmation: "confirm",
        book: "book", booking: "book",
        bill: "bill", billing: "bill", bills: "bill", invoice: "bill",
        hire: "hire", hiring: "hire",
    },
    date_lexicon: {
        morning: "band",
        afternoon: "band",
        evening: "band",
        tonight: "band",
        night: "band",
        today: "day",
        tomorrow: "day",
        yesterday: "day",
        // Weekday words are config because they are words, and the app expects
        // Hindi and Gujarati input. A calendar date or a clock time is read by the
        // engine instead: those are numbers, and there is no list to write.
        monday: "day",
        tuesday: "day",
        wednesday: "day",
        thursday: "day",
        friday: "day",
        saturday: "day",
        sunday: "day",
        weekend: "span",
        "this week": "week",
        "next week": "week",
        "next month": "month",
        someday: "open",
    },
    marker_words: {
        strong: ["deadline", "cutoff", "last date", "expires", "no later than", "due date", "latest"],
        weak: ["by", "before", "due", "till", "until"],
        start: ["after", "from", "starting", "once", "not before"],
        point: ["at"],
    },
    // Only what spec/example.md evidences. A word not here demotes nothing.
    hedge_words: ["maybe"],
    // --- Behaviour ---
    verb_to_type: {
        call: "action", check: "action", message: "action", reply: "action",
        send: "action", talk: "action", give: "action", confirm: "action",
        pay: "deadline", submit: "deadline", file: "deadline",
        renew: "deadline", bill: "deadline",
        make: "project", hire: "project",
        meet: "appointment",
        book: "purchase",
        finalize: "decision",
        other: "action",
    },
    // contexts stays at two members. A verb with no entry gives `undetermined`.
    verb_to_context: {
        call: "phone", message: "phone", reply: "phone", send: "phone", talk: "phone",
        pay: "bills", submit: "bills", file: "bills", bill: "bills",
    },
    duration_defaults: {
        call: 15, check: 30, pay: 10, submit: 30, message: 5, make: 60, meet: 60,
        send: 5, reply: 5, talk: 15, give: 10, file: 30, renew: 30,
        finalize: 30, confirm: 10, book: 20, bill: 15, hire: 60,
        other: 5,
    },
    day_start_anchor: "09:00",
    // Words whose ending is not English spelling. The suffix rules in the engine
    // reach `replied` and `booking`; nothing reaches `paid` or `sent` but a list.
    // Vocabulary, so config, and a Gujarati or Hindi verb form is added here.
    verb_irregulars: {
        paid: "pay", sent: "send", made: "make", met: "meet", gave: "give",
        given: "give", spoke: "talk", spoken: "talk", told: "talk", said: "talk",
        built: "make", bought: "book", booked: "book", wrote: "message",
        written: "message", read: "check", rang: "call", rung: "call",
        "follow up": "reply", "followup": "reply", "follow-up": "reply",
        "get back": "reply", "check up": "check", "fill up": "file",
    },
    // What a person types when they do not type the whole word. Config, because
    // these are words, and the words differ by person and by language. Each maps
    // to an entry in `date_lexicon`; the engine expands before it looks anything up.
    date_aliases: {
        tmrw: "tomorrow", tmw: "tomorrow", tomo: "tomorrow", "2mrw": "tomorrow",
        yest: "yesterday", tdy: "today", tday: "today",
        mon: "monday", tue: "tuesday", tues: "tuesday", wed: "wednesday",
        thu: "thursday", thur: "thursday", thurs: "thursday",
        fri: "friday", sat: "saturday", sun: "sunday",
        eod: "today", tonite: "tonight", wkend: "weekend",
    },
    time_bands: {
        morning: { start: "09:00", end: "12:00" },
        afternoon: { start: "12:00", end: "18:00" },
        evening: { start: "18:00", end: "21:00" },
        night: { start: "21:00", end: "24:00" },
    },
    // Half-open. day_start_anchor supplies every start; every end is 24:00 exclusive
    // on the window's last day.
    window_bounds: {
        day: "[day_start_anchor, 24:00)",
        week: "[Mon day_start_anchor, next Mon 00:00)",
        span: "[Sat day_start_anchor, Mon 00:00)",
        month: "[1st day_start_anchor, 1st of next 00:00)",
    },
    deadline_bands: ["overdue", "today", "tomorrow", "this_week", "later", "none"],
    // Ranking factor 5, ordered by how much of the task is yours to do right now.
    // Three moves from the Stage 2 order, which was fitted to nothing:
    // `maintenance` above `habit`, because an obligation beats a choice;
    // `waiting` below `information`, because nothing on it is yours to do;
    // `project` up one, because it still has a next step you can take.
    // Still fitted to nothing. A week of real captures is what would settle it.
    // The type chip offers these three and hides the other eleven behind the
    // advanced button. `verb_to_type` maps a verb to exactly one type, so there
    // are no runners-up to offer: a fixed short list is honest where a guessed
    // one would not be. The three that cover most captures, in `type_order`.
    type_suggestions: ["deadline", "action", "appointment"],
    type_order: [
        "appointment", "deadline", "action", "maintenance", "habit", "purchase",
        "decision", "research", "project", "information", "waiting", "goal",
        "wish", "idea",
    ],
    // Ranking reads a fixed set as an order. `deadline_bands` and `type_order`
    // already sat here; these two were written in the example's direction table
    // and nowhere a program could reach, which is what kept the ranking a
    // description rather than a rule.
    precision_order: [
        "time", "band", "day", "span", "week", "month", "open", "none",
        "undetermined",
    ],
    // `hard` is separated in tier 1 and never reaches factor 3, so it sits last
    // here rather than first: the list is the order among what is left.
    firmness_order: ["normal", "soft", "hard"],
    ranking: {
        // Tier 1. Absolute: no score beats these, under any mode.
        // Three now. An alarm that rang its whole chain out unanswered means the
        // one mechanism built to interrupt a person has already failed on this
        // task, and no score below should be able to bury it. It sits third so a
        // soft task cannot jump a hard one on the strength of a missed alarm.
        overrides: ["pinned", "is_hard", "alarm_unanswered"],
        // Tier 2. "weighted" would replace tier 3 wholesale and leave tier 1 alone.
        mode: "lexicographic",
        // Tier 3. Nine factors, in order.
        factors: [
            "deadline_band", "significance", "date_firmness", "date_precision",
            "commitment_type", "est_duration_min", "workflow_position",
            "reminder_fatigue", "updated_at",
        ],
    },
    reason_clauses: {
        // Finest granularity wins: a stated time, then precision when due today,
        // then the band. Without the precision tier "Due this morning" is impossible.
        lead: {
            time: "Due at <time>",
            precision: {
                band: "Due this <band>",
                day: "Due today",
            },
            band: {
                overdue: "Overdue since <day>",
                today: "Due today",
                tomorrow: "Due tomorrow",
                this_week: "Due <day>",
                later: "Due <date>",
                none: "No date",
            },
        },
        // Each carries its own joiner: is_hard is a sentence, significance a clause.
        trailing: {
            pinned: { join: ". ", text: "You pinned this" },
            is_hard: { join: ". ", text: "You called this a deadline" },
            significance: { join: ", and ", text: "you marked it <significance_label>" },
            // A row that jumps for a reason nothing states is the invisible-number
            // problem again. Colour cannot say it: three states is the limit and all
            // three are spent. So it is a sentence, and only on the wide sentence.
            alarm_unanswered: { join: ". ", text: "Its alarm rang unanswered" },
        },
    },
    chip_presets: [
        "This afternoon", "Tonight", "Tomorrow morning", "Weekend", "Pick date", "Pick time",
    ],
    // Times a thumb can reach without opening a dial (session 119). Screen
    // vocabulary like `chip_presets`: each types its label into the box, the
    // engine reads the words, and no record depends on the list.
    time_suggestions: ["9am", "12pm", "3pm", "6pm", "9pm"],
    significance_buttons: [
        { value: 10, label: "Low" },
        { value: 30, label: "Normal" },
        { value: 70, label: "High" },
    ],
    // What the unit chips beside the duration box multiply by. A unit is never
    // stored: the box and the chip are read together and one number is written.
    duration_units: { min: 1, hour: 60, day: 1440 },
    // Suggestions beside the box, in minutes. They are not a vocabulary and no
    // record depends on them: tapping one fills the box and nothing else.
    duration_suggestions: [15, 30, 60, 120],
    // The snooze buttons on a ringing alarm, in minutes. Pressed when it rings
    // rather than chosen in advance: nobody knows at capture how long they will
    // want, and the number is only ever wanted with the thing in front of you.
    // 15 left the list because four buttons on a lock screen is already the most
    // a thumb should have to aim at.
    alarm_snooze_options: [5, 10, 30, 60],
    limits: {
        // A line is not a capture until it carries something to read. Fitted to
        // nothing: two is a guess, and the only real rule is the letter-or-digit one.
        raw_text_min_chars: 2,
        raw_text_chars: 280,
        duration_min: 1,
        duration_max: 262800,
        // Notes are read, never matched. The cap exists so one task cannot carry a
        // document, not because anything counts them.
        notes_chars: 2000,
    },
    // Fitted against eleven hand-made pairs in the example, not derived.
    // Sørensen-Dice both ways; comparison is >= threshold.
    // Live search. Its fuzzy tier is deliberately looser than `duplicate`: a
    // result is not a question, so a false positive costs nothing, where a false
    // dialog interrupts. The two numbers are separate for that reason.
    // How much committed work a day holds, in minutes. One number for every day.
    // Fitted to nothing, like `duplicate.threshold`: three hours is what he says a
    // full day feels like, and the first week of real captures is what corrects
    // it. The load it measures is a sum of `est_duration_min`, which are defaults
    // per verb rather than measurements, so the note it produces says `roughly`.
    // The alarm vocabulary. The Android shell fires them; Part A records what was
    // asked for and derives when, which is why there is still no scheduler here.
    // Two members. `repeat` is gone: every alarm auto-snoozes on its own now, so
    // "ring again" was a second way to say what the alarm already does, and a
    // task that should come back another day has `recurrence`.
    alarm_types: ["none", "on"],
    // Defaults for a task that asks for an alarm without saying more, and the
    // floor and ceiling a lead time may take.
    // The suggested lead, by what kind of thing the task is. Every value is the
    // same today, deliberately: the shape is here so a correction is a number
    // change rather than a structural one, and no guess is recorded as if it
    // were evidence. While they are all equal this table changes no behaviour,
    // which is the honest state of it and is said out loud in the contract.
    //
    // The argument for pulling them apart, when there is anything to pull them
    // apart with: an appointment's lead is about getting there, a deadline's is
    // about having time to do the thing, and a deadline told with less warning
    // than the job takes is an announcement rather than a warning.
    alarm_lead_by_type: {
        appointment: 15,
        deadline: 15,
        action: 15,
        maintenance: 15,
        habit: 15,
        purchase: 15,
        decision: 15,
        research: 15,
        project: 15,
        information: 15,
        waiting: 15,
        goal: 15,
        wish: 15,
        idea: 15,
    },
    // `ring_sec` 120: two minutes of noise is enough to wake someone and short
    // enough not to be the reason the phone gets silenced for ever.
    // `auto_snooze_min` 5 with `auto_max` 5 spans about 35 minutes from the first
    // ring. After the fifth it stops and the task escalates instead: an alarm
    // that rings all morning trains a person to stop hearing alarms.
    alarm_defaults: { lead_min: 15, max_lead_min: 10080, ring_sec: 120, auto_snooze_min: 5, auto_max: 5 },
    capacity_min_per_day: 180,
    search: { fuzzy_threshold: 0.5 },
    duplicate: {
        threshold: 0.6,
        min_chars: 6,
    },
    undo_ui_timeout_sec: 8,
    learning: { min_samples: 5 },
};
