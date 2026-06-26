import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import {
  dateForChallengeNumber,
  selectDailyQuestions,
  todayUtc,
  challengeNumberForDate,
} from '@/lib/daily';
import { dailyPool } from '@/lib/content';
import { DailyGame } from '@/components/DailyGame';
import { AdSlot } from '@/components/AdSlot';
import { SITE_NAME, SITE_URL } from '@/lib/site';

function parseN(n: string): number | null {
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

export async function generateMetadata({
  params: { locale, n },
}: {
  params: { locale: Locale; n: string };
}): Promise<Metadata> {
  const num = parseN(n);
  if (!num) return {};
  const title = `${SITE_NAME} • #${num}`;
  const ogUrl = `${SITE_URL}/api/og?n=${num}&locale=${locale}`;
  return {
    title,
    openGraph: {
      title,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
    alternates: { canonical: `${SITE_URL}/${locale}/d/${num}` },
  };
}

export default async function DailyPage({
  params: { locale, n },
}: {
  params: { locale: Locale; n: string };
}) {
  setRequestLocale(locale);
  const num = parseN(n);
  if (!num) notFound();

  const today = todayUtc();
  const todayNum = challengeNumberForDate(today);
  // Don't allow playing future challenges.
  if (num > todayNum) notFound();

  const date = dateForChallengeNumber(num);
  const deck = selectDailyQuestions(dailyPool(), date);

  const t = await getTranslations('modes');
  const th = await getTranslations('home');

  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <h1 className="font-sans text-2xl font-bold">
          {t('daily')} #{num}
        </h1>
        <p className="font-mono text-sm text-navy-soft">{date}</p>
        {num !== todayNum && (
          <p className="mt-1 text-sm text-navy-soft">{th('dailyDesc')}</p>
        )}
      </header>
      <DailyGame deck={deck} challengeDate={date} challengeNumber={num} />
      <AdSlot id="daily-bottom" />
    </div>
  );
}
