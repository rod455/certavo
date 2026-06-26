'use client';

import type { GameResult } from './types';
import { getSupabase } from './supabase/client';
import { getAnonId } from './anon';

export type LeaderboardRow = {
  rank: number;
  name: string | null;
  score: number;
  streak: number | null;
};

/**
 * Submit a score for ranking. Goes through the `submit_score` RPC/Edge Function
 * which revalidates the result server-side (recomputes the daily selection,
 * checks `details`, rate-limits). A direct table INSERT is blocked by RLS.
 *
 * No-op when the backend isn't configured — the game stays fully playable
 * offline.
 */
export type SubmitResult = { ok: boolean; rank?: number; score?: number };

export async function submitScore(
  result: GameResult,
  nick?: string,
): Promise<SubmitResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  try {
    // Call the SECURITY DEFINER RPC directly — it revalidates the result
    // server-side and inserts, so no Edge Function is needed.
    const { data, error } = await supabase.rpc('validate_and_insert_score', {
      payload: {
        anon_id: getAnonId(),
        nick: nick?.trim() || null,
        mode: result.mode,
        theme_slug: result.themeSlug,
        challenge_date: result.challengeDate ?? null,
        score: result.score,
        streak: result.streak,
        details: {
          answers: result.answers,
          correctCount: result.correctCount,
          total: result.total,
          durationMs: result.durationMs,
        },
      },
    });
    if (error) return { ok: false };
    const d = (data ?? {}) as { ok?: boolean; rank?: number; score?: number };
    return { ok: d.ok !== false, rank: d.rank, score: d.score };
  } catch {
    return { ok: false };
  }
}

export async function getLeaderboard(
  mode: string,
  period: 'daily' | 'weekly' | 'all',
): Promise<LeaderboardRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_mode: mode,
      p_period: period,
    });
    if (error || !data) return [];
    return data as LeaderboardRow[];
  } catch {
    return [];
  }
}
