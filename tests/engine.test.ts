import { describe, it, expect } from 'vitest';
import { createGame, answer, comboMultiplier, ENGINE } from '@/lib/engine';
import type { Question } from '@/lib/types';

function q(id: string, correct = 0): Question {
  return {
    id,
    pack_id: 'test',
    media_type: 'none',
    media_value: null,
    prompt: { pt: id, en: id, es: id },
    options: { pt: ['a', 'b', 'c', 'd'], en: ['a', 'b', 'c', 'd'], es: ['a', 'b', 'c', 'd'] },
    correct_index: correct,
    difficulty: 1,
  };
}

const deck = [q('1'), q('2'), q('3'), q('4')];

describe('engine scoring', () => {
  it('awards base points on a correct answer', () => {
    const s = createGame('daily', deck);
    const out = answer(s, 0, 500);
    expect(out.correct).toBe(true);
    expect(out.gained).toBe(ENGINE.basePoints);
    expect(out.state.score).toBe(ENGINE.basePoints);
  });

  it('combo multiplier grows then caps', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBeCloseTo(1.25);
    expect(comboMultiplier(100)).toBe(
      1 + ENGINE.maxComboSteps * ENGINE.comboStep,
    );
  });

  it('resets combo on a wrong answer', () => {
    let s = createGame('daily', deck);
    s = answer(s, 0, 100).state; // correct, combo 1
    const out = answer(s, 1, 100); // wrong
    expect(out.correct).toBe(false);
    expect(out.state.combo).toBe(0);
  });
});

describe('mode rules', () => {
  it('sudden death ends on the first wrong answer', () => {
    const s = createGame('sudden_death', deck);
    const out = answer(s, 3, 100); // wrong (correct is 0)
    expect(out.state.finished).toBe(true);
  });

  it('time attack subtracts time on a wrong answer', () => {
    const s = createGame('time_attack', deck);
    const out = answer(s, 2, 100);
    expect(out.timeDeltaMs).toBe(-ENGINE.timeAttack.wrongPenaltyMs);
    expect(out.state.timeLeftMs).toBe(
      ENGINE.timeAttack.startMs - ENGINE.timeAttack.wrongPenaltyMs,
    );
  });

  it('finishes when the deck is exhausted', () => {
    let s = createGame('daily', deck);
    for (let i = 0; i < deck.length; i++) s = answer(s, 0, 100).state;
    expect(s.finished).toBe(true);
    expect(s.correctCount).toBe(deck.length);
  });
});
