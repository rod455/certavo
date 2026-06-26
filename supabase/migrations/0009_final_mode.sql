-- 0009_final_mode.sql
-- The knockout Final is a single hybrid game: 60 seconds on the clock AND
-- sudden death (one miss ends it). Whoever answers the most correctly wins.
-- It is submitted as mode = 'final'; the metric we read back is `streak`
-- (the run of correct answers), which the recompute below already produces.
--
-- This only widens the allowed-mode guard in validate_and_insert_score so
-- 'final' submissions are accepted; the rest of the function is unchanged.
-- The public leaderboard RPCs are intentionally NOT widened — the Final is a
-- private championship game, not a global board.

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
  if v_mode not in ('daily', 'time_attack', 'sudden_death', 'final') then
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
  v_metric := case when v_mode in ('sudden_death', 'final') then v_streak else v_score end;

  with windowed as (
    select coalesce(user_id::text, anon_id) as player,
           case when v_mode in ('sudden_death', 'final') then coalesce(streak, 0) else score end as metric
    from scores s
    where s.mode = v_mode
      and (
        (v_mode = 'daily' and s.challenge_date = v_date)
        or (v_mode = 'time_attack' and s.created_at >= now() - interval '7 days')
        or (v_mode = 'sudden_death')
        or (v_mode = 'final' and s.theme_slug = v_theme)
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

revoke all on function validate_and_insert_score(jsonb) from public;
grant execute on function validate_and_insert_score(jsonb) to anon, authenticated, service_role;
