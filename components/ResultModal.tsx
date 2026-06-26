'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GameResult } from '@/lib/types';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { Link } from '@/i18n/routing';

export function ResultModal({ result }: { result: GameResult }) {
  const t = useTranslations('result');
  const tc = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const isDaily = result.mode === 'daily';

  const challengeUrl =
    isDaily && result.challengeNumber
      ? `${SITE_URL}/d/${result.challengeNumber}`
      : SITE_URL;

  // The shared message is plain text (no emoji grid) so it renders everywhere.
  const message =
    isDaily && result.challengeNumber
      ? t('shareText', {
          score: result.correctCount,
          total: result.total,
          site: SITE_NAME,
          n: result.challengeNumber,
        })
      : t('shareScore', { score: result.score, site: SITE_NAME });
  const shareText = `${message}\n${challengeUrl}`;

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
            ? t('dailyTitle', { site: SITE_NAME, n: result.challengeNumber })
            : t('title')}
        </h2>

        <p className="my-3 text-center font-mono text-5xl font-bold text-teal">
          {isDaily ? `${result.correctCount}/${result.total}` : result.score}
        </p>

        {!isDaily && (
          <p className="text-center font-mono text-lg">
            {tc('streak')}: {result.streak}
          </p>
        )}

        {/* Preview of exactly what gets shared */}
        <p className="mt-4 rounded-card border-2 border-navy/10 bg-paper-2 p-3 text-center text-sm text-navy-soft">
          {message}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <a
            href={whatsappLink(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full"
          >
            {t('shareWhatsapp')}
          </a>
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
