'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GameResult } from '@/lib/types';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { submitScore } from '@/lib/scores';
import { getNick, setNick } from '@/lib/anon';
import { isBackendConfigured } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function ResultModal({
  result,
  allowSave = true,
}: {
  result: GameResult;
  allowSave?: boolean;
}) {
  const t = useTranslations('result');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const isDaily = result.mode === 'daily';

  // Build links from the real origin the app is served from (so it works on
  // certavo.vercel.app, a custom domain, or localhost) and include the locale.
  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);
  const base = `${origin}/${locale}`;

  // ----- shareable message (plain text — renders everywhere) -----
  const url = isDaily
    ? `${base}/d/${result.challengeNumber}`
    : `${base}/jogar/${result.mode}?theme=${result.themeSlug}`;

  let message: string;
  if (isDaily) {
    message = t('shareText', {
      score: result.correctCount,
      total: result.total,
      site: SITE_NAME,
      n: result.challengeNumber ?? 0,
      edition: result.challengeName ?? '',
    });
  } else if (result.mode === 'time_attack') {
    message = t('shareTimeAttack', {
      correct: result.correctCount,
      total: result.total,
      time: formatDuration(result.durationMs),
      site: SITE_NAME,
    });
  } else if (result.mode === 'sudden_death') {
    message = t('shareSuddenDeath', { streak: result.streak, site: SITE_NAME });
  } else {
    message = t('shareScore', { score: result.score, site: SITE_NAME });
  }
  const shareText = `${message}\n${url}`;

  // ----- headline metric -----
  const headline = isDaily
    ? `${result.correctCount}/${result.total}`
    : result.mode === 'sudden_death'
      ? `${result.streak}`
      : `${result.score}`;

  async function handleShare() {
    const kind = await shareOrCopy(shareText);
    if (kind === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  // ----- save to ranking + rank position -----
  const [nick, setNickInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => setNickInput(getNick()), []);

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    if (nick.trim()) setNick(nick.trim());
    const res = await submitScore(result, nick);
    setSaving(false);
    if (res.ok && typeof res.rank === 'number') setRank(res.rank);
    else setSaveError(true);
  }

  const showSave = allowSave && isBackendConfigured();

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
        {isDaily && result.challengeName && (
          <p className="text-center font-sans text-base font-bold text-teal">
            {result.challengeName}
          </p>
        )}

        <p className="my-3 text-center font-mono text-5xl font-bold text-teal">
          {headline}
        </p>
        {result.mode === 'sudden_death' && (
          <p className="-mt-2 text-center font-mono text-sm text-navy-soft">
            {tc('streak')}
          </p>
        )}

        {/* Exactly what gets shared */}
        <p className="mt-3 rounded-card border-2 border-navy/10 bg-paper-2 p-3 text-center text-sm text-navy-soft">
          {message}
        </p>

        {/* Save to ranking */}
        {showSave &&
          (rank != null ? (
            <p className="mt-4 rounded-card border-2 border-teal/40 bg-teal/10 p-3 text-center font-sans font-bold text-teal">
              🏆 {t('rankPosition', { rank })}
            </p>
          ) : (
            <div className="mt-4">
              <label className="text-sm font-bold">{t('saveTitle')}</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNickInput(e.target.value)}
                  maxLength={24}
                  placeholder={t('nickPlaceholder')}
                  className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-sans"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary shrink-0"
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
              {saveError && (
                <p className="mt-1 text-sm text-error">{t('rankUnavailable')}</p>
              )}
            </div>
          ))}

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
