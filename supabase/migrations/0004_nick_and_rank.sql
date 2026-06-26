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
