'use client';

import { useMemo, useState } from 'react';
import type { GameMode, GameResult, Question, ThemeSlug } from '@/lib/types';
import { GameBoard } from './GameBoard';
import { submitScore } from '@/lib/scores';

const DECK_SIZE = 40;

/** Shuffle once per mount so each session is fresh (non-deterministic is fine
 *  for practice — only the Daily Challenge must be deterministic). */
function shuffleClient<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PracticeGame({
  mode,
  themeSlug,
  pool,
}: {
  mode: GameMode;
  themeSlug: ThemeSlug;
  pool: Question[];
}) {
  const [seed] = useState(() => Date.now());
  const deck = useMemo(
    () => shuffleClient(pool).slice(0, DECK_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );

  function handleFinish(result: GameResult) {
    void submitScore(result);
  }

  return (
    <GameBoard
      mode={mode}
      deck={deck}
      themeSlug={themeSlug}
      onFinish={handleFinish}
    />
  );
}
