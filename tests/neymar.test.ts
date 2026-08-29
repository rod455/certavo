import { describe, it, expect } from 'vitest';
import {
  MOMENTS,
  TOTAL_MOMENTS,
  isValidPath,
  buildNeymarStory,
} from '@/lib/neymar';

describe('neymar momentos', () => {
  it('every momento has exactly two options A/B', () => {
    for (const m of MOMENTS) {
      expect(m.options).toHaveLength(2);
      expect(m.options.map((o) => o.key).sort()).toEqual(['A', 'B']);
      expect(m.options.filter((o) => o.real)).toHaveLength(1); // exactly one real path
    }
  });

  it('validates answer paths against the momento keys', () => {
    expect(isValidPath('')).toBe(true);
    expect(isValidPath('AB')).toBe(true);
    expect(isValidPath('AABBA')).toBe(true);
    expect(isValidPath('C')).toBe(false); // not a real key
    expect(isValidPath('A'.repeat(TOTAL_MOMENTS + 1))).toBe(false); // too long
  });
});

describe('buildNeymarStory', () => {
  it('produces one chapter per answer and a full ending', () => {
    const s = buildNeymarStory('AAAAA');
    expect(s.chapters).toHaveLength(TOTAL_MOMENTS);
    expect(s.summary).toHaveLength(TOTAL_MOMENTS);
    expect(s.legado.length).toBeGreaterThan(0);
    expect(s.title).toBeTruthy();
  });

  it('the glory path (max titles) ranks higher than the money path', () => {
    // AAAAA = Barça, plays 2014 (hero), keeps Bruna, PSG, back to Santos
    const glory = buildNeymarStory('AAAAA');
    // A-B-B-A-B ≈ reality (no hero, PSG + Arabia money)
    const reality = buildNeymarStory('ABBAB');
    expect(glory.tier).toBeGreaterThan(reality.tier);
    expect(glory.hero).toBe(true);
    expect(reality.hero).toBe(false);
  });

  it('accumulates stats across the chosen options', () => {
    const s = buildNeymarStory('BAABA'); // Real (5 UCL) + ...
    expect(s.stats.ucl).toBeGreaterThanOrEqual(5);
    expect(s.stats.goals).toBeGreaterThan(0);
  });
});
