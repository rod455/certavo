'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { isBackendConfigured } from '@/lib/supabase/client';
import { todayUtc, challengeNumberForDate } from '@/lib/daily';
import {
  getChampionship,
  loadChampionship,
  type Championship,
  type ChampionshipView as View,
} from '@/lib/championships';
import { KnockoutBracket } from './KnockoutBracket';

function Row({
  rank,
  name,
  value,
  unit,
  dim,
}: {
  rank?: number;
  name: string | null;
  value: number | string;
  unit?: string;
  dim?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between border-b border-navy/10 px-3 py-2 last:border-0 ${
        dim ? 'text-navy/40 line-through' : ''
      }`}
    >
      <span className="flex items-center gap-3">
        {rank != null && <span className="w-5 font-mono text-navy-soft">{rank}</span>}
        <span>{name ?? 'Anon'}</span>
      </span>
      <span className="font-mono font-bold text-teal">
        {value} {unit}
      </span>
    </li>
  );
}

export function ChampionshipView({ id }: { id: string }) {
  const t = useTranslations('champ');
  const tt = useTranslations('themes');
  const [champ, setChamp] = useState<Championship | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isBackendConfigured()) {
      setLoading(false);
      return;
    }
    getChampionship(id).then(async (c) => {
      setChamp(c);
      if (c) setView(await loadChampionship(c));
      setLoading(false);
    });
  }, [id]);

  if (!isBackendConfigured()) return <p className="text-navy-soft">{t('unavailable')}</p>;
  if (loading) return <p className="p-6 text-center font-mono text-navy-soft">…</p>;
  if (!champ || !view) return <p className="text-navy-soft">{t('unavailable')}</p>;

  const dailyN = challengeNumberForDate(todayUtc());

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <h1 className="font-sans text-2xl font-bold">{champ.name}</h1>
        <p className="font-mono text-sm text-navy-soft">{t(champ.format)}</p>
      </header>

      {view.format === 'points' && (
        <>
          <ol className="overflow-hidden rounded-card border-2 border-navy/15 bg-paper-2">
            {view.rows.map((r) => (
              <Row key={r.anon} rank={r.rank} name={r.nick} value={r.correct} unit={t('correctShort')} />
            ))}
          </ol>
          <Link href={`/d/${dailyN}`} className="btn-primary w-full text-center">
            {t('playDaily')}
          </Link>
        </>
      )}

      {view.format === 'knockout' && <KnockoutBoard champ={champ} view={view} />}
    </div>
  );
}

function KnockoutBoard({
  champ,
  view,
}: {
  champ: Championship;
  view: Extract<View, { format: 'knockout' }>;
}) {
  const t = useTranslations('champ');
  const tt = useTranslations('themes');
  const tm = useTranslations('modes');
  const s = view.state;
  const themeLabel = champ.theme_slug ? (tt(champ.theme_slug as never) as string) : '';
  const roundUnit = champ.round_mode === 'sudden_death' ? t('streakShort') : 'pts';

  return (
    <div className="flex flex-col gap-4">
      {s.winner && (
        <p className="rounded-card border-2 border-teal/40 bg-teal/10 p-3 text-center font-sans font-bold text-teal">
          {t('winner', { name: s.winner.nick ?? 'Anon' })}
        </p>
      )}
      {s.phase === 'pending' && <p className="text-navy-soft">{t('pending')}</p>}

      {/* visual bracket — eliminated fade out */}
      <KnockoutBracket participants={view.participants} state={s} />

      {/* final — single hybrid game: 1 min + sudden death, most correct wins */}
      {s.final && (
        <section className="rounded-card border-2 border-navy bg-navy p-4 text-paper">
          <h2 className="text-center font-sans font-bold">{t('final')}</h2>
          <p className="mb-2 text-center text-sm text-paper/80">{t('finalRules')}</p>
          <ol>
            {s.final.players.map((p) => (
              <li key={p.anon} className="flex items-center justify-between px-2 py-1">
                <span>{p.nick ?? 'Anon'}</span>
                <span className="font-mono text-sm">
                  {p.played ? `${p.correct} ${t('correctShort')}` : t('notPlayed')}
                </span>
              </li>
            ))}
          </ol>
          {!s.winner && (
            <p className="mt-1 text-center text-xs text-paper/70">{t('waitingFinal')}</p>
          )}
          <Link
            href={`/jogar/final?theme=${champ.theme_slug}`}
            className="btn-primary mt-3 block w-full text-center"
          >
            {t('playFinal')}
          </Link>
        </section>
      )}

      {/* rounds */}
      {s.rounds.map((r) => (
        <section key={r.round}>
          <h2 className="mb-1 font-mono text-xs uppercase tracking-wide text-navy-soft">
            {r.live ? t('todayLive') : `${t('round', { n: r.round + 1 })} · ${r.date}`}
          </h2>
          <ol className="overflow-hidden rounded-card border-2 border-navy/15 bg-paper-2">
            {r.standings.map((st, i) => (
              <Row
                key={st.anon}
                rank={i + 1}
                name={st.nick}
                value={st.value}
                unit={roundUnit}
                dim={r.eliminated?.anon === st.anon}
              />
            ))}
          </ol>
        </section>
      ))}

      {s.phase === 'rounds' && (
        <Link
          href={`/jogar/${champ.round_mode}?theme=${champ.theme_slug}`}
          className="btn-primary w-full text-center"
        >
          {t('playRound')} · {tm(champ.round_mode)}
        </Link>
      )}
    </div>
  );
}
