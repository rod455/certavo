import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { schibsted, spaceMono } from '../fonts';
import { SiteHeader } from '@/components/SiteHeader';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/site';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#1c2b3a',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const description = SITE_DESCRIPTION[locale] ?? SITE_DESCRIPTION.en;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s • ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      url: SITE_URL,
    },
    twitter: { card: 'summary_large_image', title: SITE_NAME, description },
    alternates: {
      languages: {
        pt: '/pt',
        en: '/en',
        es: '/es',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${schibsted.variable} ${spaceMono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <main className="container-app py-6">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
