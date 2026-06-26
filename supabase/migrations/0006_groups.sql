-- F1 social: friend leagues (groups) + weekly ranking among members.
-- Identity stays light: membership is keyed on the anonymous id + a nick.
-- All access goes through SECURITY DEFINER RPCs (tables stay RLS-locked).

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  invite_code text unique not null,
  owner_anon text,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  anon_id text not null,
  nick text,
  joined_at timestamptz default now(),
  primary key (group_id, anon_id)
);

create index if not exists group_members_anon_idx on group_members (anon_id);

alter table groups enable row level security;
alter table group_members enable row level security;
-- No public policies: access is only via the RPCs below.

-- Create a group and add the creator as the first member.
create or replace function create_group(p_name text, p_anon text, p_nick text, p_icon text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into groups (name, icon, invite_code, owner_anon)
  values (left(p_name, 40), p_icon, v_code, p_anon)
  returning id into v_id;
  insert into group_members (group_id, anon_id, nick)
  values (v_id, p_anon, nullif(trim(p_nick), ''));
  return jsonb_build_object('ok', true, 'id', v_id, 'code', v_code);
end; $$;

-- Join a group by its invite code.
create or replace function join_group(p_code text, p_anon text, p_nick text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text;
begin
  select id, name into v_id, v_name from groups where invite_code = upper(trim(p_code));
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  insert into group_members (group_id, anon_id, nick)
  values (v_id, p_anon, nullif(trim(p_nick), ''))
  on conflict (group_id, anon_id) do update
    set nick = coalesce(excluded.nick, group_members.nick);
  return jsonb_build_object('ok', true, 'id', v_id, 'name', v_name, 'code', upper(trim(p_code)));
end; $$;

-- Group summary (and whether the caller is a member).
create or replace function get_group(p_code text, p_anon text default null)
returns jsonb language sql security definer stable set search_path = public as $$
  select case when g.id is null then jsonb_build_object('ok', false)
    else jsonb_build_object(
      'ok', true, 'id', g.id, 'name', g.name, 'icon', g.icon, 'code', g.invite_code,
      'memberCount', (select count(*) from group_members m where m.group_id = g.id),
      'isMember', exists(select 1 from group_members m where m.group_id = g.id and m.anon_id = p_anon)
    ) end
  from (select * from groups where invite_code = upper(trim(p_code))) g
  right join (select 1) _ on true;
$$;

-- Groups the caller belongs to.
create or replace function my_groups(p_anon text)
returns table (id uuid, name text, icon text, code text, member_count bigint)
language sql security definer stable set search_path = public as $$
  select g.id, g.name, g.icon, g.invite_code,
    (select count(*) from group_members m2 where m2.group_id = g.id)
  from group_members m
  join groups g on g.id = m.group_id
  where m.anon_id = p_anon
  order by g.created_at desc;
$$;

-- Weekly league: total points each member scored in the last 7 days.
create or replace function get_group_leaderboard(p_code text)
returns table (rank bigint, name text, points bigint)
language sql security definer stable set search_path = public as $$
  with grp as (select id from groups where invite_code = upper(trim(p_code))),
  member_points as (
    select m.anon_id, m.nick,
      coalesce((
        select sum(s.score) from scores s
        where s.anon_id = m.anon_id and s.created_at >= now() - interval '7 days'
      ), 0) as points
    from group_members m
    where m.group_id = (select id from grp)
  )
  select row_number() over (order by points desc, nick) as rank,
    coalesce(nick, 'Anon') as name, points
  from member_points
  order by points desc, nick;
$$;

grant execute on function create_group(text, text, text, text) to anon, authenticated;
grant execute on function join_group(text, text, text) to anon, authenticated;
grant execute on function get_group(text, text) to anon, authenticated;
grant execute on function my_groups(text) to anon, authenticated;
grant execute on function get_group_leaderboard(text) to anon, authenticated;
