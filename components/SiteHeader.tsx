import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SITE_NAME } from '@/lib/site';
import { LanguageSwitcher } from './LanguageSwitcher';

export async function SiteHeader() {
  const t = await getTranslations('nav');
  return (
    <header className="border-b-2 border-navy/10 bg-paper/80 backdrop-blur">
      <div className="container-app flex h-14 items-center justify-between">
        <Link
          href="/"
          className="font-sans text-lg font-bold tracking-tight text-navy"
        >
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/ranking" className="font-medium hover:text-emerald">
            {t('ranking')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
