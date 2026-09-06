import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { NeymarIntro } from '@/components/NeymarIntro';
import { NeymarStats } from '@/components/NeymarStats';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'neymar' });
  const title = t('title');
  const ogUrl = `${SITE_URL}/api/og?kind=neymar&h=${encodeURIComponent('⚽')}&title=${encodeURIComponent(title)}`;
  return {
    title,
    description: t('subtitle'),
    openGraph: {
      title: `${SITE_NAME} • ${title}`,
      description: t('subtitle'),
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
  };
}

export default function NeymarIntroPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  return (
    <div className="flex flex-col gap-5">
      <NeymarIntro />
      <NeymarStats />
    </div>
  );
}
