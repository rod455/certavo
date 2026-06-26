import { describe, it, expect } from 'vitest';
import {
  computeKnockout,
  computePoints,
  addDaysUtc,
  type Participant,
} from '@/lib/championships';

const P = (anon: string, seed: number): Participant => ({ anon, nick: anon, seed });

describe('addDaysUtc', () => {
  it('adds days in UTC', () => {
    expect(addDaysUtc('2026-06-01', 3)).toBe('2026-06-04');
    expect(addDaysUtc('2026-06-30', 1)).toBe('2026-07-01');
  });
});

describe('computePoints', () => {
  it('sums daily correct per player and ranks', () => {
    const rows = computePoints([P('A', 1), P('B', 2)], {
      'A:2026-06-01': 5,
      'A:2026-06-02': 3,
      'B:2026-06-01': 7,
    });
    expect(rows[0]).toMatchObject({ anon: 'A', correct: 8, rank: 1 });
    expect(rows[1]).toMatchObject({ anon: 'B', correct: 7, rank: 2 });
  });
});

describe('computeKnockout', () => {
  const participants = [P('A', 1), P('B', 2), P('C', 3), P('D', 4)];

  it('eliminates the lowest daily scorer each past day, then crowns the final', () => {
    const state = computeKnockout({
      startDate: '2026-06-01',
      today: '2026-06-04',
      theme: 'worldcup',
      participants,
      dailyCorrect: {
        'A:2026-06-01': 8, 'B:2026-06-01': 7, 'C:2026-06-01': 5, 'D:2026-06-01': 3,
        'A:2026-06-02': 6, 'B:2026-06-02': 4, 'C:2026-06-02': 9,
      },
      suddenStreak: { A: 12, C: 9 },
    });
    expect(state.eliminated.map((e) => e.anon)).toEqual(['D', 'B']);
    expect(state.alive.map((a) => a.anon).sort()).toEqual(['A', 'C']);
    expect(state.phase).toBe('finished');
    expect(state.winner?.anon).toBe('A');
  });

  it('keeps the final pending until both finalists play sudden death', () => {
    const state = computeKnockout({
      startDate: '2026-06-01',
      today: '2026-06-04',
      theme: 'worldcup',
      participants,
      dailyCorrect: {
        'A:2026-06-01': 8, 'B:2026-06-01': 7, 'C:2026-06-01': 5, 'D:2026-06-01': 3,
        'A:2026-06-02': 6, 'B:2026-06-02': 4, 'C:2026-06-02': 9,
      },
      suddenStreak: { A: 12 }, // C hasn't played the final yet
    });
    expect(state.phase).toBe('final');
    expect(state.winner).toBeNull();
  });

  it('marks today as a live round before eliminating', () => {
    const state = computeKnockout({
      startDate: '2026-06-03',
      today: '2026-06-03',
      theme: null,
      participants,
      dailyCorrect: {},
      suddenStreak: {},
    });
    expect(state.phase).toBe('rounds');
    expect(state.rounds.at(-1)?.live).toBe(true);
    expect(state.alive).toHaveLength(4);
  });
});
