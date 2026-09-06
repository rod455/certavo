import stats from '@/data/neymar-stats.json';

/**
 * "A carreira real do Neymar" — a factual reference panel shown next to the
 * alt-history game, so the hypotheses have a real baseline to contrast with.
 * Data lives in data/neymar-stats.json (editable).
 */
export function NeymarStats() {
  const clubGoals = stats.clubs.reduce((a, c) => a + (c.goals ?? 0), 0);
  const clubApps = stats.clubs.reduce((a, c) => a + (c.apps ?? 0), 0);
  const titleCount =
    stats.clubs.reduce((a, c) => a + (c.titles?.length ?? 0), 0) +
    (stats.international.titles?.length ?? 0);

  return (
    <details className="mx-auto w-full max-w-md rounded-card border-2 border-navy/15 bg-paper-2">
      <summary className="cursor-pointer list-none p-3 font-sans font-bold">
        📊 A carreira real do Neymar
        <span className="ml-1 font-mono text-xs font-normal text-navy-soft">
          (a base das hipóteses)
        </span>
      </summary>

      <div className="flex flex-col gap-3 border-t border-navy/10 p-3">
        {/* quick totals */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: clubGoals, l: 'gols em clubes' },
            { v: `${stats.international.goals}`, l: 'gols pela Seleção' },
            { v: titleCount, l: 'títulos' },
          ].map((s) => (
            <div key={s.l} className="rounded-card border-2 border-navy/10 bg-paper p-2">
              <div className="font-mono text-xl font-bold text-teal">{s.v}</div>
              <div className="text-[11px] leading-tight text-navy-soft">{s.l}</div>
            </div>
          ))}
        </div>

        {/* per club */}
        <ul className="flex flex-col gap-1">
          {stats.clubs.map((c, i) => (
            <li key={i} className="flex items-baseline justify-between text-sm">
              <span>
                <b>{c.club}</b>{' '}
                <span className="font-mono text-xs text-navy-soft">
                  {c.from}–{c.to ?? 'hoje'}
                </span>
              </span>
              <span className="font-mono text-xs text-navy-soft">
                {c.apps} jogos · <b className="text-navy">{c.goals}</b> gols
                {c.assists != null ? ` · ${c.assists} assist.` : ''}
              </span>
            </li>
          ))}
          <li className="flex items-baseline justify-between border-t border-navy/10 pt-1 text-sm">
            <span>
              <b>Brasil</b>{' '}
              <span className="font-mono text-xs text-navy-soft">seleção</span>
            </span>
            <span className="font-mono text-xs text-navy-soft">
              {stats.international.caps} jogos ·{' '}
              <b className="text-navy">{stats.international.goals}</b> gols
            </span>
          </li>
        </ul>

        <p className="text-xs text-navy-soft">
          <b>Maior artilheiro da história da Seleção</b> — {stats.international.note}
        </p>

        <ul className="flex flex-col gap-1">
          {stats.facts.map((f, i) => (
            <li key={i} className="flex gap-2 text-xs text-navy-soft">
              <span className="text-teal">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="text-[10px] text-navy-soft/70">{stats.note}</p>
      </div>
    </details>
  );
}
