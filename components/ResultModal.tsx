'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GameResult } from '@/lib/types';
import { whatsappLink, shareOrCopy, tryShareImage } from '@/lib/share';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { submitScore, getLeaderboard, type LeaderboardRow } from '@/lib/scores';
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

const PERIOD = {
  daily: 'daily',
  time_attack: 'weekly',
  sudden_death: 'all',
} as const;

export function ResultModal({
  result,
  allowSave = true,
}: {
  result: GameResult;
  allowSave?: boolean;
}) {
  const t = useTranslations('result');
  const tc = useTranslations('common');
  const tm = useTranslations('modes');
  const tt = useTranslations('themes');
  const locale = useLocale();
  const isDaily = result.mode === 'daily';
  const isStreak = result.mode === 'sudden_death';

  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);
  const base = `${origin}/${locale}`;

  // ----- labels / metric -----
  const url = isDaily
    ? `${base}/d/${result.challengeNumber}`
    : `${base}/jogar/${result.mode}?theme=${result.themeSlug}`;
  const headline = isDaily
    ? `${result.correctCount}/${result.total}`
    : isStreak
      ? `${result.streak}`
      : `${result.score}`;
  const subLabel = isDaily
    ? (result.challengeName ?? '')
    : isStreak
      ? tc('streak')
      : `${result.correctCount}/${result.total} · ${formatDuration(result.durationMs)}`;
  const themeLabel = isDaily
    ? (result.challengeName ?? '')
    : (tt(result.themeSlug as never) as string);
  const title = isDaily
    ? t('dailyTitle', { site: SITE_NAME, n: result.challengeNumber ?? 0 })
    : tm(result.mode);

  // ----- share message + image -----
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
  } else {
    message = t('shareSuddenDeath', { streak: result.streak, site: SITE_NAME });
  }
  const shareText = `${message}\n${url}`;

  const imageTitle = isDaily ? `${tm('daily')} #${result.challengeNumber}` : tm(result.mode);
  const imageUrl =
    `${origin}/api/og?kind=result&locale=${locale}` +
    `&title=${encodeURIComponent(imageTitle)}` +
    `&h=${encodeURIComponent(headline)}` +
    `&sub=${encodeURIComponent(subLabel)}` +
    `&m=${encodeURIComponent(message)}`;

  async function handleWhatsApp() {
    // Send the result image + link; fall back to a wa.me text link.
    const shared = await tryShareImage(imageUrl, shareText);
    if (!shared) window.open(whatsappLink(shareText), '_blank', 'noopener');
  }

  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    const kind = await shareOrCopy(shareText);
    if (kind === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  // ----- ranking + save -----
  const showBackend = isBackendConfigured();
  const [nick, setNickInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  useEffect(() => setNickInput(getNick()), []);

  const loadBoard = useCallback(() => {
    if (!showBackend) return;
    getLeaderboard(result.mode, PERIOD[result.mode as keyof typeof PERIOD] ?? 'all').then(
      setRows,
    );
  }, [showBackend, result.mode]);
  useEffect(() => loadBoard(), [loadBoard]);

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    if (nick.trim()) setNick(nick.trim());
    const res = await submitScore(result, nick);
    setSaving(false);
    if (res.ok && typeof res.rank === 'number') {
      setRank(res.rank);
      loadBoard();
    } else setSaveError(true);
  }

  const showSave = allowSave && showBackend;
  const top = rows.slice(0, 7);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
    >
      <div className="flex max-h-[92vh] w-full max-w-sm animate-fade-up flex-col gap-4 overflow-y-auto rounded-card border-2 border-navy bg-paper p-6 shadow-tactile">
        {/* Score block */}
        <div className="text-center">
          <h2 className="font-sans text-xl font-bold">{title}</h2>
          {subLabel && (
            <p className="font-sans text-sm font-bold text-teal">{subLabel}</p>
          )}
          <p className="my-1 font-mono text-6xl font-bold text-teal">{headline}</p>
        </div>

        {/* Save to ranking */}
        {showSave &&
          (rank != null ? (
            <p className="rounded-card border-2 border-teal/40 bg-teal/10 p-3 text-center font-sans font-bold text-teal">
              🏆 {t('rankPosition', { rank })}
            </p>
          ) : (
            <div>
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

        {/* Share */}
        <button type="button" onClick={handleWhatsApp} className="btn-primary w-full">
          {t('shareWhatsapp')}
        </button>

        {/* Inline ranking */}
        {showBackend && top.length > 0 && (
          <div className="overflow-hidden rounded-card border-2 border-navy/15">
            <div className="flex items-center justify-between bg-paper-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-navy-soft">
              <span>
                {t('rankingLabel')} · {themeLabel}
              </span>
              <span>{tm(result.mode)}</span>
            </div>
            <ol>
              {top.map((row) => (
                <li
                  key={row.rank}
                  className="flex items-center justify-between border-t border-navy/10 px-3 py-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 font-mono text-navy-soft">{row.rank}</span>
                    <span className="font-sans">{row.name ?? '—'}</span>
                  </span>
                  <span className="font-mono font-bold text-teal">
                    {isStreak ? (row.streak ?? 0) : row.score}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        {isDaily ? (
          <div className="flex flex-col gap-2">
            <Link href="/" className="btn-ghost w-full">
              {t('playAgain')}
            </Link>
            <p className="text-center text-sm text-navy-soft">
              {t('comeBackTomorrow')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('playAgainSame')}
            </button>
            <Link href={`/jogar/${result.mode}`} className="btn-ghost">
              {t('changeTheme')}
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="text-center text-sm text-navy-soft underline"
        >
          {copied ? tc('copied') : tc('copy')}
        </button>
      </div>
    </div>
  );
}
