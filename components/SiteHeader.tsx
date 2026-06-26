import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import { Logo } from './Logo';

export async function SiteHeader() {
  const t = await getTranslations('nav');
  return (
    <header className="border-b-2 border-navy/10 bg-paper/80 backdrop-blur">
      <div className="container-app flex h-14 items-center justify-between">
        <Link href="/" aria-label="Certavo" className="-ml-0.5">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/grupos" className="font-medium hover:text-teal">
            {t('groups')}
          </Link>
          <Link href="/ranking" className="font-medium hover:text-teal">
            {t('ranking')}
          </Link>
          <NotificationBell />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
