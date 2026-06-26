import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale, type Locale } from './locales';

export { locales, defaultLocale };
export type { Locale };

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
