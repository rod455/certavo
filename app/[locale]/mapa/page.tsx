import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { MapaApp } from '@/components/mapa/MapaApp';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const title = 'Mapa do Poder';
  const description =
    'Pague um PIX pro seu candidato dominar cada cidade do Brasil. O mapa é feito de dinheiro, não de opinião.';
  const ogUrl = `${SITE_URL}/api/og?kind=neymar&title=${encodeURIComponent('Mapa do Poder')}&h=${encodeURIComponent('🗺️ Brasil')}&sub=${encodeURIComponent(description)}`;
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

export default function MapaPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  // Full-bleed: break out of the narrow content container for the wide map.
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
      <div className="mx-auto max-w-6xl">
        <MapaApp />
      </div>
    </div>
  );
}
