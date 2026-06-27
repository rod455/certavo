import { describe, it, expect } from 'vitest';
import {
  flagToNameQuestions,
  nameToFlagQuestions,
  worldCupQuestions,
  worldCupRunnerUpQuestions,
  worldCupScoreQuestions,
  worldCupHostQuestions,
  olympicQuestions,
  questionsForTheme,
} from '@/lib/content';
import { locales } from '@/i18n/locales';

const builders = {
  'flag→name': flagToNameQuestions('flags:flags-name'),
  'name→flag': nameToFlagQuestions('flags:name-flag'),
  worldCup: worldCupQuestions('sports:wc'),
  'worldCup runners-up': worldCupRunnerUpQuestions('worldcup:ru'),
  'worldCup scores': worldCupScoreQuestions('worldcup:score'),
  'worldCup hosts': worldCupHostQuestions('worldcup:host'),
  olympics: olympicQuestions('sports:oly'),
};

describe('content generators', () => {
  for (const [label, qs] of Object.entries(builders)) {
    describe(label, () => {
      it('produces non-empty, well-formed questions', () => {
        expect(qs.length).toBeGreaterThan(0);
        for (const q of qs) {
          for (const l of locales) {
            expect(q.options[l]).toHaveLength(4);
            expect(q.prompt[l]).toBeTruthy();
          }
          expect(q.correct_index).toBeGreaterThanOrEqual(0);
          expect(q.correct_index).toBeLessThan(4);
          // options must be distinct
          expect(new Set(q.options.en).size).toBe(4);
        }
      });

      it('has stable ids across builds (idempotent seeding)', () => {
        const again = qs.map((q) => q.id);
        expect(new Set(again).size).toBe(qs.length);
      });
    });
  }

  it('name→flag carries per-option flag media', () => {
    const q = nameToFlagQuestions('flags:name-flag')[0];
    expect(q.option_media?.type).toBe('flag');
    expect(q.option_media?.values).toHaveLength(4);
  });

  it('a new theme = data only: questionsForTheme works generically', () => {
    expect(questionsForTheme('flags').length).toBeGreaterThan(0);
    expect(questionsForTheme('sports').length).toBeGreaterThan(0);
  });

  it('difficulty is cumulative — harder levels add categories', () => {
    const easy = questionsForTheme('worldcup', 'easy');
    const medium = questionsForTheme('worldcup', 'medium');
    const hard = questionsForTheme('worldcup', 'hard');

    // easy keeps only tier-1 questions; each step strictly grows the pool
    expect(easy.every((q) => q.difficulty === 1)).toBe(true);
    expect(medium.length).toBeGreaterThan(easy.length);
    expect(hard.length).toBeGreaterThan(medium.length);
    // hard is the only level that includes tier-3 (host countries)
    expect(hard.some((q) => q.difficulty === 3)).toBe(true);
    expect(medium.some((q) => q.difficulty === 3)).toBe(false);
  });

  it('never returns an empty deck even if a tier has no content', () => {
    // sports only has tier-1 content today → every level still plays
    for (const lvl of ['easy', 'medium', 'hard'] as const) {
      expect(questionsForTheme('sports', lvl).length).toBeGreaterThan(0);
    }
  });
});
