-- F2 social: championships inside a group.
--  - 'points'   : ranking by daily correct answers over the championship window.
--  - 'knockout' : daily elimination (lowest daily correct is out) until 2 remain,
--                 then a sudden-death final on a theme. The bracket is computed
--                 client-side from the (publicly readable) scores table.

create table if not exists championships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  format text not null,            -- points | knockout
  theme_slug text,                 -- final theme (knockout) / scope
  start_date date not null,
  created_at timestamptz default now()
);

create table if not exists championship_participants (
  championship_id uuid references championships(id) on delete cascade,
  anon_id text not null,
  nick text,
  seed int,
  primary key (championship_id, anon_id)
);

-- Read is public (a game, not sensitive); writes go through the RPC below.
alter table championships enable row level security;
alter table championship_participants enable row level security;
drop policy if exists "champ read" on championships;
create policy "champ read" on championships for select using (true);
drop policy if exists "champ part read" on championship_participants;
create policy "champ part read" on championship_participants for select using (true);

-- List a group's members (used to pick championship participants).
create or replace function get_group_members(p_code text)
returns table (anon_id text, nick text)
language sql security definer stable set search_path = public as $$
  select m.anon_id, m.nick
  from group_members m
  join groups g on g.id = m.group_id
  where g.invite_code = upper(trim(p_code))
  order by m.joined_at;
$$;

create or replace function create_championship(
  p_code text, p_name text, p_format text, p_theme text,
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
  insert into championships (group_id, name, format, theme_slug, start_date)
  values (v_group, left(p_name, 40), p_format, p_theme,
          coalesce(p_start, (now() at time zone 'utc')::date))
  returning id into v_id;
  insert into championship_participants (championship_id, anon_id, nick, seed)
  select v_id, t.anon, t.nick, row_number() over (order by random())
  from unnest(p_anons, p_nicks) as t(anon, nick);
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

create or replace function list_championships(p_code text)
returns table (id uuid, name text, format text, theme_slug text, start_date date)
language sql security definer stable set search_path = public as $$
  select c.id, c.name, c.format, c.theme_slug, c.start_date
  from championships c
  join groups g on g.id = c.group_id
  where g.invite_code = upper(trim(p_code))
  order by c.created_at desc;
$$;

grant execute on function get_group_members(text) to anon, authenticated;
grant execute on function create_championship(text, text, text, text, date, text[], text[]) to anon, authenticated;
grant execute on function list_championships(text) to anon, authenticated;
