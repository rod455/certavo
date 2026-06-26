import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Leaderboard } from '@/components/Leaderboard';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations('ranking');
  return { title: t('title') };
}

export default async function RankingPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('ranking');
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-sans text-2xl font-bold">{t('title')}</h1>
      <Leaderboard />
    </div>
  );
}
