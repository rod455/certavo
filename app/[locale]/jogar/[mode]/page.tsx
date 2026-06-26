import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { GameMode } from '@/lib/types';
import { questionsForTheme, type ThemeKey, THEMES } from '@/lib/content';
import { PracticeGame } from '@/components/PracticeGame';

const VALID_MODES: GameMode[] = ['time_attack', 'sudden_death'];

export default async function PlayPage({
  params: { locale, mode },
  searchParams,
}: {
  params: { locale: Locale; mode: string };
  searchParams: { theme?: string };
}) {
  setRequestLocale(locale);
  if (!VALID_MODES.includes(mode as GameMode)) notFound();

  const tm = await getTranslations('modes');
  const tt = await getTranslations('themes');

  const themeKey: ThemeKey =
    searchParams.theme && searchParams.theme in THEMES
      ? (searchParams.theme as ThemeKey)
      : 'flags';
  const pool = questionsForTheme(themeKey);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="font-sans text-xl font-bold">{tm(mode)}</h1>
        <span className="font-mono text-sm text-navy-soft">{tt(themeKey)}</span>
      </header>
      <PracticeGame mode={mode as GameMode} themeSlug={themeKey} pool={pool} />
    </div>
  );
}
