-- Certavo — core content + scoring schema.
-- Hierarchy: themes -> packs -> questions. Adding a category = inserting data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null,                       -- { pt, en, es }
  icon text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists packs (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references themes(id) on delete cascade,
  slug text not null,
  name jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (theme_id, slug)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,                    -- stable id from the generators
  pack_id uuid references packs(id) on delete cascade,
  media_type text not null default 'none',    -- none|flag|image|emoji
  media_value text,
  prompt jsonb not null,                       -- { pt, en, es }
  options jsonb not null,                      -- { pt:[4], en:[4], es:[4] }
  option_media jsonb,                          -- optional per-option media
  correct_index int not null check (correct_index between 0 and 3),
  difficulty int not null default 1,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Players (optional — the game runs without login)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Scores / ranking
-- ---------------------------------------------------------------------------
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- null = anon
  anon_id text,
  nick text,                                   -- chosen display name for anon
  mode text not null,                          -- daily|time_attack|sudden_death
  theme_slug text,
  challenge_date date,
  score int not null,
  streak int,
  details jsonb,                               -- answers, for validation/grid
  created_at timestamptz default now()
);

create index if not exists scores_mode_date_idx on scores (mode, challenge_date);
create index if not exists scores_mode_theme_idx on scores (mode, theme_slug, created_at);

-- One daily submission per anonymous player.
create unique index if not exists scores_daily_anon_uniq
  on scores (anon_id, challenge_date)
  where mode = 'daily' and anon_id is not null;
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
-- Leaderboard RPC (public, read-only) + a server-side validation helper used
-- by the submit_score Edge Function.

-- get_leaderboard(mode, period) → ranked rows for daily / weekly / all-time.
-- Best score per player within the window; ties broken by streak then time.
create or replace function get_leaderboard(p_mode text, p_period text)
returns table (rank bigint, name text, score int, streak int)
language sql
stable
security definer
set search_path = public
as $$
  with windowed as (
    select s.*
    from scores s
    where s.mode = p_mode
      and (
        (p_period = 'daily'  and s.challenge_date = (now() at time zone 'utc')::date)
        or (p_period = 'weekly' and s.created_at >= now() - interval '7 days')
        or (p_period = 'all')
      )
  ),
  best as (
    select
      coalesce(w.user_id::text, w.anon_id) as player,
      max(w.score) as score,
      max(coalesce(w.streak, 0)) as streak
    from windowed w
    where coalesce(w.user_id::text, w.anon_id) is not null
    group by 1
  ),
  named as (
    select
      b.score,
      b.streak,
      coalesce(p.display_name, null) as name
    from best b
    left join profiles p
      on p.id::text = b.player
  )
  select
    row_number() over (order by n.score desc, n.streak desc) as rank,
    n.name,
    n.score,
    n.streak
  from named n
  order by n.score desc, n.streak desc
  limit 100;
$$;

grant execute on function get_leaderboard(text, text) to anon, authenticated;

-- validate_and_insert_score: recomputes correctness from the questions table
-- (anti-cheat) and inserts as the table owner, bypassing the no-insert RLS.
-- Called by the submit_score Edge Function (service role) or directly via RPC.
create or replace function validate_and_insert_score(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode text := payload->>'mode';
  v_anon text := payload->>'anon_id';
  v_theme text := payload->>'theme_slug';
  v_date date := nullif(payload->>'challenge_date', '')::date;
  v_details jsonb := coalesce(payload->'details', '{}'::jsonb);
  v_answers jsonb := coalesce(v_details->'answers', '[]'::jsonb);
  v_server_correct int := 0;
  v_total int := 0;
  v_score int := 0;
  v_combo int := 0;
  ans jsonb;
  q record;
  v_recent int;
begin
  if v_mode not in ('daily', 'time_attack', 'sudden_death') then
    return jsonb_build_object('ok', false, 'error', 'invalid_mode');
  end if;

  -- Rate limit: at most 30 submissions / anon / hour.
  select count(*) into v_recent
  from scores
  where anon_id = v_anon and created_at > now() - interval '1 hour';
  if v_recent > 30 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- Recompute score/correctness from stored questions (trust the server).
  for ans in select * from jsonb_array_elements(v_answers)
  loop
    v_total := v_total + 1;
    select correct_index into q
    from questions
    where external_id = ans->>'questionId'
    limit 1;
    if found and (ans->>'chosenIndex')::int = q.correct_index then
      v_server_correct := v_server_correct + 1;
      v_combo := v_combo + 1;
      v_score := v_score + round(100 * (1 + least(v_combo - 1, 9) * 0.25));
    else
      v_combo := 0;
    end if;
  end loop;

  insert into scores (anon_id, mode, theme_slug, challenge_date, score, streak, details)
  values (
    v_anon, v_mode, v_theme, v_date, v_score, v_server_correct,
    jsonb_build_object('correctCount', v_server_correct, 'total', v_total)
  )
  on conflict do nothing;

  return jsonb_build_object('ok', true, 'score', v_score, 'correct', v_server_correct);
end;
$$;

revoke all on function validate_and_insert_score(jsonb) from public;
grant execute on function validate_and_insert_score(jsonb) to service_role;
-- Per-mode leaderboard with nicknames + rank returned on submit.
-- Safe to run on an existing database (idempotent column add + or-replace fns).

alter table scores add column if not exists nick text;

-- Leaderboard: best per player within the window, ordered by the mode's metric
-- (sudden_death → streak, otherwise score). Shows the player's chosen nick.
create or replace function get_leaderboard(p_mode text, p_period text)
returns table (rank bigint, name text, score int, streak int)
language sql
stable
security definer
set search_path = public
as $$
  with windowed as (
    select s.*, coalesce(s.user_id::text, s.anon_id) as player
    from scores s
    where s.mode = p_mode
      and (
        (p_period = 'daily'  and s.challenge_date = (now() at time zone 'utc')::date)
        or (p_period = 'weekly' and s.created_at >= now() - interval '7 days')
        or (p_period = 'all')
      )
  ),
  best as (
    select
      w.player,
      max(w.score) as score,
      max(coalesce(w.streak, 0)) as streak,
      (array_agg(w.nick order by w.created_at desc)
        filter (where w.nick is not null))[1] as nick
    from windowed w
    where w.player is not null
    group by w.player
  ),
  named as (
    select b.score, b.streak, coalesce(b.nick, p.display_name) as name
    from best b
    left join profiles p on p.id::text = b.player
  )
  select
    row_number() over (
      order by case when p_mode = 'sudden_death' then n.streak else n.score end desc
    ) as rank,
    n.name, n.score, n.streak
  from named n
  order by case when p_mode = 'sudden_death' then n.streak else n.score end desc
  limit 100;
$$;

grant execute on function get_leaderboard(text, text) to anon, authenticated;

-- Validate, store (with nick), and return the player's rank.
create or replace function validate_and_insert_score(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode text := payload->>'mode';
  v_anon text := payload->>'anon_id';
  v_nick text := nullif(trim(payload->>'nick'), '');
  v_theme text := payload->>'theme_slug';
  v_date date := nullif(payload->>'challenge_date', '')::date;
  v_answers jsonb := coalesce(payload->'details'->'answers', '[]'::jsonb);
  v_correct int := 0;
  v_total int := 0;
  v_score int := 0;
  v_streak int := 0;
  v_combo int := 0;
  v_metric int;
  v_rank int;
  v_recent int;
  ans jsonb;
  v_correct_idx int;
begin
  if v_mode not in ('daily', 'time_attack', 'sudden_death') then
    return jsonb_build_object('ok', false, 'error', 'invalid_mode');
  end if;

  select count(*) into v_recent
  from scores where anon_id = v_anon and created_at > now() - interval '1 hour';
  if v_recent > 60 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- Recompute the score from stored questions (anti-cheat).
  for ans in select * from jsonb_array_elements(v_answers) loop
    v_total := v_total + 1;
    select correct_index into v_correct_idx
    from questions where external_id = ans->>'questionId' limit 1;
    if found and (ans->>'chosenIndex')::int = v_correct_idx then
      v_correct := v_correct + 1;
      v_combo := v_combo + 1;
      if v_combo > v_streak then v_streak := v_combo; end if;
      v_score := v_score + round(100 * (1 + least(v_combo - 1, 9) * 0.25));
    else
      v_combo := 0;
    end if;
  end loop;

  insert into scores (anon_id, nick, mode, theme_slug, challenge_date, score, streak, details)
  values (v_anon, v_nick, v_mode, v_theme, v_date, v_score, v_streak,
          jsonb_build_object('correctCount', v_correct, 'total', v_total))
  on conflict do nothing;

  -- Rank = 1 + players whose best metric beats this score in the same window.
  v_metric := case when v_mode = 'sudden_death' then v_streak else v_score end;

  with windowed as (
    select coalesce(user_id::text, anon_id) as player,
           case when v_mode = 'sudden_death' then coalesce(streak, 0) else score end as metric
    from scores s
    where s.mode = v_mode
      and (
        (v_mode = 'daily' and s.challenge_date = v_date)
        or (v_mode = 'time_attack' and s.created_at >= now() - interval '7 days')
        or (v_mode = 'sudden_death')
      )
  ),
  best as (
    select player, max(metric) as metric from windowed where player is not null group by player
  )
  select 1 + count(*) into v_rank from best where metric > v_metric;

  return jsonb_build_object(
    'ok', true, 'score', v_score, 'streak', v_streak,
    'correct', v_correct, 'rank', v_rank
  );
end;
$$;

-- The function is SECURITY DEFINER and revalidates everything (recomputes the
-- score, rate-limits), so it is safe to expose to anon as the write gateway —
-- direct INSERTs into scores stay blocked by RLS. This avoids needing an Edge
-- Function for submission.
revoke all on function validate_and_insert_score(jsonb) from public;
grant execute on function validate_and_insert_score(jsonb) to anon, authenticated, service_role;
