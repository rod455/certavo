import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import type { GameMode } from '@/lib/types';
import { type ThemeKey, THEMES } from '@/lib/content';
import { PracticeGame } from '@/components/PracticeGame';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const VALID_MODES: GameMode[] = ['time_attack', 'sudden_death'];

export async function generateMetadata({
  params: { locale, mode },
  searchParams,
}: {
  params: { locale: Locale; mode: string };
  searchParams: { theme?: string };
}): Promise<Metadata> {
  if (!VALID_MODES.includes(mode as GameMode)) return {};
  const tm = await getTranslations({ locale, namespace: 'modes' });
  const tt = await getTranslations({ locale, namespace: 'themes' });
  const theme =
    searchParams.theme && searchParams.theme in THEMES
      ? (searchParams.theme as ThemeKey)
      : null;
  const label = theme ? `${tm(mode)} · ${tt(theme)}` : tm(mode);
  const ogUrl = `${SITE_URL}/api/og?locale=${locale}&label=${encodeURIComponent(label)}`;
  return {
    title: label,
    openGraph: {
      title: `${SITE_NAME} • ${label}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
  };
}

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
  const th = await getTranslations('home');
  const tc = await getTranslations('common');

  const chosen: ThemeKey | null =
    searchParams.theme && searchParams.theme in THEMES
      ? (searchParams.theme as ThemeKey)
      : null;

  // Step 2: no theme yet → pick a theme before starting.
  if (!chosen) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <p className="font-mono text-sm uppercase tracking-wide text-navy-soft">
            {tm(mode)}
          </p>
          <h1 className="font-sans text-2xl font-bold">{th('chooseTheme')}</h1>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.values(THEMES).map((theme) => (
            <Link
              key={theme.slug}
              href={`/jogar/${mode}?theme=${theme.slug}`}
              className="flex items-center gap-3 rounded-card border-2 border-navy/15 bg-paper-2 p-5 shadow-tactile-sm transition-transform hover:-translate-y-[1px]"
            >
              <span className="text-3xl" aria-hidden>
                {theme.icon}
              </span>
              <span className="font-sans text-lg font-bold">{tt(theme.slug)}</span>
            </Link>
          ))}
        </div>
        <Link href="/" className="text-center text-sm text-navy-soft underline">
          ← {tc('back')}
        </Link>
      </div>
    );
  }

  // Step 3: theme chosen → play (the deck is generated on the client).
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="font-sans text-xl font-bold">{tm(mode)}</h1>
        <span className="font-mono text-sm text-navy-soft">{tt(chosen)}</span>
      </header>
      <PracticeGame mode={mode as GameMode} themeSlug={chosen} />
    </div>
  );
}
