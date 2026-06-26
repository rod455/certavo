import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { todayUtc, challengeNumberForDate } from '@/lib/daily';
import { THEMES } from '@/lib/content';
import { AdSlot } from '@/components/AdSlot';
import { JsonLd } from '@/components/JsonLd';

const PRACTICE_MODES = ['time_attack', 'sudden_death'] as const;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tm = await getTranslations('modes');
  const tt = await getTranslations('themes');
  const challenge = challengeNumberForDate(todayUtc());

  return (
    <div className="flex flex-col gap-8">
      <JsonLd locale={locale} />
      <section className="text-center">
        <h1 className="text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-navy-soft">
          {t('subtitle')}
        </p>
      </section>

      {/* Daily challenge — the viral core */}
      <section>
        <Link
          href={`/d/${challenge}`}
          className="block rounded-card border-2 border-navy bg-teal p-6 text-paper shadow-tactile transition-transform active:translate-y-[2px] active:shadow-none"
        >
          <div className="font-mono text-sm uppercase tracking-wide opacity-90">
            {tm('daily')} #{challenge}
          </div>
          <div className="mt-1 font-sans text-2xl font-bold">
            {t('playDaily')} →
          </div>
          <p className="mt-1 text-sm opacity-90">{t('dailyDesc')}</p>
        </Link>
      </section>

      {/* Practice modes */}
      <section>
        <h2 className="mb-3 font-sans text-lg font-bold">{t('chooseMode')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRACTICE_MODES.map((mode) => (
            <Link
              key={mode}
              href={`/jogar/${mode}`}
              className="rounded-card border-2 border-navy/15 bg-paper-2 p-4 shadow-tactile-sm transition-transform hover:-translate-y-[1px]"
            >
              <div className="font-sans text-lg font-bold">{tm(mode)}</div>
              <p className="mt-1 text-sm text-navy-soft">{tm(`${mode}Desc`)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Themes */}
      <section>
        <h2 className="mb-3 font-sans text-lg font-bold">{t('chooseTheme')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(THEMES).map((theme) => (
            <Link
              key={theme.slug}
              href={`/jogar/time_attack?theme=${theme.slug}`}
              className="flex items-center gap-3 rounded-card border-2 border-navy/15 bg-paper-2 p-4 shadow-tactile-sm transition-transform hover:-translate-y-[1px]"
            >
              <span className="text-2xl" aria-hidden>
                {theme.icon}
              </span>
              <span className="font-sans font-bold">{tt(theme.slug)}</span>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot id="home-bottom" />
    </div>
  );
}
