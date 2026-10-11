-- Cascade Part A — migration for handing a task to another person (session 159).
--
-- NAMED FOR WHAT IT DOES, not for a config version, because the config did not
-- move: nothing here is a number this app reads at run time. Every other
-- migration in this project carried a config version because one had changed.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE INSTALLING BUILD 75.
--
-- Like every migration here it is written so that running it twice changes
-- nothing, because `schema.sql` opens with `create table if not exists` and
-- will therefore never alter a table that already exists.
--
-- ===========================================================================
-- THE ONE DECISION THIS WHOLE FEATURE RESTS ON: THE TASK NEVER MOVES.
--
-- `cascade_task` is locked to one owner by four policies, and the store, the
-- outbox and the newest-wins trigger all assume it. Letting a second person
-- read or own a row would reach into every one of those.
--
-- So a handover is a separate record. The sender writes an OFFER; the
-- recipient's app, on accepting, writes a task of its OWN; the sender's task is
-- then deleted. `cascade_task` keeps its rules exactly as they were, and the
-- offer is the only row two people can both see.
--
-- ADDRESSED BY EMAIL, WITH NO DIRECTORY. The obvious way to address a person is
-- a table of everyone's account id and email, which would let any signed-in
-- user list everybody using Cascade. Not needed: the offer carries the
-- recipient's email as TEXT, and the select policy compares it to the caller's
-- own email out of the JWT. Each person reads only what is addressed to them
-- and nobody can enumerate anyone. It also means an offer can be sent to
-- somebody who has not installed the app yet; it waits for them.

alter table cascade_task
  -- WHICH OFFER THIS TASK CAME FROM, empty on a task its owner typed. It is
  -- what lets the row say `from vishal@…`, and what lets the recipient's app
  -- tell the offer that the work is finished.
  add column if not exists offer_id text not null default '';

create index if not exists cascade_task_offer
  on cascade_task (owner, offer_id)
  where offer_id <> '';

create table if not exists cascade_offer (
  id            uuid primary key,

  -- WHO SENT IT. `from_owner` is the authority; `from_email` is so the
  -- recipient sees a name rather than a uuid, and is written by the sender.
  from_owner    uuid not null references auth.users(id) on delete cascade,
  from_email    text not null,

  -- WHO IT IS FOR, lower-cased, because an address is not case sensitive and a
  -- policy that compares text is.
  to_email      text not null,
  -- Filled on accept, from the accepter's own uid. Null until then, which is
  -- what makes an offer to somebody who has never signed in legal.
  to_owner      uuid,

  -- The sender's task, so the sending device can find it again.
  task_id       uuid not null,
  -- The recipient's new task, so the sending device can be told it is done.
  accepted_task_id uuid,

  -- THE TASK AS SENT, whole. Not a reference: the sender's row is deleted on
  -- accept, and a reference to a deleted row is not a record of anything.
  payload       jsonb not null,
  -- What the recipient changed before accepting, or null. Kept beside the
  -- payload rather than replacing it, because the sender is entitled to see
  -- what he sent as well as what came back.
  edited        jsonb,

  state         text not null default 'offered',
  decline_reason text,

  -- WHEN THE RECIPIENT FINISHED IT. The sender's `Given away` list reads this
  -- and nothing else: he cannot see their task, and does not need to.
  done_at       timestamptz,
  done_at_offset text,
  done_state    text,

  created_at    timestamptz not null,
  created_at_offset text not null,
  updated_at    timestamptz not null,
  updated_at_offset text not null,

  constraint offer_state_known check (state in ('offered','accepted','declined','withdrawn')),
  constraint offer_done_iff_accepted check (done_at is null or state = 'accepted'),
  constraint offer_accepted_has_owner check (state <> 'accepted' or to_owner is not null)
);

create index if not exists cascade_offer_to on cascade_offer (to_email, state);
create index if not exists cascade_offer_from on cascade_offer (from_owner, state);

alter table cascade_offer enable row level security;

-- READ: the sender, and whoever the address belongs to. Nobody else, and no
-- way to ask who else exists.
drop policy if exists "offer select mine" on cascade_offer;
create policy "offer select mine" on cascade_offer
  for select to authenticated using (
    auth.uid() = from_owner
    or lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- WRITE: only as yourself. A row claiming to be from somebody else is refused
-- by the database rather than by the app.
drop policy if exists "offer insert own" on cascade_offer;
create policy "offer insert own" on cascade_offer
  for insert to authenticated with check (auth.uid() = from_owner);

drop policy if exists "offer update mine" on cascade_offer;
create policy "offer update mine" on cascade_offer
  for update to authenticated using (
    auth.uid() = from_owner
    or lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) with check (
    auth.uid() = from_owner
    or lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "offer delete own" on cascade_offer;
create policy "offer delete own" on cascade_offer
  for delete to authenticated using (auth.uid() = from_owner);

-- ===========================================================================
-- WHO MAY CHANGE WHAT, ENFORCED HERE AND NOT IN THE APP.
--
-- Row-level security can say WHO may write the row. It cannot say which
-- COLUMNS, and the two people on an offer are allowed opposite things: the
-- sender may withdraw it and may never touch the answer; the recipient may
-- answer it and may never rewrite what was sent. A trigger is the only place
-- that distinction can be stated once and be true for every client.
--
-- The newest-wins trigger on `cascade_task` is the precedent: a rule a client
-- could get wrong by being written wrong belongs in the database.

-- `security invoker`, which is the default and is said here by leaving it off:
-- the guard must see the CALLER's identity, and a definer-rights function that
-- then asks `auth.uid()` is one misreading away from checking the wrong person.
create or replace function cascade_offer_guard() returns trigger
language plpgsql as $$
declare
  me_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  is_sender boolean := auth.uid() = old.from_owner;
  is_recipient boolean := lower(old.to_email) = me_email and me_email <> '';
begin
  -- An answered offer is answered. Only the done marks may move after that,
  -- and only by the person doing the work.
  if old.state <> 'offered' then
    if old.state = 'accepted' and is_recipient
       and new.state = 'accepted'
       and new.payload is not distinct from old.payload
       and new.to_email is not distinct from old.to_email then
      return new;
    end if;
    raise exception 'cascade_offer: % is settled', old.state;
  end if;

  if is_sender and not is_recipient then
    -- The sender may take it back, and nothing else. Re-addressing it is a new
    -- offer, not an edit of this one, because the person it was shown to
    -- already read it.
    if new.state not in ('offered','withdrawn') then
      raise exception 'cascade_offer: the sender may only withdraw';
    end if;
    if new.to_email is distinct from old.to_email then
      raise exception 'cascade_offer: send a new offer rather than readdressing this one';
    end if;
    return new;
  end if;

  if is_recipient then
    -- The recipient answers. He may hand back an edited copy, and may never
    -- alter the record of what was actually sent.
    if new.state not in ('accepted','declined') then
      raise exception 'cascade_offer: the recipient may only accept or decline';
    end if;
    if new.payload is distinct from old.payload then
      raise exception 'cascade_offer: payload is what was sent and cannot be rewritten';
    end if;
    if new.from_owner is distinct from old.from_owner
       or new.to_email is distinct from old.to_email then
      raise exception 'cascade_offer: an offer cannot change who it is between';
    end if;
    return new;
  end if;

  raise exception 'cascade_offer: not yours';
end;
$$;

drop trigger if exists cascade_offer_guard on cascade_offer;
create trigger cascade_offer_guard
  before update on cascade_offer
  for each row execute function cascade_offer_guard();

grant select, insert, update, delete on cascade_offer to authenticated;
