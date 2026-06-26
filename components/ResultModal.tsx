'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GameResult } from '@/lib/types';
import {
  dailyShareText,
  resultGrid,
  whatsappLink,
  shareOrCopy,
} from '@/lib/share';
import { Link } from '@/i18n/routing';

export function ResultModal({ result }: { result: GameResult }) {
  const t = useTranslations('result');
  const tc = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const isDaily = result.mode === 'daily';

  const shareText =
    isDaily && result.challengeNumber
      ? dailyShareText({
          challengeNumber: result.challengeNumber,
          answers: result.answers,
          correctCount: result.correctCount,
          total: result.total,
        })
      : `${result.score} pts`;

  async function handleShare() {
    const kind = await shareOrCopy(shareText);
    if (kind === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-sm animate-fade-up rounded-card border-2 border-navy bg-paper p-6 shadow-tactile">
        <h2 className="text-center font-sans text-2xl font-bold">
          {isDaily && result.challengeNumber
            ? t('dailyTitle', { site: 'Certavo', n: result.challengeNumber })
            : t('title')}
        </h2>

        {isDaily ? (
          <pre className="my-4 whitespace-pre-wrap text-center font-mono text-2xl leading-tight">
            {resultGrid(result.answers)}
          </pre>
        ) : (
          <p className="my-4 text-center font-mono text-4xl font-bold text-teal">
            {result.score}
          </p>
        )}

        <p className="text-center font-mono text-lg">
          {isDaily
            ? t('youScored', {
                score: result.correctCount,
                total: result.total,
              })
            : `${tc('streak')}: ${result.streak}`}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {isDaily && (
            <a
              href={whatsappLink(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              {t('shareWhatsapp')}
            </a>
          )}
          <button type="button" onClick={handleShare} className="btn-ghost w-full">
            {copied ? tc('copied') : tc('copy')}
          </button>
          <Link href="/" className="btn-ghost w-full">
            {t('playAgain')}
          </Link>
        </div>

        {isDaily && (
          <p className="mt-4 text-center text-sm text-navy-soft">
            {t('comeBackTomorrow')}
          </p>
        )}
      </div>
    </div>
  );
}
