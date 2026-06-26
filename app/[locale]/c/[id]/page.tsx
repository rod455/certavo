import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { ChampionshipView } from '@/components/ChampionshipView';

export default async function ChampionshipPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  setRequestLocale(locale);
  return <ChampionshipView id={id} />;
}
