import { useTranslations } from 'next-intl';

/**
 * Ad placeholder. Monetization is a later phase — this renders a non-intrusive
 * placeholder now and is the single integration point for web ads (and, via a
 * native wrapper, AdMob) in the future. See README "Monetization".
 */
export function AdSlot({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const t = useTranslations('ads');
  return (
    <div
      data-ad-slot={id}
      aria-hidden
      className={`flex min-h-[72px] items-center justify-center rounded-card border-2 border-dashed border-navy/20 text-xs uppercase tracking-wide text-navy/40 ${className}`}
    >
      {t('placeholder')}
    </div>
  );
}
