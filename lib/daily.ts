import type { Question } from './types';
import { seededRng, pickN, shuffle } from './rng';

/** Launch day of Certavo: this date is Challenge #1, and it counts up daily. */
export const DAILY_EPOCH = '2026-06-26';
export const DAILY_QUESTION_COUNT = 10;

const MS_PER_DAY = 86_400_000;

/** Current date in UTC as YYYY-MM-DD. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function dateToUtcMs(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

/** Challenge number for a given YYYY-MM-DD (UTC). Epoch day => #1. */
export function challengeNumberForDate(date: string): number {
  const diff = dateToUtcMs(date) - dateToUtcMs(DAILY_EPOCH);
  return Math.floor(diff / MS_PER_DAY) + 1;
}

/** Inverse of challengeNumberForDate. */
export function dateForChallengeNumber(n: number): string {
  const ms = dateToUtcMs(DAILY_EPOCH) + (n - 1) * MS_PER_DAY;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Stable seed string for a day. Same input → same selection, everywhere. */
export function dailySeed(date: string): string {
  return `certavo:daily:${date}`;
}

/**
 * Deterministically select the daily questions from a pool. The server runs
 * this exact function against the same pool to validate a submitted score.
 *
 * Option order is also shuffled deterministically so everyone sees the same
 * board, while `correct_index` is remapped accordingly.
 */
export function selectDailyQuestions(
  pool: readonly Question[],
  date: string,
  count: number = DAILY_QUESTION_COUNT,
): Question[] {
  const rng = seededRng(dailySeed(date));
  const chosen = pickN(pool, count, rng);
  return chosen.map((q, i) => shuffleOptions(q, seededRng(`${dailySeed(date)}:${i}`)));
}

/** Shuffle a question's options deterministically, keeping the answer correct. */
export function shuffleOptions(q: Question, rng: () => number): Question {
  const langs = Object.keys(q.options);
  const order = shuffle(
    q.options[langs[0]].map((_, i) => i),
    rng,
  );
  const newCorrect = order.indexOf(q.correct_index);
  const options: Record<string, string[]> = {};
  for (const lang of langs) {
    options[lang] = order.map((idx) => q.options[lang][idx]);
  }
  return { ...q, options, correct_index: newCorrect };
}
