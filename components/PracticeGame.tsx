'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GameMode } from '@/lib/types';
import { questionsForTheme, type ThemeKey, type Difficulty } from '@/lib/content';
import { hasPlayedFinal } from '@/lib/anon';
import { Link } from '@/i18n/routing';
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

  // The Final is one-shot — if it was already played for this theme, block it.
  const isFinal = mode === 'final';
  const [ready, setReady] = useState(!isFinal);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!isFinal) return;
    setBlocked(hasPlayedFinal(themeSlug));
    setReady(true);
  }, [isFinal, themeSlug]);

  if (!ready) return null;
  if (blocked) return <FinalAlreadyPlayed />;

  return <GameBoard mode={mode} deck={deck} themeSlug={themeSlug} />;
}

function FinalAlreadyPlayed() {
  const t = useTranslations('result');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-card border-2 border-navy/15 bg-paper-2 p-8 text-center">
      <p className="font-sans text-lg font-bold">{t('finalAlready')}</p>
      <p className="text-sm text-navy-soft">{t('finalOneShot')}</p>
      <Link href="/grupos" className="btn-primary w-full">
        {t('backToChampionship')}
      </Link>
    </div>
  );
}
