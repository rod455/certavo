'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = { pt: 'PT', en: 'EN', es: 'ES' };

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex items-center gap-0.5 font-mono text-[11px] sm:gap-1 sm:text-xs"
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale ? 'true' : undefined}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded px-1.5 py-1 transition-colors sm:px-2 ${
            l === locale
              ? 'bg-navy text-paper'
              : 'text-navy-soft hover:bg-navy/10'
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
