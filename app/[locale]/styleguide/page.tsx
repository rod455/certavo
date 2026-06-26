import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { OptionButton } from '@/components/OptionButton';
import { Flag } from '@/components/Flag';
import { AdSlot } from '@/components/AdSlot';

const SWATCHES = [
  { name: 'paper', var: '--paper' },
  { name: 'navy', var: '--navy' },
  { name: 'teal', var: '--teal' },
  { name: 'error', var: '--error' },
];

export default async function StyleguidePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('styleguide');

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-sans text-2xl font-bold">{t('title')}</h1>
        <p className="text-navy-soft">{t('subtitle')}</p>
      </header>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Colors</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.name} className="rounded-card border-2 border-navy/15 p-2">
              <div
                className="h-16 w-full rounded-md border border-navy/10"
                style={{ background: `rgb(var(${s.var}))` }}
              />
              <div className="mt-2 font-mono text-xs">
                {s.name}
                <br />
                <span className="text-navy-soft">{s.var}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Type</h2>
        <p className="font-sans text-3xl font-bold">Schibsted Grotesk — Aa Bb Cc</p>
        <p className="font-mono text-2xl">Space Mono — 0123456789</p>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">Primary</button>
          <button className="btn-ghost">Ghost</button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Options</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <OptionButton index={0} label="Brasil" flagCode="BR" state="idle" />
          <OptionButton index={1} label="Argentina" flagCode="AR" state="correct" />
          <OptionButton index={2} label="Alemanha" flagCode="DE" state="wrong" />
          <OptionButton index={3} label="Japão" flagCode="JP" state="disabled" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Flags</h2>
        <div className="flex gap-3">
          {['BR', 'US', 'FR', 'JP', 'ZA'].map((c) => (
            <Flag key={c} code={c} className="h-10 w-16" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-sm uppercase tracking-wide">Ad slot</h2>
        <AdSlot id="styleguide" />
      </section>
    </div>
  );
}
