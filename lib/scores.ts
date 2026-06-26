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
export async function submitScore(result: GameResult): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.functions.invoke('submit_score', {
      body: {
        anon_id: getAnonId(),
        mode: result.mode,
        theme_slug: result.themeSlug,
        challenge_date: result.challengeDate ?? null,
        score: result.score,
        streak: result.streak,
        details: { answers: result.answers, correctCount: result.correctCount },
      },
    });
    return !error;
  } catch {
    return false;
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
