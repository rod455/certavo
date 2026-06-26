import { describe, it, expect } from 'vitest';
import {
  challengeNumberForDate,
  dateForChallengeNumber,
  selectDailyQuestions,
  DAILY_QUESTION_COUNT,
  DAILY_EPOCH,
} from '@/lib/daily';
import { dailyPool } from '@/lib/content';

describe('daily challenge', () => {
  it('challenge number and date are inverses', () => {
    for (const date of ['2024-01-01', '2024-06-15', '2026-06-26']) {
      const n = challengeNumberForDate(date);
      expect(dateForChallengeNumber(n)).toBe(date);
    }
  });

  it('epoch is challenge #1 and increments daily', () => {
    expect(challengeNumberForDate(DAILY_EPOCH)).toBe(1);
    const dayAfter = dateForChallengeNumber(2);
    expect(challengeNumberForDate(dayAfter)).toBe(2);
  });

  it('selects the same questions for the same date (global determinism)', () => {
    const pool = dailyPool();
    const a = selectDailyQuestions(pool, '2026-06-26').map((q) => q.id);
    const b = selectDailyQuestions(pool, '2026-06-26').map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DAILY_QUESTION_COUNT);
  });

  it('selects different questions on different dates', () => {
    const pool = dailyPool();
    const a = selectDailyQuestions(pool, '2026-06-26').map((q) => q.id);
    const b = selectDailyQuestions(pool, '2026-06-27').map((q) => q.id);
    expect(a).not.toEqual(b);
  });

  it('option shuffle keeps the correct answer correct', () => {
    const q = selectDailyQuestions(dailyPool(), '2026-06-26')[0];
    expect(q.correct_index).toBeGreaterThanOrEqual(0);
    expect(q.correct_index).toBeLessThan(4);
    expect(q.options.en[q.correct_index]).toBeTruthy();
  });
});
