import { describe, it, expect } from 'vitest';
import {
  MOMENTS,
  TOTAL_MOMENTS,
  isValidPath,
  buildNeymarStory,
  resolveMoment,
} from '@/lib/neymar';

const full = (s: 'A' | 'B') => s.repeat(TOTAL_MOMENTS);

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
    const s = buildNeymarStory(full('A'));
    expect(s.chapters).toHaveLength(TOTAL_MOMENTS);
    expect(s.summary).toHaveLength(TOTAL_MOMENTS);
    expect(s.legado.length).toBeGreaterThan(0);
    expect(s.title).toBeTruthy();
  });

  it('the glory path ranks higher than the real/money path', () => {
    // Real, escapes injury (hero), Olympics gold, stays (2 UCL), stability, Santos
    const glory = buildNeymarStory('BAABAA');
    // Barça, injured (7x1), Olympics, PSG (no UCL), single life, Arabia (money)
    const reality = buildNeymarStory('ABAABB');
    expect(glory.tier).toBeGreaterThan(reality.tier);
    expect(glory.hero).toBe(true);
    expect(reality.hero).toBe(false);
  });

  it('accumulates stats across the chosen options', () => {
    const s = buildNeymarStory('BAABAA'); // Real (3 UCL) + stay (2 UCL)
    expect(s.stats.ucl).toBeGreaterThanOrEqual(5);
    expect(s.stats.goals).toBeGreaterThan(0);
  });

  it('awards the World Cup only when he escapes the 2014 injury', () => {
    expect(buildNeymarStory('BAABAA').worldCup).toBe(1); // escaped (M2=A)
    expect(buildNeymarStory('BBABAA').worldCup).toBe(0); // injured (M2=B)
  });

  it('awards the Ballon d’Or only out of Messi’s shadow with Champions', () => {
    // Real + stays → protagonist with many UCL → multiple Ballons
    expect(buildNeymarStory('BAABAA').ballon).toBeGreaterThan(0);
    // Barça then PSG (no UCL, always in the shadow) → no Ballon
    expect(buildNeymarStory('ABAABB').ballon).toBe(0);
  });
});

describe('linear coherence (club flows through the path)', () => {
  it('2017 asks about leaving whichever club the 2013 answer set', () => {
    const barca = resolveMoment(3, 'ABA'); // went to Barça in 2013
    const real = resolveMoment(3, 'BBA'); // went to Real in 2013
    expect(barca?.prompt).toContain('Barcelona');
    expect(real?.prompt).toContain('Real Madrid');
    // the "stay" option names the right club
    expect(barca?.options[1].choice).toContain('Barcelona');
    expect(real?.options[1].choice).toContain('Real Madrid');
  });

  it('a Real-Madrid path never mentions staying at Barça', () => {
    const story = buildNeymarStory('BAABAA'); // Real, then stays
    expect(story.chapters.join(' ')).toContain('Real Madrid');
    expect(story.chapters.join(' ')).not.toContain('ficou no Barcelona');
  });
});
