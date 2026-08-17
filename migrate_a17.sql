-- Cascade — migration to config a.17 / shell 29 (the alarm).
--
-- `schema.sql` creates its tables with `create table if not exists`, so running
-- it again against a live project adds nothing. This file is the difference.
-- Idempotent: safe to run twice.
--
-- Run it in the Supabase SQL editor BEFORE loading the new build. The app writes
-- `reminder_fatigue` on the first unanswered alarm and reads
-- `alarm_snoozed_until` on every sync, and a missing column reads back as
-- `permission denied` or a silent null rather than as a missing column.

-- Three fields the alarm writes. Instants are stored twice, as an instant for
-- comparing and an offset for reading back the local day the person meant.
alter table cascade_task
  add column if not exists alarm_snoozed_until        timestamptz,
  add column if not exists alarm_snoozed_until_offset text,
  add column if not exists alarm_unanswered_at        timestamptz,
  add column if not exists alarm_unanswered_at_offset text,
  add column if not exists reminder_fatigue           integer not null default 0;

-- `alarm_type` lost `repeat`, so any row still holding it holds a member the
-- current config does not define. Nothing is live, so this rewrites rather than
-- deprecating: `on` is what both old members now mean.
update cascade_task set alarm_type = 'on' where alarm_type in ('once', 'repeat');

-- The interval a repeating alarm rang at. Gone: every alarm auto-snoozes now.
alter table cascade_task drop column if exists alarm_repeat_min;

-- What it should say afterwards: five rows.
select column_name
from information_schema.columns
where table_name = 'cascade_task'
  and column_name in ('alarm_snoozed_until', 'alarm_snoozed_until_offset',
                      'alarm_unanswered_at', 'alarm_unanswered_at_offset',
                      'reminder_fatigue')
order by column_name;
