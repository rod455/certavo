'use client';

import { useTranslations } from 'next-intl';
import { comboMultiplier } from '@/lib/engine';

export function ComboMeter({ combo }: { combo: number }) {
  const t = useTranslations('game');
  if (combo < 2) return <div className="h-7" aria-hidden />;
  const mult = comboMultiplier(combo).toFixed(2);
  return (
    <div className="flex h-7 items-center justify-center gap-2 font-mono text-sm font-bold text-emerald animate-fade-up">
      <span>🔥 {t('combo', { n: combo })}</span>
      <span className="text-navy-soft">×{mult}</span>
    </div>
  );
}
