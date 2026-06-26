'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLeaderboard, type LeaderboardRow } from '@/lib/scores';
import { isBackendConfigured } from '@/lib/supabase/client';

type Period = 'daily' | 'weekly' | 'all';

export function Leaderboard() {
  const t = useTranslations('ranking');
  const [period, setPeriod] = useState<Period>('daily');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const mode = period === 'weekly' ? 'time_attack' : 'daily';
    getLeaderboard(mode, period).then((r) => {
      if (active) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [period]);

  const tabs: { key: Period; label: string }[] = [
    { key: 'daily', label: t('daily') },
    { key: 'weekly', label: t('weekly') },
    { key: 'all', label: t('allTime') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={period === tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`btn flex-1 ${
              period === tab.key
                ? 'bg-navy text-paper shadow-none'
                : 'bg-paper text-navy shadow-tactile-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!isBackendConfigured() ? (
        <p className="rounded-card border-2 border-dashed border-navy/20 p-6 text-center text-navy-soft">
          {t('empty')}
        </p>
      ) : loading ? (
        <p className="p-6 text-center font-mono text-navy-soft">…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-card border-2 border-dashed border-navy/20 p-6 text-center text-navy-soft">
          {t('empty')}
        </p>
      ) : (
        <ol className="overflow-hidden rounded-card border-2 border-navy/15">
          {rows.map((row) => (
            <li
              key={row.rank}
              className="flex items-center justify-between border-b border-navy/10 bg-paper-2 px-4 py-3 last:border-0"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold">{row.rank}</span>
                <span>{row.name ?? t('anon')}</span>
              </span>
              <span className="font-mono font-bold text-emerald">{row.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
