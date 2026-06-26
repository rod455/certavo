'use client';

import { getSupabase } from './supabase/client';
import { getAnonId, getNick } from './anon';

export type GroupSummary = {
  ok: boolean;
  id?: string;
  name?: string;
  icon?: string | null;
  code?: string;
  memberCount?: number;
  isMember?: boolean;
};

export type MyGroup = {
  id: string;
  name: string;
  icon: string | null;
  code: string;
  member_count: number;
};

export type GroupRow = { rank: number; name: string | null; points: number };

export async function createGroup(
  name: string,
  icon?: string,
): Promise<{ ok: boolean; code?: string; id?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data, error } = await sb.rpc('create_group', {
    p_name: name,
    p_anon: getAnonId(),
    p_nick: getNick(),
    p_icon: icon ?? null,
  });
  if (error || !data) return { ok: false };
  return data as { ok: boolean; code?: string; id?: string };
}

export async function joinGroup(
  code: string,
): Promise<{ ok: boolean; name?: string; code?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data, error } = await sb.rpc('join_group', {
    p_code: code,
    p_anon: getAnonId(),
    p_nick: getNick(),
  });
  if (error || !data) return { ok: false };
  return data as { ok: boolean; name?: string; code?: string };
}

export async function getGroup(code: string): Promise<GroupSummary> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data, error } = await sb.rpc('get_group', {
    p_code: code,
    p_anon: getAnonId(),
  });
  if (error || !data) return { ok: false };
  return data as GroupSummary;
}

export async function myGroups(): Promise<MyGroup[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('my_groups', { p_anon: getAnonId() });
  if (error || !data) return [];
  return data as MyGroup[];
}

export async function getGroupLeaderboard(code: string): Promise<GroupRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('get_group_leaderboard', { p_code: code });
  if (error || !data) return [];
  return data as GroupRow[];
}
