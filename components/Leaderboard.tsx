'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLeaderboard, type LeaderboardRow } from '@/lib/scores';
import { isBackendConfigured } from '@/lib/supabase/client';
import { THEMES } from '@/lib/content';
import type { GameMode } from '@/lib/types';

const MODE_TABS: {
  mode: GameMode;
  period: 'daily' | 'weekly' | 'all';
  metric: 'score' | 'streak';
  themed: boolean;
}[] = [
  { mode: 'daily', period: 'daily', metric: 'score', themed: false },
  { mode: 'time_attack', period: 'weekly', metric: 'score', themed: true },
  { mode: 'sudden_death', period: 'all', metric: 'streak', themed: true },
];

const THEME_KEYS = Object.keys(THEMES);

export function Leaderboard() {
  const t = useTranslations('ranking');
  const tm = useTranslations('modes');
  const tt = useTranslations('themes');
  const [tab, setTab] = useState(0);
  const [theme, setTheme] = useState(THEME_KEYS[0]);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const active = MODE_TABS[tab];
  const themeFilter = useMemo(
    () => (active.themed ? theme : null),
    [active.themed, theme],
  );

  useEffect(() => {
    let on = true;
    setLoading(true);
    getLeaderboard(active.mode, active.period, themeFilter).then((r) => {
      if (on) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
  }, [active.mode, active.period, themeFilter]);

  const empty = (
    <p className="rounded-card border-2 border-dashed border-navy/20 p-6 text-center text-navy-soft">
      {t('empty')}
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {MODE_TABS.map((tabDef, i) => (
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

      {active.themed && (
        <div className="flex flex-wrap gap-2">
          {THEME_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setTheme(k)}
              className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${
                theme === k
                  ? 'border-teal bg-teal/15 text-teal'
                  : 'border-navy/15 text-navy-soft'
              }`}
            >
              {tt(k as never)}
            </button>
          ))}
        </div>
      )}

      {!isBackendConfigured() ? (
        empty
      ) : loading ? (
        <p className="p-6 text-center font-mono text-navy-soft">…</p>
      ) : rows.length === 0 ? (
        empty
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
