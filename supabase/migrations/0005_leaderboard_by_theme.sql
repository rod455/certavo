-- Per-theme + per-mode leaderboard. Adds an optional theme filter.
-- (Daily passes null — everyone plays the same daily edition.)

drop function if exists get_leaderboard(text, text);

create or replace function get_leaderboard(
  p_mode text,
  p_period text,
  p_theme text default null
)
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
      and (p_theme is null or s.theme_slug = p_theme)
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

grant execute on function get_leaderboard(text, text, text) to anon, authenticated;
