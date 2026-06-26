'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GameResult } from '@/lib/types';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { submitScore, getLeaderboard, type LeaderboardRow } from '@/lib/scores';
import { getNick, setNick } from '@/lib/anon';
import { isBackendConfigured } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';

const WA_GREEN = '#25D366';

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
  const myMetric = isStreak ? result.streak : result.score;

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

  function handleWhatsApp() {
    // Always send text + link (WhatsApp drops the caption when an image file is
    // attached). The link unfurls into a rich preview, so the visual is kept
    // and the link stays clickable on every platform.
    window.open(whatsappLink(shareText), '_blank', 'noopener');
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
    getLeaderboard(
      result.mode,
      PERIOD[result.mode as keyof typeof PERIOD] ?? 'all',
    ).then(setRows);
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
  const pct =
    rows.length > 0
      ? Math.round(
          (rows.filter((r) => (isStreak ? (r.streak ?? 0) : r.score) < myMetric)
            .length /
            rows.length) *
            100,
        )
      : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 animate-fade-up">
      {/* Dark hero: score + percentile + join ranking */}
      <div className="rounded-card border-2 border-navy bg-navy p-6 text-center text-paper shadow-tactile">
        <p className="font-mono text-7xl font-bold leading-none text-paper">
          {headline}
        </p>
        {subLabel && (
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
            {subLabel}
          </p>
        )}
        {pct != null && (
          <p className="mt-3 font-sans text-sm text-paper/90">
            {t('beatPercent', { pct })}
          </p>
        )}

        {showSave &&
          (rank != null ? (
            <p className="mt-4 font-sans text-lg font-bold text-teal-soft">
              🏆 {t('rankPosition', { rank })}
            </p>
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNickInput(e.target.value)}
                  maxLength={24}
                  placeholder={t('nickPlaceholder')}
                  className="min-h-[44px] w-full rounded-card border-2 border-paper/20 bg-paper/10 px-3 font-sans text-paper placeholder:text-paper/50"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn min-h-[44px] shrink-0 border-teal bg-teal font-semibold text-paper disabled:opacity-50"
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
              {saveError && (
                <p className="mt-1 text-sm text-paper/80">{t('rankUnavailable')}</p>
              )}
            </div>
          ))}
      </div>

      {/* WhatsApp share (sends the result image + link) */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="btn w-full border-transparent font-bold text-white shadow-tactile"
        style={{ background: WA_GREEN }}
      >
        💬 {t('shareWhatsapp')}
      </button>

      {/* Inline ranking */}
      {showBackend && top.length > 0 && (
        <div className="overflow-hidden rounded-card border-2 border-navy/15 bg-paper">
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
  );
}
