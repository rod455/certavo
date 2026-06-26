import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';
import { todayUtc, challengeNumberForDate } from '@/lib/daily';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const today = challengeNumberForDate(todayUtc());
  const paths = ['', '/ranking', `/d/${today}`];
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const p of paths) {
      entries.push({
        url: `${SITE_URL}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p.startsWith('/d/') ? 'daily' : 'weekly',
        priority: p === '' ? 1 : 0.7,
      });
    }
  }
  return entries;
}
