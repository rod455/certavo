'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getNick, setNick } from '@/lib/anon';

export function NeymarIntro() {
  const t = useTranslations('neymar');
  const router = useRouter();
  const [name, setName] = useState('');

  useEffect(() => setName(getNick()), []);

  function start() {
    const n = name.trim().slice(0, 24);
    if (n) setNick(n);
    router.push(`/neymar/1${n ? `?by=${encodeURIComponent(n)}` : ''}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 text-center">
      <div>
        <span className="text-5xl" aria-hidden>
          ⚽
        </span>
        <h1 className="mt-2 text-balance font-sans text-2xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-pretty text-navy-soft">{t('subtitle')}</p>
      </div>

      <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-4 text-left">
        <p className="text-sm text-navy-soft">{t('howItWorks')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder={t('namePlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && start()}
          className="min-h-[48px] w-full rounded-card border-2 border-navy/20 bg-paper px-4 font-sans"
        />
        <button type="button" onClick={start} className="btn-primary w-full">
          {t('start')} →
        </button>
      </div>
    </div>
  );
}
