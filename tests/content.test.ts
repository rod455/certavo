import { describe, it, expect } from 'vitest';
import {
  flagToNameQuestions,
  nameToFlagQuestions,
  worldCupQuestions,
  olympicQuestions,
  questionsForTheme,
} from '@/lib/content';
import { locales } from '@/i18n/locales';

const builders = {
  'flag→name': flagToNameQuestions('flags:flags-name'),
  'name→flag': nameToFlagQuestions('flags:name-flag'),
  worldCup: worldCupQuestions('sports:wc'),
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
});
