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
