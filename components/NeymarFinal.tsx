'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import { SITE_URL } from '@/lib/site';
import { buildNeymarStory, isValidPath, TOTAL_MOMENTS, type Stats } from '@/lib/neymar';

const TIER_COLORS = [
  'border-error/50 bg-error/10', // 0 — podia ter sido
  'border-navy/20 bg-paper-2', // 1
  'border-navy/30 bg-paper-2', // 2
  'border-teal/40 bg-teal/10', // 3
  'border-teal bg-teal/15', // 4 — lenda
];

export function NeymarFinal({ path, by }: { path: string; by: string }) {
  const t = useTranslations('neymar');
  const locale = useLocale();

  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const complete = isValidPath(path) && path.length === TOTAL_MOMENTS;
  if (!complete) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <p className="font-sans text-lg font-bold">{t('incomplete')}</p>
        <Link href="/neymar" className="btn-primary w-full">
          {t('createYours')}
        </Link>
      </div>
    );
  }

  const story = buildNeymarStory(path);
  const createUrl = `${origin}/${locale}/neymar`;
  const waMsg = `${t('waFinal', { title: story.title })} ${createUrl}`;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-navy-soft">
          {t('storyTitle')}
        </p>
        <div className={`mt-2 rounded-card border-2 p-5 ${TIER_COLORS[story.tier]}`}>
          {story.hero && <p className="text-3xl">🦸</p>}
          <h1 className="text-balance font-sans text-2xl font-bold">{story.title}</h1>
        </div>
      </header>

      {/* the story */}
      <ol className="flex flex-col gap-3">
        {story.chapters.map((c, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 font-mono text-sm font-bold text-teal">{i + 1}</span>
            <p className="text-pretty">{c}</p>
          </li>
        ))}
      </ol>

      {/* legacy */}
      <div className="rounded-card border-2 border-navy bg-navy p-4 text-paper">
        <p className="font-mono text-xs uppercase tracking-wide text-teal-soft">
          {t('legacy')}
        </p>
        {story.legado.map((l, i) => (
          <p key={i} className="mt-1 text-pretty">
            {l}
          </p>
        ))}
      </div>

      {/* career numbers */}
      <StatsGrid stats={story.stats} t={t} />

      {/* the chosen path */}
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-navy-soft">
          {t('yourPath')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {story.summary.map((s, i) => (
            <span
              key={i}
              className="rounded-full border-2 border-navy/15 bg-paper-2 px-3 py-1 font-mono text-xs"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* share + new chain */}
      <a
        href={whatsappLink(waMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn w-full border-transparent font-bold text-white shadow-tactile"
        style={{ background: '#25D366' }}
      >
        💬 {t('shareStory')}
      </a>
      <Link href="/neymar" className="btn-primary w-full text-center">
        {t('createYours')}
      </Link>
      <ShareCurrent t={t} />
    </div>
  );
}

function StatsGrid({
  stats,
  t,
}: {
  stats: Stats;
  t: ReturnType<typeof useTranslations>;
}) {
  const rows: [keyof Stats, string][] = [
    ['ucl', t('ucl')],
    ['liga', t('liga')],
    ['libertadores', t('libertadores')],
    ['brasileirao', t('brasileirao')],
    ['goals', t('goals')],
    ['assists', t('assists')],
  ];
  const shown = rows.filter(([k]) => stats[k] > 0);
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {shown.map(([k, label]) => (
        <div
          key={k}
          className="rounded-card border-2 border-navy/15 bg-paper-2 p-2 text-center"
        >
          <div className="font-mono text-xl font-bold text-teal">{stats[k]}</div>
          <div className="text-[11px] leading-tight text-navy-soft">{label}</div>
        </div>
      ))}
    </div>
  );
}

function ShareCurrent({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const kind = await shareOrCopy(url);
        if (kind === 'copied') {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      className="text-center text-sm text-navy-soft underline"
    >
      {copied ? t('copied') : t('shareResult')}
    </button>
  );
}
