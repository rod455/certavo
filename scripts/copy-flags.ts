/**
 * Copies the flag SVGs we use into public/flags/ so they can be served as
 * static, lazy-loaded images instead of bundling every flag as a React
 * component into the client JS. Run: pnpm tsx scripts/copy-flags.ts
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import countries from '../data/countries-i18n.json';

const src = join(process.cwd(), 'node_modules', 'country-flag-icons', '3x2');
const dst = join(process.cwd(), 'public', 'flags');
mkdirSync(dst, { recursive: true });

let n = 0;
for (const c of countries as { code: string }[]) {
  const from = join(src, `${c.code}.svg`);
  if (existsSync(from)) {
    copyFileSync(from, join(dst, `${c.code}.svg`));
    n++;
  }
}
console.log(`Copied ${n} flag SVGs to public/flags/`);
