import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { GroupsHub } from '@/components/GroupsHub';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations('groups');
  return { title: t('title') };
}

export default async function GroupsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  return <GroupsHub />;
}
