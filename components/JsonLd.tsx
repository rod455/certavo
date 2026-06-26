import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_LOGO_URL } from '@/lib/site';
import type { Locale } from '@/i18n/routing';

/** Structured data so the game is eligible for rich results / GEO surfaces. */
export function JsonLd({ locale }: { locale: Locale }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'Game'],
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    logo: SITE_LOGO_URL,
    image: SITE_LOGO_URL,
    description: SITE_DESCRIPTION[locale] ?? SITE_DESCRIPTION.en,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: locale,
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
