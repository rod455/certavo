import { describe, it, expect } from 'vitest';
import { seededRng, shuffle, pickN } from '@/lib/rng';

describe('seeded rng', () => {
  it('is deterministic for the same seed', () => {
    const a = Array.from({ length: 5 }, seededRng('x'));
    const b = Array.from({ length: 5 }, seededRng('x'));
    expect(a).toEqual(b);
  });

  it('differs across seeds', () => {
    expect(seededRng('a')()).not.toBe(seededRng('b')());
  });

  it('shuffle is reproducible and a permutation', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const s1 = shuffle(src, seededRng('s'));
    const s2 = shuffle(src, seededRng('s'));
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(src);
  });

  it('pickN returns distinct items', () => {
    const picked = pickN([1, 2, 3, 4, 5], 3, seededRng('p'));
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });
});
