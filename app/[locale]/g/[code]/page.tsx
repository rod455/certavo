import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { GroupView } from '@/components/GroupView';

export default async function GroupPage({
  params: { locale, code },
}: {
  params: { locale: Locale; code: string };
}) {
  setRequestLocale(locale);
  return <GroupView code={code.toUpperCase()} />;
}
