-- Cascade Part A — migration for refusing tasks from an address (session 161).
--
-- RUN THIS IN THE SUPABASE SQL EDITOR. It and `migrate_offers.sql` can be run
-- in either order, and both must be run before the hand-off screens work.
--
-- `migrate_offers.sql` WAS NOT CHANGED to carry this table. It was already
-- handed over with its checksum quoted, and editing a file somebody may paste
-- at any moment is how a half-run migration happens. Two files, both idempotent.
--
-- Like every migration here, running it twice changes nothing: `schema.sql`
-- opens with `create table if not exists` and so never alters a table that
-- already exists, which is why a new column or table always needs its own file.
--
-- ===========================================================================
-- WHY THIS IS IN THE DATABASE WHEN THE CONTACT NAMES ARE NOT.
--
-- The names he gives addresses live on his phone and nowhere else: a nickname
-- is a convenience, and losing it costs a retype.
--
-- A BLOCK IS A BOUNDARY. One that evaporates when storage is cleared, or that
-- is simply absent when he signs in on a second phone, is not a boundary — it
-- is a setting that happened to work once. So it follows the account.
--
-- IT IS ALSO NOT A DIRECTORY, and the shape is what keeps it from becoming
-- one. One row says "this owner will not take tasks from this address". It
-- cannot be read by anybody else, it names no account id but the owner's own,
-- and a blocked sender is never told — so nothing here can be asked who uses
-- Cascade, or who has blocked whom.

create table if not exists cascade_block (
  owner      uuid not null references auth.users(id) on delete cascade,
  -- LOWER-CASED BY THE APP AND BY THE PRIMARY KEY'S REACH. An address is not
  -- case sensitive and a text comparison is, so `block.js` normalises on the
  -- way in and every read compares normalised values.
  email      text not null,

  created_at timestamptz not null,
  -- The offset beside its instant, as every other table here stores one: the
  -- column is UTC and this says what local reading produced it.
  created_at_offset text not null,

  -- ONE ROW PER ADDRESS PER PERSON. Blocking twice is not two blocks, and the
  -- key says so rather than the app remembering to check.
  primary key (owner, email)
);

alter table cascade_block enable row level security;

-- ONLY YOUR OWN, FOR EVERY VERB. There is no case in which one person reads
-- another's block list, so there is no policy that would let them.
drop policy if exists "block select own" on cascade_block;
create policy "block select own" on cascade_block
  for select to authenticated using (auth.uid() = owner);

drop policy if exists "block insert own" on cascade_block;
create policy "block insert own" on cascade_block
  for insert to authenticated with check (auth.uid() = owner);

drop policy if exists "block delete own" on cascade_block;
create policy "block delete own" on cascade_block
  for delete to authenticated using (auth.uid() = owner);

-- NO UPDATE POLICY, AND THAT IS THE DESIGN. A block has nothing to change: the
-- address is half the key and the date is a fact. Unblocking is a delete.
-- A verb with no legitimate use gets no policy rather than a policy nobody
-- calls, so RLS refuses it rather than the app remembering not to.

grant select, insert, delete on cascade_block to authenticated;
