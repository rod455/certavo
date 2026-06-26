'use client';

import { useTranslations } from 'next-intl';
import { getAnonId } from '@/lib/anon';
import type { KnockoutState, Participant } from '@/lib/championships';

/**
 * Visual elimination ladder ("bracket") drawn after the draw. Eliminated
 * players fade out — the earlier they went, the more faded — while the alive
 * ones stay bright, the finalists are highlighted and the champion is gold.
 */
export function KnockoutBracket({
  participants,
  state,
}: {
  participants: Participant[];
  state: KnockoutState;
}) {
  const t = useTranslations('champ');
  const me = getAnonId();

  const elimRound = new Map(state.eliminated.map((e) => [e.anon, e.round]));
  const aliveSet = new Set(state.alive.map((a) => a.anon));
  const winner = state.winner?.anon;
  const isFinalPhase = state.phase === 'final' || state.phase === 'finished';
  const inFinal = (anon: string) =>
    aliveSet.has(anon) && state.alive.length === 2 && isFinalPhase;

  const ordered = [...participants].sort((a, b) => a.seed - b.seed);

  return (
    <section>
      <h2 className="mb-1 font-mono text-xs uppercase tracking-wide text-navy-soft">
        {t('bracket')}
      </h2>
      <ol className="flex flex-col gap-2">
        {ordered.map((p) => {
          const out = elimRound.get(p.anon);
          const champ = winner === p.anon;
          const final = inFinal(p.anon);
          // fade eliminated; earlier rounds fade more
          const opacity =
            out != null ? Math.min(0.3 + out * 0.12, 0.65) : 1;
          const tone = champ
            ? 'border-teal bg-teal/15'
            : final
              ? 'border-navy bg-navy text-paper'
              : out != null
                ? 'border-navy/10 bg-paper-2'
                : 'border-navy/20 bg-paper-2';

          return (
            <li
              key={p.anon}
              style={{ opacity }}
              className={`flex items-center justify-between rounded-card border-2 px-3 py-2 transition-opacity ${tone}`}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 font-mono text-xs opacity-60">{p.seed}</span>
                <span className={`font-sans font-bold ${out != null ? 'line-through' : ''}`}>
                  {p.nick ?? 'Anon'}
                </span>
                {p.anon === me && (
                  <span className="font-mono text-[10px] uppercase opacity-70">
                    ({t('you')})
                  </span>
                )}
              </span>
              <span className="font-mono text-xs font-bold">
                {champ
                  ? `🏆 ${t('championBadge')}`
                  : final
                    ? t('finalBadge')
                    : out != null
                      ? t('outRound', { n: out + 1 })
                      : ''}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
