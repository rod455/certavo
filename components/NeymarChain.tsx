'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { whatsappLink } from '@/lib/share';
import { SITE_URL } from '@/lib/site';
import { MOMENTS, TOTAL_MOMENTS, type MomentOption } from '@/lib/neymar';

export function NeymarChain({
  step,
  path,
  by,
}: {
  step: number; // 1-indexed momento
  path: string; // prior answers (length step-1)
  by: string;
}) {
  const t = useTranslations('neymar');
  const locale = useLocale();
  const moment = MOMENTS[step - 1];

  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const [chosen, setChosen] = useState<MomentOption | null>(null);
  if (!moment) return null;

  const byQ = by ? `&by=${encodeURIComponent(by)}` : '';
  const isLast = step === TOTAL_MOMENTS;

  // ----- after answering: show consequence + pass the chain along -----
  if (chosen) {
    const newPath = path + chosen.key;
    const remaining = TOTAL_MOMENTS - newPath.length;
    const nextRel = isLast
      ? `/neymar/final?p=${newPath}${byQ}`
      : `/neymar/${step + 1}?p=${newPath}${byQ}`;
    const nextAbs = `${origin}/${locale}${nextRel}`;
    const waMsg = `${t('waContinue', { n: step + 1 })} ${nextAbs}`;

    return (
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="rounded-card border-2 border-teal/40 bg-teal/10 p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-teal">
            {chosen.label}
          </p>
          <p className="mt-1 text-pretty font-sans">{chosen.consequence}</p>
        </div>

        {isLast ? (
          <>
            <p className="text-center font-sans text-lg font-bold">{t('lastRemaining')}</p>
            <Link href={nextRel} className="btn-primary w-full text-center">
              {t('reveal')} →
            </Link>
          </>
        ) : (
          <>
            <p className="text-center font-sans">
              <span className="font-bold">{t('remaining', { n: remaining })}</span>
              <br />
              <span className="text-navy-soft">{t('passItOn')}</span>
            </p>
            <a
              href={whatsappLink(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full border-transparent font-bold text-white shadow-tactile"
              style={{ background: '#25D366' }}
            >
              💬 {t('sendFriend')}
            </a>
            <CopyLink text={nextAbs} label={t('copyLink')} copied={t('copied')} />
            <Link
              href={nextRel}
              className="text-center text-sm text-navy-soft underline"
            >
              {t('continueSelf')}
            </Link>
          </>
        )}
      </div>
    );
  }

  // ----- the question -----
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-navy-soft">
          {t('questionOf', { n: step, total: TOTAL_MOMENTS })}
        </p>
        {by && (
          <p className="mt-2 text-pretty text-sm text-navy-soft">
            <span className="font-bold text-navy">{t('sentBy', { name: by })}</span>{' '}
            {t('yourAnswerMatters')}
          </p>
        )}
      </header>

      <div className="rounded-card border-2 border-navy bg-navy p-5 text-paper">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-soft">
          {moment.year} · {moment.title}
        </p>
        <h1 className="mt-2 text-balance font-sans text-xl font-bold">{moment.prompt}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {moment.options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setChosen(opt)}
            className="rounded-card border-2 border-navy/15 bg-paper-2 p-4 text-left shadow-tactile-sm transition-transform hover:-translate-y-[1px] active:translate-y-0"
          >
            <span className="font-sans text-lg font-bold">{opt.choice}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-navy-soft">{t('spoilerHint')}</p>
    </div>
  );
}

function CopyLink({ text, label, copied }: { text: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="text-center text-sm text-navy-soft underline"
    >
      {done ? copied : label}
    </button>
  );
}
