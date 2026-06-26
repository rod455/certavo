'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLeaderboard, type LeaderboardRow } from '@/lib/scores';
import { isBackendConfigured } from '@/lib/supabase/client';
import type { GameMode } from '@/lib/types';

// Each mode ranks within its natural window / metric.
const TABS: { mode: GameMode; period: 'daily' | 'weekly' | 'all'; metric: 'score' | 'streak' }[] =
  [
    { mode: 'daily', period: 'daily', metric: 'score' },
    { mode: 'time_attack', period: 'weekly', metric: 'score' },
    { mode: 'sudden_death', period: 'all', metric: 'streak' },
  ];

export function Leaderboard() {
  const t = useTranslations('ranking');
  const tm = useTranslations('modes');
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const active = TABS[tab];

  useEffect(() => {
    let on = true;
    setLoading(true);
    getLeaderboard(active.mode, active.period).then((r) => {
      if (on) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
  }, [active.mode, active.period]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {TABS.map((tabDef, i) => (
          <button
            key={tabDef.mode}
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`btn px-2 text-sm ${
              tab === i
                ? 'bg-navy text-paper shadow-none'
                : 'bg-paper text-navy shadow-tactile-sm'
            }`}
          >
            {tm(tabDef.mode)}
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
              <span className="font-mono font-bold text-teal">
                {active.metric === 'streak' ? (row.streak ?? 0) : row.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
