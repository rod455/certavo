import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { NeymarFinal } from '@/components/NeymarFinal';
import { buildNeymarStory, isValidPath, TOTAL_MOMENTS } from '@/lib/neymar';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { p?: string; by?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'neymar' });
  const path = (searchParams.p ?? '').toUpperCase();
  const complete = isValidPath(path) && path.length === TOTAL_MOMENTS;
  const title = complete ? buildNeymarStory(path).title : t('title');
  const summary = complete ? buildNeymarStory(path).summary.join(' · ') : '';
  const ogUrl =
    `${SITE_URL}/api/og?kind=neymar` +
    `&title=${encodeURIComponent(t('storyTitle'))}` +
    `&h=${encodeURIComponent(title)}` +
    `&sub=${encodeURIComponent(summary)}`;
  return {
    title: `${title} — ${t('storyTitle')}`,
    description: t('subtitle'),
    openGraph: {
      title: `${SITE_NAME} • ${title}`,
      description: t('subtitle'),
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
  };
}

export default function NeymarFinalPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { p?: string; by?: string };
}) {
  setRequestLocale(locale);
  const path = (searchParams.p ?? '').toUpperCase();
  const by = (searchParams.by ?? '').slice(0, 24);
  return <NeymarFinal path={path} by={by} />;
}
