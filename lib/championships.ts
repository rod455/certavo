'use client';

import { getSupabase } from './supabase/client';
import { getAnonId } from './anon';
import { todayUtc } from './daily';

export type Format = 'points' | 'knockout';
export type Participant = { anon: string; nick: string | null; seed: number };
export type RoundMode = 'sudden_death' | 'time_attack';
export type Championship = {
  id: string;
  name: string;
  format: Format;
  theme_slug: string | null;
  round_mode: RoundMode;
  start_date: string;
};
export type Member = { anon_id: string; nick: string | null };

/** Add days to a YYYY-MM-DD date (UTC). */
export function addDaysUtc(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Pure scoring/bracket logic (no I/O — unit tested)
// ---------------------------------------------------------------------------

export type PointsRow = {
  rank: number;
  anon: string;
  nick: string | null;
  correct: number;
};

/** Points championship: total daily correct answers per player. */
export function computePoints(
  participants: Participant[],
  dailyCorrect: Record<string, number>, // `${anon}:${date}` -> correct
): PointsRow[] {
  const sum: Record<string, number> = {};
  for (const p of participants) sum[p.anon] = 0;
  for (const key of Object.keys(dailyCorrect)) {
    const anon = key.slice(0, key.indexOf(':'));
    if (anon in sum) sum[anon] += dailyCorrect[key];
  }
  return participants
    .map((p) => ({ anon: p.anon, nick: p.nick, correct: sum[p.anon] ?? 0 }))
    .sort((a, b) => b.correct - a.correct)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

export type KnockoutRound = {
  round: number;
  date: string;
  live: boolean;
  standings: { anon: string; nick: string | null; value: number }[];
  eliminated: { anon: string; nick: string | null } | null;
};
export type FinalPlayer = {
  anon: string;
  nick: string | null;
  sd: number;
  ta: number;
};
export type KnockoutState = {
  phase: 'pending' | 'rounds' | 'final' | 'finished';
  rounds: KnockoutRound[];
  alive: Participant[];
  eliminated: { anon: string; nick: string | null; round: number }[];
  final: { theme: string | null; players: FinalPlayer[] } | null;
  winner: { anon: string; nick: string | null } | null;
};

/**
 * Knockout: each PAST day the lowest scorer in the round game is eliminated
 * (ties → higher seed out) until 2 remain; then a final played in BOTH modes
 * (sudden death + time attack) on the theme — most legs won takes it, sudden
 * death breaks a 1-1. Today's round is "live" (no elimination yet).
 */
export function computeKnockout(opts: {
  startDate: string;
  today: string;
  theme: string | null;
  participants: Participant[];
  roundMetric: Record<string, number>; // `${anon}:${date}` -> best in round mode
  finalSD: Record<string, number>; // best sudden-death streak on theme
  finalTA: Record<string, number>; // best time-attack score on theme
}): KnockoutState {
  const dc = (anon: string, date: string) =>
    opts.roundMetric[`${anon}:${date}`] ?? 0;
  let alive = [...opts.participants].sort((a, b) => a.seed - b.seed);
  const rounds: KnockoutRound[] = [];
  const eliminated: KnockoutState['eliminated'] = [];

  if (opts.startDate > opts.today) {
    return { phase: 'pending', rounds, alive, eliminated, final: null, winner: null };
  }

  let round = 0;
  let date = opts.startDate;
  while (alive.length > 2 && date < opts.today) {
    const standings = alive
      .map((p) => ({ anon: p.anon, nick: p.nick, value: dc(p.anon, date) }))
      .sort((a, b) => b.value - a.value);
    let loser = alive[0];
    let worst = Infinity;
    let worstSeed = -1;
    for (const p of alive) {
      const c = dc(p.anon, date);
      if (c < worst || (c === worst && p.seed > worstSeed)) {
        worst = c;
        worstSeed = p.seed;
        loser = p;
      }
    }
    rounds.push({
      round,
      date,
      live: false,
      standings,
      eliminated: { anon: loser.anon, nick: loser.nick },
    });
    eliminated.push({ anon: loser.anon, nick: loser.nick, round });
    alive = alive.filter((p) => p.anon !== loser.anon);
    round++;
    date = addDaysUtc(date, 1);
  }

  if (alive.length > 2) {
    const standings = alive
      .map((p) => ({ anon: p.anon, nick: p.nick, value: dc(p.anon, opts.today) }))
      .sort((a, b) => b.value - a.value);
    rounds.push({ round, date: opts.today, live: true, standings, eliminated: null });
    return { phase: 'rounds', rounds, alive, eliminated, final: null, winner: null };
  }

  if (alive.length === 1) {
    return {
      phase: 'finished',
      rounds,
      alive,
      eliminated,
      final: null,
      winner: { anon: alive[0].anon, nick: alive[0].nick },
    };
  }

  // Final: both modes. Each finalist's best sudden-death streak + time-attack
  // score on the theme. Win a leg by being strictly higher; most legs wins;
  // sudden death breaks a 1-1. Decided only once both have played both modes.
  const players: FinalPlayer[] = alive.map((p) => ({
    anon: p.anon,
    nick: p.nick,
    sd: opts.finalSD[p.anon] ?? 0,
    ta: opts.finalTA[p.anon] ?? 0,
  }));
  let winner: KnockoutState['winner'] = null;
  let phase: KnockoutState['phase'] = 'final';
  const [a, b] = players;
  const bothPlayed = players.every((p) => p.sd > 0 && p.ta > 0);
  if (bothPlayed) {
    const legsA = (a.sd > b.sd ? 1 : 0) + (a.ta > b.ta ? 1 : 0);
    const legsB = (b.sd > a.sd ? 1 : 0) + (b.ta > a.ta ? 1 : 0);
    let champ: FinalPlayer | null = null;
    if (legsA !== legsB) champ = legsA > legsB ? a : b;
    else if (a.sd !== b.sd) champ = a.sd > b.sd ? a : b; // sudden death decides
    if (champ) {
      winner = { anon: champ.anon, nick: champ.nick };
      phase = 'finished';
    }
  }
  return { phase, rounds, alive, eliminated, final: { theme: opts.theme, players }, winner };
}

// ---------------------------------------------------------------------------
// Supabase I/O
// ---------------------------------------------------------------------------

export async function getGroupMembers(code: string): Promise<Member[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.rpc('get_group_members', { p_code: code });
  return (data as Member[]) ?? [];
}

export async function createChampionship(opts: {
  code: string;
  name: string;
  format: Format;
  theme: string | null;
  roundMode: RoundMode;
  members: Member[];
}): Promise<{ ok: boolean; id?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data, error } = await sb.rpc('create_championship', {
    p_code: opts.code,
    p_name: opts.name,
    p_format: opts.format,
    p_theme: opts.theme,
    p_round_mode: opts.roundMode,
    p_start: todayUtc(),
    p_anons: opts.members.map((m) => m.anon_id),
    p_nicks: opts.members.map((m) => m.nick ?? ''),
  });
  if (error || !data) return { ok: false };
  return data as { ok: boolean; id?: string };
}

export async function listChampionships(code: string): Promise<Championship[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.rpc('list_championships', { p_code: code });
  return (data as Championship[]) ?? [];
}

export async function getChampionship(id: string): Promise<Championship | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from('championships')
    .select('id, name, format, theme_slug, round_mode, start_date')
    .eq('id', id)
    .single();
  return (data as Championship) ?? null;
}

async function getParticipants(id: string): Promise<Participant[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('championship_participants')
    .select('anon_id, nick, seed')
    .eq('championship_id', id)
    .order('seed');
  return ((data as { anon_id: string; nick: string | null; seed: number }[]) ?? []).map(
    (r) => ({ anon: r.anon_id, nick: r.nick, seed: r.seed }),
  );
}

async function fetchDailyCorrect(
  anons: string[],
  startDate: string,
): Promise<Record<string, number>> {
  const sb = getSupabase();
  const map: Record<string, number> = {};
  if (!sb || anons.length === 0) return map;
  const { data } = await sb
    .from('scores')
    .select('anon_id, challenge_date, details')
    .eq('mode', 'daily')
    .in('anon_id', anons)
    .gte('challenge_date', startDate);
  for (const r of (data as { anon_id: string; challenge_date: string; details: { correctCount?: number } }[]) ?? []) {
    const key = `${r.anon_id}:${r.challenge_date}`;
    const c = Number(r.details?.correctCount ?? 0);
    map[key] = Math.max(map[key] ?? 0, c);
  }
  return map;
}

/** Best round-game metric per (anon, UTC day): streak for sudden death,
 *  score for time attack. */
async function fetchRoundMetric(
  anons: string[],
  mode: RoundMode,
  theme: string | null,
  startDate: string,
): Promise<Record<string, number>> {
  const sb = getSupabase();
  const map: Record<string, number> = {};
  if (!sb || !theme || anons.length === 0) return map;
  const { data } = await sb
    .from('scores')
    .select('anon_id, created_at, streak, score')
    .eq('mode', mode)
    .eq('theme_slug', theme)
    .in('anon_id', anons)
    .gte('created_at', `${startDate}T00:00:00Z`);
  for (const r of (data as { anon_id: string; created_at: string; streak: number | null; score: number | null }[]) ?? []) {
    const day = r.created_at.slice(0, 10);
    const key = `${r.anon_id}:${day}`;
    const v = Number((mode === 'sudden_death' ? r.streak : r.score) ?? 0);
    map[key] = Math.max(map[key] ?? 0, v);
  }
  return map;
}

/** Best single value (streak or score) per anon for a mode+theme. */
async function fetchBest(
  anons: string[],
  mode: RoundMode,
  theme: string | null,
  field: 'streak' | 'score',
): Promise<Record<string, number>> {
  const sb = getSupabase();
  const map: Record<string, number> = {};
  if (!sb || !theme || anons.length === 0) return map;
  const { data } = await sb
    .from('scores')
    .select(`anon_id, ${field}`)
    .eq('mode', mode)
    .eq('theme_slug', theme)
    .in('anon_id', anons);
  for (const r of (data as Record<string, unknown>[]) ?? []) {
    const anon = r.anon_id as string;
    map[anon] = Math.max(map[anon] ?? 0, Number(r[field] ?? 0));
  }
  return map;
}

export type ChampionshipView =
  | { format: 'points'; participants: Participant[]; rows: PointsRow[] }
  | { format: 'knockout'; participants: Participant[]; state: KnockoutState };

export async function loadChampionship(
  champ: Championship,
): Promise<ChampionshipView> {
  const participants = await getParticipants(champ.id);
  const anons = participants.map((p) => p.anon);
  if (champ.format === 'points') {
    const dailyCorrect = await fetchDailyCorrect(anons, champ.start_date);
    return { format: 'points', participants, rows: computePoints(participants, dailyCorrect) };
  }
  const [roundMetric, finalSD, finalTA] = await Promise.all([
    fetchRoundMetric(anons, champ.round_mode, champ.theme_slug, champ.start_date),
    fetchBest(anons, 'sudden_death', champ.theme_slug, 'streak'),
    fetchBest(anons, 'time_attack', champ.theme_slug, 'score'),
  ]);
  const state = computeKnockout({
    startDate: champ.start_date,
    today: todayUtc(),
    theme: champ.theme_slug,
    participants,
    roundMetric,
    finalSD,
    finalTA,
  });
  return { format: 'knockout', participants, state };
}

export function isMeWinner(winnerAnon: string | undefined): boolean {
  return !!winnerAnon && winnerAnon === getAnonId();
}
