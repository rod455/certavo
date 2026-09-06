import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { CutleGame } from '@/components/cutle/CutleGame';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const title = 'Cutle — Corte no meio';
  const description = 'Divida a figura em duas metades de área igual (50/50). Um desafio novo por dia.';
  const ogUrl = `${SITE_URL}/api/og?kind=neymar&title=${encodeURIComponent('Cutle')}&h=${encodeURIComponent('🔪 Corte no meio')}&sub=${encodeURIComponent(description)}`;
  return {
    title,
    description,
    openGraph: {
      title: `${SITE_NAME} • ${title}`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
  };
}

export default function CutlePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  return <CutleGame />;
}
