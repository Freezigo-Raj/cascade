-- Cascade Part A — migration for config a.22 (session 148, the calendar import).
--
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE INSTALLING BUILD 64.
--
-- `schema.sql` opens with `create table if not exists`, which is what makes it
-- safe to re-run and is also why it will NOT add a column to a table that is
-- already there. Every column added after the first deploy needs a migration of
-- its own. This is that migration, and like every one before it, it is written
-- so that running it twice changes nothing.
--
-- Two columns:
--
--   calendar_uid       which calendar event a task came from, and — because it
--                      is non-empty — that the task must never be pushed back
--                      to the calendar. Without this the push and the import
--                      feed each other for ever.
--   calendar_detached  false while Google owns the task's title and date. The
--                      first edit to either in Cascade sets it true, and Google
--                      never touches the task again.
--
-- NOT NULL WITH DEFAULTS, on purpose. Every task written before today reads as
-- a typed, attached task with no backfill and no second pass.

alter table cascade_task
  add column if not exists calendar_uid      text    not null default '',
  add column if not exists calendar_detached boolean not null default false;

-- The import asks "which task is this event" on every sync, so the lookup has
-- to be an index rather than a scan of every row he owns.
create index if not exists cascade_task_calendar_uid
  on cascade_task (owner, calendar_uid)
  where calendar_uid <> '';
