'use client';

import { useMemo, useState } from 'react';
import type { GameMode } from '@/lib/types';
import { questionsForTheme, type ThemeKey, type Difficulty } from '@/lib/content';
import { GameBoard } from './GameBoard';

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
  difficulty = 'hard',
}: {
  mode: GameMode;
  themeSlug: ThemeKey;
  difficulty?: Difficulty;
}) {
  const [seed] = useState(() => Date.now());
  // Generate the deck on the client so the page itself stays light (no heavy
  // server-side generation or large serialized payload per request).
  const deck = useMemo(
    () => shuffleClient(questionsForTheme(themeSlug, difficulty)).slice(0, DECK_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, themeSlug, difficulty],
  );

  return <GameBoard mode={mode} deck={deck} themeSlug={themeSlug} />;
}
