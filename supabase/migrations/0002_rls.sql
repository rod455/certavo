-- Row Level Security: public can READ content and the leaderboard, but cannot
-- write scores directly — submissions go through submit_score() (SECURITY
-- DEFINER) which revalidates the result server-side.

alter table themes enable row level security;
alter table packs enable row level security;
alter table questions enable row level security;
alter table profiles enable row level security;
alter table scores enable row level security;

-- Content: public read of active rows; writes only via service role.
drop policy if exists "content read themes" on themes;
create policy "content read themes" on themes
  for select using (is_active);

drop policy if exists "content read packs" on packs;
create policy "content read packs" on packs
  for select using (is_active);

drop policy if exists "content read questions" on questions;
create policy "content read questions" on questions
  for select using (true);

-- Profiles: a user can read/update only their own profile.
drop policy if exists "own profile read" on profiles;
create policy "own profile read" on profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile upsert" on profiles;
create policy "own profile upsert" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles
  for update using (auth.uid() = id);

-- Scores: readable by everyone (leaderboard); NO public insert/update/delete.
-- Inserts happen only inside submit_score() which runs as definer.
drop policy if exists "scores public read" on scores;
create policy "scores public read" on scores
  for select using (true);
