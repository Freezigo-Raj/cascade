-- Cascade Part A — Supabase schema.
--
-- Three tables and nothing clever. The record is the contract's `Task`, one
-- column per field, because that is the shape Postgres wants and a JSON blob
-- would have been fewer lines here and a rewrite the first time anything
-- queried a field.
--
-- One column per `Task` field and no others. `compare_key` had a column here
-- and is not a `Task` field: it is a working value, `normalised` minus its
-- purely numeric tokens, recomputed on every call. Storing it put a NOT NULL
-- column in the way of every insert, because nothing was ever going to write
-- it, and a stored copy would have gone stale against `normalised` the first
-- time a title was edited. Dropped, along with the index over it, for the same
-- reason `deadline_band` is recomputed and `alarm_at` is never stored.
--
-- Two decisions are visible in the column types.
--
-- **Instants keep their offset.** The contract stores ISO local-with-offset and
-- every band boundary is local: `deadline_band` is "the same calendar day in
-- the user's zone". `timestamptz` alone normalises to UTC on write and hands
-- back UTC on read, so the instant survives and the offset does not, and the
-- day boundary moves with it. Each instant is therefore a `timestamptz` for
-- comparing and an `offset` for reading back what the person meant.
--
-- **Multi-user, no sharing.** Every row carries an owner and row-level security
-- is on. Without it the first second account sees the first account's tasks.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- configs
--
-- A record stamps the `config_version` that produced it. Until now that stamp
-- pointed at a config living only in the app bundle, so a row saying `a.13`
-- could not be checked against anything once a.14 shipped. The config is stored
-- here on first use, which makes the stamp evidence rather than decoration.

create table if not exists cascade_config (
  version      text primary key,
  body         jsonb not null,
  first_seen   timestamptz not null default now()
);

alter table cascade_config enable row level security;

-- Config is vocabulary, not anyone's data: readable by every signed-in account.
drop policy if exists "config readable" on cascade_config;
create policy "config readable" on cascade_config
  for select to authenticated using (true);

-- And insertable, because the store writes the config in force on first use and
-- until now no policy let it: `ensureConfig()` failed silently on every fresh
-- project. There is no update policy and no delete policy, so a version's body
-- is write-once. That is what makes a `config_version` stamp evidence: `a.15`
-- means the a.15 that shipped, not whatever a.15 was last edited to say.
drop policy if exists "config insert" on cascade_config;
create policy "config insert" on cascade_config
  for insert to authenticated with check (true);

-- ------------------------------------------------------------------ tasks

create table if not exists cascade_task (
  id                 uuid primary key,
  owner              uuid not null references auth.users(id) on delete cascade,

  -- handed in
  raw_text           text not null,
  chip_spans         jsonb not null default '[]'::jsonb,
  config_version     text not null references cascade_config(version),

  -- what it is
  title              text not null,
  normalised         text not null,
  verb_phrase        text not null default '',
  action_verb        text not null,
  commitment_type    text not null,
  type_source        text not null,
  context            text not null,
  significance       integer not null default 30,
  est_duration_min   integer not null,
  duration_source    text not null,

  -- when
  date_phrase        text not null default '',
  date_spans         jsonb not null default '[]'::jsonb,
  date_hedge         text not null default '',
  date_marker        text not null default '',
  date_precision     text not null,
  date_anchor        text not null,
  date_firmness      text not null,
  has_time           boolean not null default false,
  due_at             timestamptz,
  due_at_offset      text,
  earliest_start     timestamptz,
  earliest_start_offset text,

  -- state
  task_state         text not null default 'ready',
  archived           boolean not null default false,
  pinned             boolean not null default false,
  notes              text,
  recurrence         jsonb,
  alarm_type         text,
  alarm_lead_min     integer,
  alarm_repeat_min   integer,
  blocked            boolean not null default false,
  blocker_reason     text,
  blocker_ref        text,
  project_id         uuid,

  -- history, the only history a task keeps
  push_count         integer not null default 0,
  first_due_at       timestamptz,
  first_due_at_offset text,
  spawned_from       uuid,

  created_at         timestamptz not null,
  created_at_offset  text not null,
  updated_at         timestamptz not null,
  updated_at_offset  text not null,
  closed_at          timestamptz,
  closed_at_offset   text,

  -- From the contract's cross-field invariants. The engine rejects a record
  -- that breaks one; the table refuses to hold it either, because a client is
  -- one bug away from writing what the engine would not.
  constraint closed_iff_terminal check (
    (task_state in ('done','cancelled')) = (closed_at is not null)
  ),
  constraint significance_range check (significance between 0 and 100),
  constraint duration_positive check (est_duration_min > 0)
);

create index if not exists cascade_task_owner_open
  on cascade_task (owner, due_at)
  where task_state = 'ready' and archived = false;

-- What a sync pull reads and what a stale write is compared against.
create index if not exists cascade_task_owner_updated
  on cascade_task (owner, updated_at);

-- ------------------------------------------------------- two devices, one task
--
-- Newest wins, and the rule lives here rather than in a `where` clause in the
-- client. A phone that was in a tunnel drains its queue an hour late; that write
-- carries the `updated_at` it was made at, and it must not overwrite the edit
-- made on the laptop since. Returning OLD from a BEFORE UPDATE drops the stale
-- write and leaves the row as it stands.
--
-- A client is one bug away from forgetting the comparison. Postgres is not.
create or replace function cascade_task_newer_wins() returns trigger
language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists cascade_task_newer_wins on cascade_task;
create trigger cascade_task_newer_wins
  before update on cascade_task
  for each row execute function cascade_task_newer_wins();

alter table cascade_task enable row level security;

-- No sharing in v1. One policy per verb rather than one for all, so widening
-- read access later cannot widen write access by accident.
drop policy if exists "task select own" on cascade_task;
create policy "task select own" on cascade_task
  for select to authenticated using (auth.uid() = owner);
drop policy if exists "task insert own" on cascade_task;
create policy "task insert own" on cascade_task
  for insert to authenticated with check (auth.uid() = owner);
drop policy if exists "task update own" on cascade_task;
create policy "task update own" on cascade_task
  for update to authenticated using (auth.uid() = owner) with check (auth.uid() = owner);
drop policy if exists "task delete own" on cascade_task;
create policy "task delete own" on cascade_task
  for delete to authenticated using (auth.uid() = owner);

-- ------------------------------------------------------------------- undo
--
-- One entry at a time, superseded rather than stacked, which is why the owner
-- is the primary key. `prior_state` is a whole record and not a diff, because
-- nothing smaller can restore a task's every field at once.
--
-- Every field but one. The restored record takes a fresh `updated_at`: an undo
-- is a change made now, and under newest-wins a change made now is the one that
-- stands. Carrying the old stamp back would have it refused by the trigger,
-- silently, on any task another device had touched since.
--
-- The table is no longer written by the shell. Undo is local — see the note at
-- the foot of this file.

create table if not exists cascade_undo (
  owner        uuid primary key references auth.users(id) on delete cascade,
  action       text not null,
  task_id      uuid not null,
  prior_state  jsonb,
  created_at   timestamptz not null,
  created_at_offset text not null
);

alter table cascade_undo enable row level security;

drop policy if exists "undo select own" on cascade_undo;
create policy "undo select own" on cascade_undo
  for select to authenticated using (auth.uid() = owner);
drop policy if exists "undo write own" on cascade_undo;
create policy "undo write own" on cascade_undo
  for all to authenticated using (auth.uid() = owner) with check (auth.uid() = owner);

-- --------------------------------------------------------------- settings
--
-- `capacity_min_per_day` and `duplicate.threshold` are what a full day feels
-- like and how alike is too alike *to one person*. Three hours is his answer,
-- not everyone's. They stay in config as the value an account starts from, and
-- a row here overrides them; an account with no row uses the default rather
-- than nothing, so signing up is not a form to fill in before the app works.

create table if not exists cascade_settings (
  owner                uuid primary key references auth.users(id) on delete cascade,
  capacity_min_per_day integer,
  duplicate_threshold  numeric,
  updated_at           timestamptz not null default now(),

  constraint capacity_sane check (capacity_min_per_day is null or capacity_min_per_day between 15 and 1440),
  constraint threshold_ratio check (duplicate_threshold is null or duplicate_threshold between 0 and 1)
);

alter table cascade_settings enable row level security;

drop policy if exists "settings select own" on cascade_settings;
create policy "settings select own" on cascade_settings
  for select to authenticated using (auth.uid() = owner);
drop policy if exists "settings write own" on cascade_settings;
create policy "settings write own" on cascade_settings
  for all to authenticated using (auth.uid() = owner) with check (auth.uid() = owner);

-- ------------------------------------------------------------------ grants
--
-- Row-level security says *which rows*. It never says whether the role may
-- touch the table at all, and that is a separate grant. A project where the
-- grant is missing answers every call with `permission denied for table
-- cascade_task` no matter how correct the policies are, which reads like an
-- RLS problem and is not one.
--
-- Newer Supabase projects no longer hand the public schema to the API roles by
-- default, so the grants are stated here rather than assumed.
--
-- `authenticated` only. `anon` is the role of someone who has not signed in and
-- there is nothing here for them: no policy would let a row through anyway, and
-- a grant that can never be exercised is a grant to remove later under pressure.

grant usage on schema public to authenticated;

grant select, insert                         on cascade_config   to authenticated;
grant select, insert, update, delete         on cascade_task     to authenticated;
grant select, insert, update, delete         on cascade_undo     to authenticated;
grant select, insert, update, delete         on cascade_settings to authenticated;

-- --------------------------------------------------------------- live changes
--
-- The other device finds out without being asked. Realtime is the fast path and
-- never the only one: the store also pulls on reconnect, on the tab being looked
-- at again, and once a minute, because a dropped socket is silent and a task
-- that never arrived is indistinguishable from a task that was never made.
--
-- Row-level security still applies to the stream, so an account is sent its own
-- rows and no others.
-- Wrapped, because adding a table twice is an error and this file is meant to
-- be re-runnable whole.
do $$
begin
  alter publication supabase_realtime add table cascade_task;
exception
  when duplicate_object then null;
end;
$$;

-- -------------------------------------------------------------------- undo
--
-- `cascade_undo` above is no longer written by the shell, as of the session that
-- added sync. Undo is the previous state of a task on the device that changed
-- it: it has to work with no connection, which a row fetched over one cannot,
-- and pressing Undo on a phone should not reverse something done on a laptop an
-- hour ago. The table stays because the decision is reversible and dropping it
-- would take the rows with it.

-- ------------------------------------------------- for a project already made
--
-- Run these two once on a project created before `compare_key` came out. On a
-- fresh project they do nothing.
drop index if exists cascade_task_owner_compare;
alter table cascade_task drop column if exists compare_key;
