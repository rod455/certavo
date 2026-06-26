/**
 * Generates data/countries-i18n.json from ISO 3166-1 alpha-2 codes using the
 * runtime's ICU data (Intl.DisplayNames). Output is committed to the repo so
 * the app never depends on an external API at runtime. Idempotent.
 *
 *   pnpm gen:countries
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { hasFlag } from 'country-flag-icons';

// ISO 3166-1 alpha-2 — sovereign states + widely-recognized territories.
const ISO_CODES = `
AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW
BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG
ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL
IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT
LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL
NO NP NR NZ OM PA PE PG PH PK PL PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI
SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US
UY UZ VC VE VN VU WS YE ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const LANGS = ['pt', 'en', 'es'] as const;

const display = Object.fromEntries(
  LANGS.map((l) => [l, new Intl.DisplayNames([l], { type: 'region' })]),
) as Record<(typeof LANGS)[number], Intl.DisplayNames>;

type Country = { code: string; name: Record<string, string> };

const countries: Country[] = ISO_CODES.filter(hasFlag)
  .map((code) => {
    const name: Record<string, string> = {};
    for (const l of LANGS) {
      const n = display[l].of(code);
      if (n && n !== code) name[l] = n;
    }
    return { code, name };
  })
  .filter((c) => LANGS.every((l) => c.name[l]))
  .sort((a, b) => a.code.localeCompare(b.code));

const outDir = join(process.cwd(), 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'countries-i18n.json'),
  JSON.stringify(countries, null, 2) + '\n',
);

console.log(`Wrote ${countries.length} countries to data/countries-i18n.json`);
