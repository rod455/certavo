import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { NeymarChain } from '@/components/NeymarChain';
import { TOTAL_MOMENTS, isValidPath } from '@/lib/neymar';

export default function NeymarStepPage({
  params: { locale, step },
  searchParams,
}: {
  params: { locale: Locale; step: string };
  searchParams: { p?: string; by?: string };
}) {
  setRequestLocale(locale);
  const n = Number(step);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_MOMENTS) notFound();

  // The prior answers travel in the URL; they must match how far along we are.
  const path = (searchParams.p ?? '').toUpperCase();
  if (path.length !== n - 1 || !isValidPath(path)) notFound();

  const by = (searchParams.by ?? '').slice(0, 24);
  return <NeymarChain step={n} path={path} by={by} />;
}
