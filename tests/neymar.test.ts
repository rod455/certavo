import { describe, it, expect } from 'vitest';
import {
  MOMENTS,
  TOTAL_MOMENTS,
  isValidPath,
  buildNeymarStory,
  resolveMoment,
} from '@/lib/neymar';

describe('neymar momentos', () => {
  it('has 6 momentos and a 3-option opening', () => {
    expect(MOMENTS).toHaveLength(TOTAL_MOMENTS);
    const m0 = resolveMoment(0, '')!;
    expect(m0.options.length).toBe(3);
    expect(m0.options.map((o) => o.label)).toContain('Manchester City');
    expect(m0.options.map((o) => o.key)).toEqual(['A', 'B', 'C']);
  });

  it('validates paths against the (context-aware) options', () => {
    expect(isValidPath('')).toBe(true);
    expect(isValidPath('C')).toBe(true); // 3rd opening option exists
    expect(isValidPath('AAAAAA')).toBe(true);
    expect(isValidPath('Z')).toBe(false); // no such key
    expect(isValidPath('A'.repeat(TOTAL_MOMENTS + 1))).toBe(false); // too long
  });
});

describe('linear coherence (2017 adapts to the club)', () => {
  it('after the Real, 2017 is about the Real — never the Barça', () => {
    const real = resolveMoment(3, 'BBA'); // 2013 Real, then 2014, 2016
    expect(real?.prompt).toContain('Real Madrid');
    const choices = real!.options.map((o) => o.choice).join(' | ');
    expect(choices).toContain('fica no Real Madrid');
    expect(choices).not.toContain('Vai pro Real Madrid'); // already there
    expect(choices).not.toContain('Barcelona');
  });

  it('after the Barça, 2017 offers to stay at the Barça (+ PSG/City/Real)', () => {
    const barca = resolveMoment(3, 'ABA');
    expect(barca?.prompt).toContain('Barcelona');
    const labels = barca!.options.map((o) => o.label);
    expect(labels).toContain('Manchester City');
    expect(labels).toContain('Real Madrid');
  });
});

describe('buildNeymarStory', () => {
  it('produces one chapter per answer and a full ending', () => {
    const s = buildNeymarStory('A'.repeat(TOTAL_MOMENTS));
    expect(s.chapters).toHaveLength(TOTAL_MOMENTS);
    expect(s.summary).toHaveLength(TOTAL_MOMENTS);
    expect(s.title).toBeTruthy();
  });

  it('World Cup comes from staying (fresh), not from PSG', () => {
    expect(buildNeymarStory('AAAAAA').worldCup).toBe(1); // 2017=A=stay
    expect(buildNeymarStory('AAABAA').worldCup).toBe(0); // 2017=B=PSG
  });

  it("Ballon d'Or needs protagonism + Champions", () => {
    // Real (out of shadow) then stay → many UCL → multiple Ballons
    expect(buildNeymarStory('BAAAAA').ballon).toBeGreaterThan(0);
    // Barça then PSG (always in the shadow, no UCL) → none
    expect(buildNeymarStory('AAABAB').ballon).toBe(0);
  });

  it('numbers are anchored in reality (Barça real ≈ 103 goals base)', () => {
    // opening at Barça adds his real all-comps output
    const s = buildNeymarStory('ABABAB');
    expect(s.stats.goals).toBeGreaterThanOrEqual(103);
  });
});
