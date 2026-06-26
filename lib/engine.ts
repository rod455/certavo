import type { AnswerRecord, GameMode, Question } from './types';

/** Tunable game constants — single source of truth for the three modes. */
export const ENGINE = {
  basePoints: 100,
  /** Multiplier grows with the current combo, capped so it can't run away. */
  maxComboSteps: 9,
  comboStep: 0.25,
  timeAttack: {
    startMs: 60_000,
    wrongPenaltyMs: 4_000,
    correctBonusBaseMs: 1_200,
    correctBonusPerComboMs: 300,
    correctBonusCapMs: 4_000,
  },
} as const;

export type GameState = {
  mode: GameMode;
  deck: Question[];
  index: number;
  score: number;
  combo: number; // consecutive correct answers
  bestCombo: number;
  streak: number; // alias of current correct streak, surfaced for sudden death
  correctCount: number;
  answers: AnswerRecord[];
  timeLeftMs: number; // only meaningful for time_attack
  finished: boolean;
};

export type AnswerOutcome = {
  state: GameState;
  correct: boolean;
  gained: number;
  multiplier: number;
  timeDeltaMs: number; // time_attack only (+bonus / -penalty)
};

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, ENGINE.maxComboSteps) * ENGINE.comboStep;
}

export function createGame(mode: GameMode, deck: Question[]): GameState {
  return {
    mode,
    deck,
    index: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    streak: 0,
    correctCount: 0,
    answers: [],
    timeLeftMs:
      mode === 'time_attack' || mode === 'final' ? ENGINE.timeAttack.startMs : 0,
    finished: deck.length === 0,
  };
}

export function currentQuestion(state: GameState): Question | null {
  return state.deck[state.index] ?? null;
}

/** Apply an answer and return the new state plus a per-answer outcome. */
export function answer(
  state: GameState,
  chosenIndex: number,
  msTaken: number,
): AnswerOutcome {
  const q = currentQuestion(state);
  if (!q || state.finished) {
    return { state, correct: false, gained: 0, multiplier: 1, timeDeltaMs: 0 };
  }

  const correct = chosenIndex === q.correct_index;
  const multiplier = correct ? comboMultiplier(state.combo) : 1;
  const gained = correct ? Math.round(ENGINE.basePoints * multiplier) : 0;
  const combo = correct ? state.combo + 1 : 0;

  let timeDeltaMs = 0;
  let timeLeftMs = state.timeLeftMs;
  if (state.mode === 'time_attack') {
    if (correct) {
      timeDeltaMs = Math.min(
        ENGINE.timeAttack.correctBonusBaseMs +
          state.combo * ENGINE.timeAttack.correctBonusPerComboMs,
        ENGINE.timeAttack.correctBonusCapMs,
      );
    } else {
      timeDeltaMs = -ENGINE.timeAttack.wrongPenaltyMs;
    }
    timeLeftMs = Math.max(0, timeLeftMs + timeDeltaMs);
  }

  const record: AnswerRecord = {
    questionId: q.id,
    chosenIndex,
    correct,
    msTaken,
  };

  const nextIndex = state.index + 1;
  const outOfQuestions = nextIndex >= state.deck.length;
  // Final = sudden death ON the clock: one miss ends it, time can also end it.
  const suddenDeathOver =
    (state.mode === 'sudden_death' || state.mode === 'final') && !correct;
  const timeOver =
    (state.mode === 'time_attack' || state.mode === 'final') && timeLeftMs <= 0;

  const next: GameState = {
    ...state,
    index: nextIndex,
    score: state.score + gained,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    streak: combo,
    correctCount: state.correctCount + (correct ? 1 : 0),
    answers: [...state.answers, record],
    timeLeftMs,
    finished: outOfQuestions || suddenDeathOver || timeOver,
  };

  return { state: next, correct, gained, multiplier, timeDeltaMs };
}

/** Time ran out in time attack. */
export function timeout(state: GameState): GameState {
  return { ...state, timeLeftMs: 0, finished: true };
}
