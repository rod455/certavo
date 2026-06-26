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
  correct: number; // best correct answers in the Final (1 min, sudden death)
  played: boolean;
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
 * (ties → higher seed out) until 2 remain; then a single Final on the theme —
 * one minute on the clock AND sudden death (one miss ends it). Whoever answers
 * the most correctly (without missing) wins; a tie goes to the lower seed.
 * Today's round is "live" (no elimination yet).
 */
export function computeKnockout(opts: {
  startDate: string;
  today: string;
  theme: string | null;
  participants: Participant[];
  roundMetric: Record<string, number>; // `${anon}:${date}` -> best in round mode
  finalScore: Record<string, number>; // best correct in the Final on theme
  finalPlayed: Record<string, boolean>; // has played the Final at least once
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

  // Final: one hybrid game — 60s + sudden death. Each finalist's best run of
  // correct answers. Most correct wins; ties go to the lower seed. Decided only
  // once BOTH finalists have played the Final at least once.
  const players: FinalPlayer[] = alive
    .map((p) => ({
      anon: p.anon,
      nick: p.nick,
      correct: opts.finalScore[p.anon] ?? 0,
      played: opts.finalPlayed[p.anon] === true,
    }))
    .sort((x, y) => y.correct - x.correct);
  let winner: KnockoutState['winner'] = null;
  let phase: KnockoutState['phase'] = 'final';
  const bothPlayed = players.every((p) => p.played);
  if (bothPlayed) {
    const [pa, pb] = alive; // alive keeps seed order
    const ca = opts.finalScore[pa.anon] ?? 0;
    const cb = opts.finalScore[pb.anon] ?? 0;
    // higher correct wins; tie → lower seed (the earlier-drawn finalist)
    const champ = ca !== cb ? (ca > cb ? pa : pb) : pa.seed <= pb.seed ? pa : pb;
    winner = { anon: champ.anon, nick: champ.nick };
    phase = 'finished';
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

/**
 * The Final results per anon on a theme: best correct run (stored as `streak`
 * in the sudden-death-style Final) and whether they've played it at all.
 */
async function fetchFinalResults(
  anons: string[],
  theme: string | null,
): Promise<{ score: Record<string, number>; played: Record<string, boolean> }> {
  const sb = getSupabase();
  const score: Record<string, number> = {};
  const played: Record<string, boolean> = {};
  if (!sb || !theme || anons.length === 0) return { score, played };
  const { data } = await sb
    .from('scores')
    .select('anon_id, streak')
    .eq('mode', 'final')
    .eq('theme_slug', theme)
    .in('anon_id', anons);
  for (const r of (data as { anon_id: string; streak: number | null }[]) ?? []) {
    played[r.anon_id] = true;
    score[r.anon_id] = Math.max(score[r.anon_id] ?? 0, Number(r.streak ?? 0));
  }
  return { score, played };
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
  const [roundMetric, final] = await Promise.all([
    fetchRoundMetric(anons, champ.round_mode, champ.theme_slug, champ.start_date),
    fetchFinalResults(anons, champ.theme_slug),
  ]);
  const state = computeKnockout({
    startDate: champ.start_date,
    today: todayUtc(),
    theme: champ.theme_slug,
    participants,
    roundMetric,
    finalScore: final.score,
    finalPlayed: final.played,
  });
  return { format: 'knockout', participants, state };
}

export function isMeWinner(winnerAnon: string | undefined): boolean {
  return !!winnerAnon && winnerAnon === getAnonId();
}
