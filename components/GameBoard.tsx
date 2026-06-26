'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GameMode, GameResult, Question, ThemeSlug, Lang } from '@/lib/types';
import {
  answer as applyAnswer,
  createGame,
  currentQuestion,
  ENGINE,
  type GameState,
} from '@/lib/engine';
import { QuestionCard } from './QuestionCard';
import { OptionButton, type OptionState } from './OptionButton';
import { Timer } from './Timer';
import { ComboMeter } from './ComboMeter';
import { ResultModal } from './ResultModal';
import { AdSlot } from './AdSlot';
import { markDailyPlayed } from '@/lib/anon';

const REVEAL_MS = 750;

export function GameBoard({
  mode,
  deck,
  themeSlug,
  challengeDate,
  challengeNumber,
  challengeName,
  onFinish,
}: {
  mode: GameMode;
  deck: Question[];
  themeSlug: ThemeSlug;
  challengeDate?: string;
  challengeNumber?: number;
  challengeName?: string;
  onFinish?: (result: GameResult) => void;
}) {
  const locale = useLocale() as Lang;
  const t = useTranslations('game');
  const tc = useTranslations('common');

  const [state, setState] = useState<GameState>(() => createGame(mode, deck));
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const gameStartedAt = useRef<number>(Date.now());
  const lockRef = useRef(false);

  const q = currentQuestion(state);

  // Countdown — Time Attack and the Final both race a 60s clock.
  const timed = mode === 'time_attack' || mode === 'final';
  useEffect(() => {
    if (!timed || state.finished) return;
    const id = setInterval(() => {
      setState((s) => {
        const next = Math.max(0, s.timeLeftMs - 100);
        if (next <= 0) return { ...s, timeLeftMs: 0, finished: true };
        return { ...s, timeLeftMs: next };
      });
    }, 100);
    return () => clearInterval(id);
  }, [timed, state.finished]);

  // Reset the per-question timer whenever a new question shows.
  useEffect(() => {
    startedAt.current = Date.now();
    lockRef.current = false;
  }, [state.index]);

  const finish = useCallback(
    (s: GameState) => {
      const result: GameResult = {
        mode,
        themeSlug,
        score: s.score,
        correctCount: s.correctCount,
        total: mode === 'daily' ? deck.length : s.answers.length,
        streak: s.bestCombo,
        answers: s.answers,
        durationMs: Date.now() - gameStartedAt.current,
        challengeDate,
        challengeNumber,
        challengeName,
      };
      if (mode === 'daily' && challengeDate) {
        markDailyPlayed(challengeDate, {
          score: s.score,
          correctCount: s.correctCount,
          answers: s.answers,
        });
      }
      onFinish?.(result);
      return result;
    },
    [
      mode,
      themeSlug,
      deck.length,
      challengeDate,
      challengeNumber,
      challengeName,
      onFinish,
    ],
  );

  const [result, setResult] = useState<GameResult | null>(null);
  useEffect(() => {
    if (state.finished && !result) setResult(finish(state));
  }, [state.finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoose(i: number) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    const ms = Date.now() - startedAt.current;
    setChosen(i);
    setRevealed(true);
    const outcome = applyAnswer(state, i, ms);
    setTimeout(() => {
      setChosen(null);
      setRevealed(false);
      setState(outcome.state);
    }, REVEAL_MS);
  }

  if (result) return <ResultModal result={result} />;
  if (!q) return null;

  const optionState = (i: number): OptionState => {
    if (!revealed) return 'idle';
    if (i === q.correct_index) return 'correct';
    if (i === chosen) return 'wrong';
    return 'disabled';
  };

  const total = mode === 'daily' ? deck.length : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-navy-soft">
          {total
            ? t('questionOf', { current: state.index + 1, total })
            : `${tc('score')} ${state.score}`}
        </span>
        <span className="font-bold">
          {mode === 'sudden_death' || mode === 'final'
            ? `${tc('streak')} ${state.bestCombo}`
            : `${tc('score')} ${state.score}`}
        </span>
      </div>

      {timed && (
        <Timer msLeft={state.timeLeftMs} totalMs={ENGINE.timeAttack.startMs} />
      )}

      <ComboMeter combo={state.combo} />

      <QuestionCard question={q} prompt={q.prompt[locale] ?? q.prompt.en} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(q.options[locale] ?? q.options.en).map((label, i) => (
          <OptionButton
            key={i}
            index={i}
            label={label}
            flagCode={q.option_media?.type === 'flag' ? q.option_media.values[i] : null}
            hideLabel={q.option_media?.type === 'flag'}
            state={optionState(i)}
            onClick={() => handleChoose(i)}
          />
        ))}
      </div>

      <AdSlot id="game-footer" className="mt-2" />
    </div>
  );
}
