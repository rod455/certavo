-- Knockout: the per-round game is configurable (sudden_death | time_attack),
-- and the final is played in BOTH modes.

alter table championships add column if not exists round_mode text default 'sudden_death';

drop function if exists create_championship(text, text, text, text, date, text[], text[]);

create or replace function create_championship(
  p_code text, p_name text, p_format text, p_theme text, p_round_mode text,
  p_start date, p_anons text[], p_nicks text[]
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_group uuid; v_id uuid;
begin
  select id into v_group from groups where invite_code = upper(trim(p_code));
  if v_group is null then return jsonb_build_object('ok', false, 'error', 'group_not_found'); end if;
  if p_format not in ('points', 'knockout') then
    return jsonb_build_object('ok', false, 'error', 'bad_format');
  end if;
  if coalesce(array_length(p_anons, 1), 0) < 2 then
    return jsonb_build_object('ok', false, 'error', 'need_2_players');
  end if;
  insert into championships (group_id, name, format, theme_slug, round_mode, start_date)
  values (v_group, left(p_name, 40), p_format, p_theme,
          coalesce(nullif(p_round_mode, ''), 'sudden_death'),
          coalesce(p_start, (now() at time zone 'utc')::date))
  returning id into v_id;
  insert into championship_participants (championship_id, anon_id, nick, seed)
  select v_id, t.anon, t.nick, row_number() over (order by random())
  from unnest(p_anons, p_nicks) as t(anon, nick);
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

drop function if exists list_championships(text);

create or replace function list_championships(p_code text)
returns table (id uuid, name text, format text, theme_slug text, round_mode text, start_date date)
language sql security definer stable set search_path = public as $$
  select c.id, c.name, c.format, c.theme_slug, c.round_mode, c.start_date
  from championships c
  join groups g on g.id = c.group_id
  where g.invite_code = upper(trim(p_code))
  order by c.created_at desc;
$$;

grant execute on function create_championship(text, text, text, text, text, date, text[], text[]) to anon, authenticated;
grant execute on function list_championships(text) to anon, authenticated;
