'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GameResult, Question } from '@/lib/types';
import { GameBoard } from './GameBoard';
import { ResultModal } from './ResultModal';
import { hasPlayedDaily, getDailyResult } from '@/lib/anon';

type StoredDaily = {
  score: number;
  correctCount: number;
  answers: GameResult['answers'];
};

export function DailyGame({
  deck,
  challengeDate,
  challengeNumber,
  challengeName,
}: {
  deck: Question[];
  challengeDate: string;
  challengeNumber: number;
  challengeName?: string;
}) {
  const t = useTranslations('result');
  const [status, setStatus] = useState<'loading' | 'play' | 'done'>('loading');
  const [prior, setPrior] = useState<GameResult | null>(null);

  // localStorage is only readable on the client → resolve after mount.
  useEffect(() => {
    if (hasPlayedDaily(challengeDate)) {
      const stored = getDailyResult<StoredDaily>(challengeDate);
      if (stored) {
        setPrior({
          mode: 'daily',
          themeSlug: 'daily',
          score: stored.score,
          correctCount: stored.correctCount,
          total: deck.length,
          streak: 0,
          answers: stored.answers,
          durationMs: 0,
          challengeDate,
          challengeNumber,
          challengeName,
        });
      }
      setStatus('done');
    } else {
      setStatus('play');
    }
  }, [challengeDate, challengeNumber, challengeName, deck.length]);

  if (status === 'loading') return null;

  if (status === 'done') {
    return prior ? (
      <ResultModal result={prior} />
    ) : (
      <p className="rounded-card border-2 border-navy/15 bg-paper-2 p-6 text-center">
        {t('alreadyPlayed')} {t('comeBackTomorrow')}
      </p>
    );
  }

  return (
    <GameBoard
      mode="daily"
      deck={deck}
      themeSlug="daily"
      challengeDate={challengeDate}
      challengeNumber={challengeNumber}
      challengeName={challengeName}
    />
  );
}
